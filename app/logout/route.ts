import { cookies } from "next/headers";
import { revoke, SESSION_COOKIE } from "@/lib/session";
import { allowedMutation, denied, seeOther, sessionCookie } from "@/lib/form";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowedMutation(request)) return denied();
  await revoke((await cookies()).get(SESSION_COOKIE)?.value);
  return seeOther(request, sessionCookie(request, "", true));
}
