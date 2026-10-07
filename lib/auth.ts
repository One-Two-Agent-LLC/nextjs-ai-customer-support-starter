import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionFromToken } from "./session";
export async function getCurrentSession() {
  return sessionFromToken((await cookies()).get(SESSION_COOKIE)?.value);
}
