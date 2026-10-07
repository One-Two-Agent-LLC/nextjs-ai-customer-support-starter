import { cookies } from "next/headers";
import { startDemo, SESSION_COOKIE, sessionFromToken } from "@/lib/session";
import { allowedMutation, denied, seeOther, sessionCookie } from "@/lib/form";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowedMutation(request)) return denied();
  if (process.env.DEMO_ACCESS_ENABLED !== "true")
    return Response.json({ error: "demo_disabled" }, { status: 403 });
  try {
    const existing = await sessionFromToken(
      (await cookies()).get(SESSION_COOKIE)?.value,
    );
    if (existing) return seeOther(request);
    return seeOther(request, sessionCookie(request, await startDemo()));
  } catch {
    return Response.json(
      { error: "demo_temporarily_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
