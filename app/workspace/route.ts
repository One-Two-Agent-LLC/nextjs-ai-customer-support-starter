import { getCurrentSession } from "@/lib/auth";
import { switchWorkspace } from "@/lib/session";
import { allowedMutation, denied, seeOther, readSlot } from "@/lib/form";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowedMutation(request)) return denied();
  const session = await getCurrentSession();
  if (!session)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!(await switchWorkspace(session, await readSlot(request))))
    return denied();
  return seeOther(request);
}
