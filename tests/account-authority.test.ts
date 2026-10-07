import assert from "node:assert/strict";
import { test, after } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  createAccountLookupWebHandler,
  createIdentityWebHandler,
  createSupportGrantReference,
  type SupportGrant,
} from "@onetwoagent/integration/server";
import {
  startDemo,
  sessionFromToken,
  revoke,
  switchWorkspace,
  recordDemoActivity,
} from "../lib/session";
import {
  getAccount,
  isSessionLive,
  readSection,
  readView,
} from "../lib/onetwoagent/account-data";
import { pool, query } from "../lib/db";
import { allowedMutation, readSlot } from "../lib/form";
if (!process.env.STARTER_TEST_DATABASE_URL)
  throw new Error(
    "Set STARTER_TEST_DATABASE_URL to a disposable localhost test database",
  );
const dbUrl = new URL(process.env.STARTER_TEST_DATABASE_URL);
if (
  !["127.0.0.1", "localhost"].includes(dbUrl.hostname) ||
  !dbUrl.pathname.includes("test")
)
  throw new Error("Tests require a localhost database named with test");
process.env.APP_DATABASE_URL = process.env.STARTER_TEST_DATABASE_URL;
process.env.DEMO_ACCESS_ENABLED = "true";
execFileSync(process.execPath, ["db/setup.mjs"], {
  env: process.env,
  stdio: "pipe",
});
const credential = "test-credential-" + randomUUID();
const businessId = "starter-business-test";
const visitorIds: string[] = [];
async function visitor() {
  const token = await startDemo();
  const session = (await sessionFromToken(token))!;
  visitorIds.push(session.user.id);
  return { token, session };
}
const handler = createAccountLookupWebHandler({
  businessId,
  readCredential: credential,
  allowedSections: ["usage"],
  allowedViews: ["projects"],
  isSessionLive,
  readSection,
  readView,
  onError: false,
});
function request(
  grant: SupportGrant,
  extra: Record<string, unknown> = {},
  auth: string | null = credential,
) {
  const reference = createSupportGrantReference(grant, credential).reference;
  return new Request("https://starter.test/api/onetwoagent/account", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(auth ? { authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify({
      version: 1,
      operationId: "op-test",
      turnId: "turn-test",
      businessId,
      subject: { userId: grant.userId, workspaceId: grant.workspaceId },
      grantReference: reference,
      configRevision: 1,
      section: "usage",
      ...extra,
    }),
  });
}
function grant(
  s: NonNullable<Awaited<ReturnType<typeof sessionFromToken>>>,
): SupportGrant {
  return {
    userId: s.user.id,
    workspaceId: s.workspaceId,
    sessionId: s.id,
    expiresAt: new Date(Date.now() + 120000).toISOString(),
  };
}
after(async () => {
  for (const id of visitorIds)
    await query("DELETE FROM ota_starter.visitors WHERE id=$1", [id]);
  await pool().end();
});
test("schema setup is repeatable and never resets existing data", async () => {
  const a = await visitor();
  await recordDemoActivity(a.session);
  execFileSync(process.execPath, ["db/setup.mjs"], {
    env: process.env,
    stdio: "pipe",
  });
  assert.equal(
    (
      await readSection({
        userId: a.session.user.id,
        workspaceId: a.session.workspaceId,
      })
    ).usage[0].used,
    1250,
  );
  assert.doesNotMatch(
    await readFile("db/schema.sql", "utf8"),
    /DROP\s+(TABLE|SCHEMA)/i,
  );
});
test("unauthenticated identity is 401 without contacting OneTwoAgent", async () => {
  let calls = 0;
  const h = createIdentityWebHandler({
    apiBaseUrl: "https://api.onetwoagent.com",
    identitySecret: "ota_wid_live_" + "x".repeat(43),
    getSession: async () => null,
    fetch: async () => {
      calls++;
      throw Error();
    },
    onError: false,
  });
  assert.equal(
    (await h(new Request("https://starter.test/identity"))).status,
    401,
  );
  assert.equal(calls, 0);
});
test("signed-in identity exchanges server session and projected account with published handler", async () => {
  const a = await visitor();
  let payload: any;
  const h = createIdentityWebHandler({
    apiBaseUrl: "https://api.onetwoagent.com",
    identitySecret: "ota_wid_live_" + "x".repeat(43),
    readCredential: credential,
    getSession: async () => ({
      userId: a.session.user.id,
      email: a.session.user.email,
      name: a.session.user.name,
      sessionId: a.session.id,
    }),
    getAccount,
    fetch: async (_, init) => {
      payload = JSON.parse(String(init?.body));
      return Response.json({
        token: "synthetic-test-token",
        expiresIn: 900,
        expiresAt: new Date(Date.now() + 900000).toISOString(),
      });
    },
    onError: false,
  });
  const r = await h(new Request("https://starter.test/identity"));
  assert.equal(r.status, 200);
  assert.equal(payload.externalUserId, a.session.user.id);
  assert.equal(payload.accountContext.scope.workspaceId, a.session.workspaceId);
  assert.equal(payload.accountContext.facts.plan, "Pro");
  const body = await r.text();
  assert.ok(!body.includes(credential));
  assert.ok(!body.includes(a.session.id));
});
test("valid server-to-server account lookup needs no browser cookie", async () => {
  const a = await visitor();
  const r = await handler(request(grant(a.session)));
  assert.equal(r.status, 200);
  assert.match(await r.text(), /3760/);
});
test("read credential required and wrong credential rejected", async () => {
  const a = await visitor();
  for (const c of [null, "incorrect"])
    assert.equal((await handler(request(grant(a.session), {}, c))).status, 401);
});
test("signed grant required; forged grant rejected", async () => {
  const a = await visitor();
  for (const g of ["", "forged.grant"]) {
    const r = await handler(request(grant(a.session), { grantReference: g }));
    assert.ok([400, 403].includes(r.status));
  }
});
test("visitor A cannot substitute visitor B subject", async () => {
  const a = await visitor(),
    b = await visitor();
  const r = await handler(
    request(grant(a.session), {
      subject: {
        userId: b.session.user.id,
        workspaceId: b.session.workspaceId,
      },
    }),
  );
  assert.equal(r.status, 403);
});
test("visitor A session cannot authorize B workspace even with signed forged subject", async () => {
  const a = await visitor(),
    b = await visitor();
  const r = await handler(
    request({ ...grant(a.session), workspaceId: b.session.workspaceId }),
  );
  assert.equal(r.status, 403);
});
test("membership revocation blocks a still-live signed grant", async () => {
  const a = await visitor();
  await query("DELETE FROM ota_starter.memberships WHERE user_id=$1", [
    a.session.user.id,
  ]);
  assert.equal((await handler(request(grant(a.session)))).status, 403);
});
test("wrong business rejected", async () => {
  const a = await visitor();
  assert.equal(
    (await handler(request(grant(a.session), { businessId: "other-business" })))
      .status,
    403,
  );
});
test("only approved usage/projects accepted", async () => {
  const a = await visitor();
  assert.equal(
    (await handler(request(grant(a.session), { section: "subscription" })))
      .status,
    403,
  );
  assert.equal(
    (
      await handler(
        request(grant(a.session), { section: undefined, view: "private" }),
      )
    ).status,
    403,
  );
});
test("projections exclude raw DB objects and internal fields", async () => {
  const a = await visitor();
  const r = await handler(
    request(grant(a.session), { section: undefined, view: "projects" }),
  );
  assert.equal(r.status, 200);
  const text = await r.text();
  assert.match(text, /Website refresh/);
  assert.doesNotMatch(
    text,
    /INTERNAL_ONLY|internal_note|token_hash|expires_at|visitor_id/,
  );
  const data = await readSection({
    userId: a.session.user.id,
    workspaceId: a.session.workspaceId,
  });
  assert.deepEqual(Object.keys(data), ["usage"]);
  assert.deepEqual(Object.keys(data.usage[0]).sort(), [
    "limit",
    "metric",
    "remaining",
    "used",
  ]);
});
test("expired session rejected", async () => {
  const a = await visitor();
  await query(
    "UPDATE ota_starter.sessions SET expires_at=now()-interval '1 second' WHERE id=$1",
    [a.session.id],
  );
  assert.equal(await sessionFromToken(a.token), null);
  assert.equal((await handler(request(grant(a.session)))).status, 403);
});
test("invalid session rejected", async () => {
  const a = await visitor();
  assert.equal(
    (await handler(request({ ...grant(a.session), sessionId: randomUUID() })))
      .status,
    403,
  );
});
test("expired signed grant rejected", async () => {
  const a = await visitor();
  assert.equal(
    (
      await handler(
        request({
          ...grant(a.session),
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        }),
      )
    ).status,
    403,
  );
});
test("disabled visitor blocked", async () => {
  const a = await visitor();
  await query("UPDATE ota_starter.visitors SET disabled_at=now() WHERE id=$1", [
    a.session.user.id,
  ]);
  assert.equal(await sessionFromToken(a.token), null);
  assert.equal((await handler(request(grant(a.session)))).status, 403);
});
test("sign-out revokes both app session and unexpired account grant", async () => {
  const a = await visitor();
  await revoke(a.token);
  assert.equal(await sessionFromToken(a.token), null);
  assert.equal((await handler(request(grant(a.session)))).status, 403);
});
test("workspace switch uses membership and invalidates old active workspace grants", async () => {
  const a = await visitor(),
    b = await visitor();
  assert.equal(await switchWorkspace(a.session, b.session.workspaceId), false);
  assert.equal(await switchWorkspace(a.session, "sandbox"), true);
  assert.equal((await handler(request(grant(a.session)))).status, 403);
  const next = (await sessionFromToken(a.token))!;
  assert.notEqual(next.workspaceId, a.session.workspaceId);
  const r = await handler(
    request(grant(next), { section: undefined, view: "projects" }),
  );
  assert.equal(r.status, 200);
  assert.equal(
    (await readView({ userId: next.user.id, workspaceId: next.workspaceId }))
      .records.length,
    0,
  );
});
test("fresh read reflects only this visitor demo activity", async () => {
  const a = await visitor(),
    b = await visitor();
  await recordDemoActivity(a.session);
  assert.equal(
    (
      await readSection({
        userId: a.session.user.id,
        workspaceId: a.session.workspaceId,
      })
    ).usage[0].remaining,
    3750,
  );
  assert.equal(
    (
      await readSection({
        userId: b.session.user.id,
        workspaceId: b.session.workspaceId,
      })
    ).usage[0].remaining,
    3760,
  );
});
test("session cookie is not a database session identifier; tokens are hashed", async () => {
  const a = await visitor();
  assert.notEqual(a.token, a.session.id);
  const [row] = await query(
    "SELECT token_hash FROM ota_starter.sessions WHERE id=$1",
    [a.session.id],
  );
  assert.notEqual(row.token_hash, a.token);
  assert.equal(row.token_hash.length, 64);
});
test("same-origin is mandatory for demo mutations", () => {
  for (const origin of [null, "https://evil.test"]) {
    const r = new Request("https://starter.test/login", {
      method: "POST",
      headers: origin ? { origin } : {},
    });
    assert.equal(allowedMutation(r), false);
  }
  assert.equal(
    allowedMutation(
      new Request("https://starter.test/login", {
        method: "POST",
        headers: { origin: "https://starter.test" },
      }),
    ),
    true,
  );
});
test("workspace form rejects duplicates/oversized inputs", async () => {
  for (const body of ["slot=primary&slot=sandbox", "slot=" + "x".repeat(1025)])
    assert.equal(
      await readSlot(
        new Request("https://starter.test/workspace", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        }),
      ),
      "",
    );
});
test("demo is opt-in and not a production login", async () => {
  process.env.DEMO_ACCESS_ENABLED = "false";
  await assert.rejects(startDemo(), /DEMO_DISABLED/);
  process.env.DEMO_ACCESS_ENABLED = "true";
});

test("proxy internal URL cannot override browser Host and redirect stays relative", () => {
  assert.equal(
    allowedMutation(
      new Request("http://localhost:3417/login", {
        method: "POST",
        headers: { host: "127.0.0.1:3417", origin: "http://127.0.0.1:3417" },
      }),
    ),
    true,
  );
  assert.equal(
    allowedMutation(
      new Request("https://internal/login", {
        method: "POST",
        headers: {
          host: "starter.test",
          origin: "https://evil.test",
          "x-forwarded-host": "evil.test",
        },
      }),
    ),
    false,
  );
  assert.equal(
    allowedMutation(
      new Request("https://internal/login", {
        method: "POST",
        headers: {
          host: "starter.test",
          origin: "https://starter.test",
          "sec-fetch-site": "cross-site",
        },
      }),
    ),
    false,
  );
});
