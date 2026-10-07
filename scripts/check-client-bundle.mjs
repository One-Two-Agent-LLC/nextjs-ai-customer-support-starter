import { loadEnvFile } from "node:process";
try { loadEnvFile(".env.local"); } catch (e) { if (e.code !== "ENOENT") throw e; }
import { readdir, readFile } from "node:fs/promises";
async function walk(dir) {
  const items = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      items.map((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
      ),
    )
  ).flat();
}
const forbidden = [
  "ONETWOAGENT_WIDGET_IDENTITY_SECRET",
  "ONETWOAGENT_ACCOUNT_READ_CREDENTIAL",
  "APP_DATABASE_URL",
  "INTERNAL_ONLY_NOT_FOR_SUPPORT",
  ...[
    "ONETWOAGENT_WIDGET_IDENTITY_SECRET",
    "ONETWOAGENT_ACCOUNT_READ_CREDENTIAL",
    "APP_DATABASE_URL",
  ]
    .map((k) => process.env[k])
    .filter((v) => v && v.length > 8),
];
let count = 0;
for (const f of await walk(".next/static")) {
  if (!/\.(js|map|json)$/.test(f)) continue;
  const text = await readFile(f, "utf8");
  for (const marker of forbidden)
    if (text.includes(marker))
      throw new Error(`Server-only material in client artifact: ${f}`);
  count++;
}
console.log(
  `PASS: ${count} client artifacts checked; server secret names/values and private projections absent.`,
);
