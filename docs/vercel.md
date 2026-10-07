# Vercel packaging

Use Next.js / Node 22.x / npm ci / npm run build. No monorepo root, external source path or runtime filesystem write is required. Database setup is an explicit owner operation, never a deploy hook.

## Deploy button

Public source: https://github.com/One-Two-Agent-LLC/nextjs-ai-customer-support-starter. The button imports this repository; connection, explicit database initialization and account-read approval remain required:

```text
https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOne-Two-Agent-LLC%2Fnextjs-ai-customer-support-starter&repository-name=nextjs-ai-customer-support-starter&env=APP_DATABASE_URL%2CONETWOAGENT_BUSINESS_ID%2CONETWOAGENT_WIDGET_PUBLIC_ID%2CONETWOAGENT_WIDGET_IDENTITY_SECRET%2CDEMO_ACCESS_ENABLED&envDescription=Use+a+dedicated+demo+database+and+CLI-issued+server+credentials.+Set+DEMO_ACCESS_ENABLED%3Dtrue+only+for+synthetic+demo+sessions.&envLink=https%3A%2F%2Fgithub.com%2FOne-Two-Agent-LLC%2Fnextjs-ai-customer-support-starter%23environment-variables
```

Use the official image `https://vercel.com/button`. The URL contains variable **names**, never values. Read credential is set after the reachable HTTPS endpoint is approved; it is not required to create the first incomplete deployment. Set DEMO_ACCESS_ENABLED=true only for this isolated synthetic example.

The button contains only environment-variable names and documentation links. Supply values privately in your own project. It does not include our workspace, credentials, database or AI allowance.

## Submission checklist

- Owner-approved public repository and license; no credentials/private reports.
- Working demo with account lookup, isolation and human takeover evidence.
- README and validated Deploy button.
- Desktop/mobile screenshots, a clean thumbnail at least 630px tall within Vercel's accepted aspect-ratio range.
- Confirm publisher/contact and appropriate template categories.
- Public demo abuse controls and service usage budget.
- Submit only after explicit owner approval; acceptance is Vercel's decision.

References: https://vercel.com/docs/deploy-button and https://vercel.com/templates/submit . Requirements were checked in the approved packaging plan on 2026-10-07; recheck before actual submission.
