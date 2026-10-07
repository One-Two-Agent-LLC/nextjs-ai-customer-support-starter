# Security boundary

This is a synthetic demonstration, not an authentication provider or a production login starter.

- Use a dedicated PostgreSQL database and OneTwoAgent demo workspace.
- Every visitor gets independent identities, memberships, workspaces and opaque session tokens. Only hashes are stored. Cookies are HttpOnly, SameSite=Lax and Secure on HTTPS.
- Mutations require same-origin Origin/Host and reject cross-site requests. Workspace selectors are constrained to the visitor's memberships.
- Identity and account code is server-only. No identity secret, read credential or database URL goes to browser bundles.
- Fresh account reads use the published credential/grant protocol plus live session, expiry, active workspace, visitor and membership checks. Browser cookies do not authorize server-to-server reads.
- Projections are bounded; internal notes and raw rows are excluded. No write endpoint is given to OneTwoAgent.
- Build metadata contains only connection IDs and API origin. No request depends on a writable filesystem.
- Session-scoped pages are dynamic; API responses use no-store. Do not introduce shared caching of user data.
- Demo allocation is opt-in, capped and expiring. Before a public launch configure platform rate limits and AI budgets. This does not claim to solve arbitrary abuse.
- Deleting expired local fixture data does not delete OneTwoAgent conversation history. The workspace owner must separately manage retained demo conversations.

Never commit `.env*` (except the blank example), `.onetwoagent.json`, `.vercel`, browser storage, signed grants, raw identity responses or deployment credentials. Do not attach secrets to public issues. Report suspected issues privately through the OneTwoAgent contact route before publishing exploit details. A dedicated security reporting channel remains a publication-owner check.
