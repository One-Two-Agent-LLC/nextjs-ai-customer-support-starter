import { createAccountLookupWebHandler } from "@onetwoagent/integration/server";
import { config } from "@/lib/onetwoagent/config";
import {
  isSessionLive,
  readSection,
  readView,
} from "@/lib/onetwoagent/account-data";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = config.businessId
  ? createAccountLookupWebHandler({
      readCredential: process.env.ONETWOAGENT_ACCOUNT_READ_CREDENTIAL,
      businessId: config.businessId,
      allowedSections: ["usage"],
      allowedViews: ["projects"],
      isSessionLive,
      readSection,
      readView,
    })
  : null;
export async function POST(request: Request) {
  return handler
    ? handler(request)
    : Response.json(
        { error: "unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
}
