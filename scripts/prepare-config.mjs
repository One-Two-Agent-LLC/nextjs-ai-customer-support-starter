// Build-time packaging only. Never writes credentials or runs at request time.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
try {
  loadEnvFile(".env.local");
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
let saved = {};
try {
  saved = JSON.parse(await readFile(".onetwoagent.json", "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw new Error("Invalid .onetwoagent.json");
}
const names = {
  businessId: "ONETWOAGENT_BUSINESS_ID",
  publicId: "ONETWOAGENT_WIDGET_PUBLIC_ID",
  apiBaseUrl: "ONETWOAGENT_API_BASE_URL",
};
const result = { version: 1 };
for (const [key, env] of Object.entries(names)) {
  if (process.env[env] && saved[key] && process.env[env] !== saved[key])
    throw new Error(`Connection conflict: ${key}`);
  result[key] =
    process.env[env] ||
    saved[key] ||
    (key === "apiBaseUrl" ? "https://api.onetwoagent.com" : "");
}
for (const key of ["businessId", "publicId"])
  if (result[key] && !/^[a-zA-Z0-9_-]{6,128}$/.test(result[key]))
    throw new Error(`Invalid ${key}`);
const api = new URL(result.apiBaseUrl);
if (
  api.origin !== "https://api.onetwoagent.com" ||
  api.pathname !== "/" ||
  api.search ||
  api.hash ||
  api.username ||
  api.password
)
  throw new Error("Use the production OneTwoAgent API origin");
if (Boolean(result.businessId) !== Boolean(result.publicId))
  throw new Error("Both businessId and publicId are required");
await mkdir("lib/onetwoagent", { recursive: true });
await writeFile(
  "lib/onetwoagent/connection.generated.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  result.publicId
    ? "Connection metadata ready (no secrets written)."
    : "Unconnected build: widget disabled until CLI connection is configured.",
);
