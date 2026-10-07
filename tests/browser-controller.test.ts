import assert from "node:assert/strict";
import { test } from "node:test";
import { getWidgetIdentity } from "@onetwoagent/integration/browser";
function browser() {
  const win: any = new EventTarget();
  win.setTimeout = setTimeout;
  win.clearTimeout = clearTimeout;
  win.location = { origin: "https://app.test" };
  win.identities = [];
  win.resets = 0;
  win.OneTwoAgent = {
    identify: async (t: string) => {
      win.identities.push(t);
    },
    reset: () => {
      win.resets++;
    },
  };
  win.fetch = async () =>
    Response.json({ token: "token-for-a", expiresIn: 900 });
  return win;
}
test("sign-in refresh identifies; sign-out invalidates", async () => {
  const win = browser();
  const identity = getWidgetIdentity({
    win,
    fetch: (...args: any[]) => win.fetch(...args),
  } as any);
  const stop = identity.start();
  assert.equal(await identity.refresh(), "identified");
  assert.deepEqual(win.identities, ["token-for-a"]);
  identity.invalidate();
  assert.equal(win.resets, 1);
  stop();
});
test("workspace invalidate drops late identity then refreshes new workspace", async () => {
  const win = browser();
  let resolve!: (r: Response) => void;
  win.fetch = () =>
    new Promise<Response>((r) => {
      resolve = r;
    });
  const identity = getWidgetIdentity({
    win,
    fetch: (...args: any[]) => win.fetch(...args),
  } as any);
  const old = identity.refresh();
  await new Promise((r) => setTimeout(r, 0));
  identity.invalidate();
  resolve(Response.json({ token: "stale", expiresIn: 900 }));
  assert.equal(await old, "superseded");
  assert.deepEqual(win.identities, []);
  win.fetch = async () =>
    Response.json({ token: "workspace-b", expiresIn: 900 });
  assert.equal(await identity.refresh(), "identified");
  assert.deepEqual(win.identities, ["workspace-b"]);
});
