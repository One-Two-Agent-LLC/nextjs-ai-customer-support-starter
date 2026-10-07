import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { query, transaction } from "./db";
export const SESSION_COOKIE = "ota_demo_session";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export type Session = {
  id: string;
  workspaceId: string;
  user: { id: string; email: string; name: string };
};
export async function sessionFromToken(
  token?: string,
): Promise<Session | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [r] = await query(
    `SELECT s.id, s.workspace_id, v.id AS user_id, v.email, v.name FROM ota_starter.sessions s
    JOIN ota_starter.visitors v ON v.id=s.user_id JOIN ota_starter.memberships m ON m.user_id=s.user_id AND m.workspace_id=s.workspace_id
    WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND v.expires_at>now() AND v.disabled_at IS NULL`,
    [hash(token)],
  );
  return r
    ? {
        id: r.id,
        workspaceId: r.workspace_id,
        user: { id: r.user_id, email: r.email, name: r.name },
      }
    : null;
}
export async function startDemo() {
  if (process.env.DEMO_ACCESS_ENABLED !== "true")
    throw new Error("DEMO_DISABLED");
  return transaction(async (db) => {
    await db.query(
      "SELECT pg_advisory_xact_lock(hashtext('ota_starter_demo_limit'))",
    );
    await db.query("DELETE FROM ota_starter.visitors WHERE expires_at<now()");
    const cap = await db.query(
      "SELECT count(*)::int AS n FROM ota_starter.visitors",
    );
    if (cap.rows[0].n >= 200) throw new Error("DEMO_CAPACITY");
    const id = randomUUID(),
      primary = randomUUID(),
      sandbox = randomUUID(),
      sessionId = randomUUID(),
      token = randomBytes(32).toString("base64url");
    await db.query(
      "INSERT INTO ota_starter.visitors(id,email,name,expires_at) VALUES($1,$2,'Demo customer',now()+interval '2 hours')",
      [id, `demo-${id}@example.test`],
    );
    for (const [ws, slot, name, plan, used, quota] of [
      [primary, "primary", "Northstar Studio", "Pro", 1240, 5000],
      [sandbox, "sandbox", "Sandbox", "Free", 12, 100],
    ] as const) {
      await db.query(
        "INSERT INTO ota_starter.workspaces(id,visitor_id,slot,name,plan) VALUES($1,$2,$3,$4,$5)",
        [ws, id, slot, name, plan],
      );
      await db.query(
        "INSERT INTO ota_starter.memberships VALUES($1,$2,'Owner')",
        [id, ws],
      );
      await db.query("INSERT INTO ota_starter.usage VALUES($1,$2,$3)", [
        ws,
        used,
        quota,
      ]);
    }
    for (const [name, status, tasks, description] of [
      ["Website refresh", "At risk", 7, "Waiting on the final design review."],
      [
        "Customer onboarding",
        "On track",
        3,
        "The new checklist is ready for testing.",
      ],
    ] as const) {
      await db.query(
        "INSERT INTO ota_starter.projects(id,workspace_id,name,status,open_tasks,description,internal_note) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          randomUUID(),
          primary,
          name,
          status,
          tasks,
          description,
          "INTERNAL_ONLY_NOT_FOR_SUPPORT",
        ],
      );
    }
    await db.query(
      "INSERT INTO ota_starter.sessions(id,token_hash,user_id,workspace_id,expires_at) VALUES($1,$2,$3,$4,now()+interval '1 hour')",
      [sessionId, hash(token), id, primary],
    );
    return token;
  });
}
export async function revoke(token?: string) {
  if (token)
    await query(
      "UPDATE ota_starter.sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL",
      [hash(token)],
    );
}
export async function switchWorkspace(session: Session, slot: string) {
  if (!["primary", "sandbox"].includes(slot)) return false;
  const rows = await query(
    `UPDATE ota_starter.sessions s SET workspace_id=w.id FROM ota_starter.workspaces w
    JOIN ota_starter.memberships m ON m.workspace_id=w.id
    WHERE s.id=$1 AND s.user_id=$2 AND m.user_id=s.user_id AND w.visitor_id=s.user_id AND w.slot=$3
    AND s.revoked_at IS NULL AND s.expires_at>now() RETURNING s.id`,
    [session.id, session.user.id, slot],
  );
  return rows.length === 1;
}
export async function recordDemoActivity(session: Session) {
  return query(
    `UPDATE ota_starter.usage u SET used=LEAST(used+10,quota) FROM ota_starter.sessions s
    JOIN ota_starter.memberships m ON m.user_id=s.user_id AND m.workspace_id=s.workspace_id
    WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.workspace_id=s.workspace_id RETURNING u.used`,
    [session.id, session.user.id],
  );
}
