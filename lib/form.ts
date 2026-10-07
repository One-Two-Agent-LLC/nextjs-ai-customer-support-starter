import "server-only";
export function allowedMutation(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next.js may use its internal hostname in request.url. Host is the browser-facing
  // request authority; never trust an arbitrary forwarded-host header here.
  const authority = request.headers.get("host") || url.host;
  return Boolean(
    origin &&
      origin === `${url.protocol}//${authority}` &&
      request.headers.get("sec-fetch-site") !== "cross-site",
  );
}
export function denied() {
  return Response.json(
    { error: "forbidden" },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
export function seeOther(request: Request, cookie?: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Cache-Control": "no-store",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
}
export function sessionCookie(request: Request, value: string, clear = false) {
  return `ota_demo_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 3600}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function readSlot(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0] !==
    "application/x-www-form-urlencoded"
  )
    return "";
  const reader = request.body?.getReader();
  if (!reader) return "";
  let text = "",
    size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) {
        await reader.cancel();
        return "";
      }
      text += new TextDecoder().decode(value);
    }
  } finally {
    reader.releaseLock();
  }
  const params = new URLSearchParams(text);
  return params.getAll("slot").length === 1 ? (params.get("slot") ?? "") : "";
}
