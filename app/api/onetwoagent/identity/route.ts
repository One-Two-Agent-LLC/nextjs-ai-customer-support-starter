import { createIdentityWebHandler } from "@onetwoagent/integration/server";
import { config } from "@/lib/onetwoagent/config";
import { getCurrentSession } from "@/lib/auth";
import { getAccount } from "@/lib/onetwoagent/account-data";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session)
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  return createIdentityWebHandler({
    apiBaseUrl: config.apiBaseUrl,
    identitySecret: process.env.ONETWOAGENT_WIDGET_IDENTITY_SECRET,
    readCredential: process.env.ONETWOAGENT_ACCOUNT_READ_CREDENTIAL,
    getSession: async () => ({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      sessionId: session.id,
    }),
    getAccount,
  })(request);
}
