# Deployment acceptance

Record commit/source manifest, deployment URL/ID and time. Use only synthetic demo data; never a customer database. Do not publish raw grants, identity responses, cookies or Inbox IDs.

1. In a fresh browser, confirm anonymous identity is 401, homepage works and there is one real widget.
2. Start a demo. Confirm Northstar Studio Pro, 1,240 used / 5,000 total / 3,760 remaining and two projects. Ask the widget for remaining credits and project status.
3. Record demo activity. Ask a new question and verify fresh data: 1,250 used / 3,750 remaining.
4. In another isolated browser, start a new session. It must show original values and no first visitor history.
5. Switch the first visitor to Sandbox: 12 used / 100 total / 88 remaining, no projects. Verify widget identity/history scope follows the switch. Old grants must fail.
6. End the session. Anonymous identity must be 401; old signed-in context must not remain visible. Reload/new session must not revive it.
7. Ask for a person. In the dedicated workspace owner's Inbox, take over and send a clearly synthetic test reply. Verify it appears in that visitor's widget; another visitor must not see it. No public operator credentials.
8. Run doctor against the exact HTTPS target. Save redacted output and distinguish manual checks from pass.
9. Check mobile 375px, desktop, console errors, request failures, widget count and no shared caching. Inspect payloads for forbidden secrets without saving raw tokens.

Automated local browser tests prove the application session/DB flow, not hosted inference or Inbox delivery. Do not mark this checklist complete solely because the build or doctor passes.
