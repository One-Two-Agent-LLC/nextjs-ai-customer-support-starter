"use client";
import { useEffect } from "react";
import { getWidgetIdentity } from "@onetwoagent/integration/browser";
export function OneTwoAgentIdentity({ signedIn }: { signedIn: boolean }) {
  useEffect(() => {
    const identity = getWidgetIdentity();
    const stop = identity.start();
    if (signedIn) void identity.refresh();
    else identity.invalidate();
    return stop;
  }, [signedIn]);
  return null;
}
export function SignOutButton() {
  return (
    <form
      method="post"
      action="/logout"
      onSubmit={() => getWidgetIdentity().invalidate()}
    >
      <button className="quiet" type="submit">
        End demo session
      </button>
    </form>
  );
}
export function SwitchWorkspaceButton({
  slot,
  label,
}: {
  slot: string;
  label: string;
}) {
  return (
    <form
      method="post"
      action="/workspace"
      onSubmit={() => getWidgetIdentity().invalidate()}
    >
      <input type="hidden" name="slot" value={slot} />
      <button className="workspace-switch" type="submit">
        {label}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
