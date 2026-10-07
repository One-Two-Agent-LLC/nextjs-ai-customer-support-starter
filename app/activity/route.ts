import { getCurrentSession } from "@/lib/auth";
import { recordDemoActivity } from "@/lib/session";
import { allowedMutation, denied, seeOther } from "@/lib/form";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowedMutation(request)) return denied();
  const session = await getCurrentSession();
  if (!session)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  await recordDemoActivity(session);
  return seeOther(request);
}
