import { readFile } from "node:fs/promises";
import pg from "pg";
if (!process.env.APP_DATABASE_URL)
  throw new Error(
    "APP_DATABASE_URL is required; use a dedicated demo database",
  );
const db = new pg.Client({ connectionString: process.env.APP_DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN");
  await db.query(
    "SELECT pg_advisory_xact_lock(hashtext('ota_starter_schema_v1'))",
  );
  const prior = await db.query(
    "SELECT to_regclass('ota_starter.schema_version') AS table_name",
  );
  if (prior.rows[0].table_name) {
    const versions = await db.query(
      "SELECT version FROM ota_starter.schema_version",
    );
    if (versions.rows.length !== 1 || versions.rows[0].version !== 1)
      throw new Error("Unknown starter schema version; refusing changes");
  } else {
    const occupied = await db.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema='ota_starter' LIMIT 1",
    );
    if (occupied.rowCount)
      throw new Error("Existing unversioned schema; refusing changes");
  }
  await db.query(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );
  await db.query("COMMIT");
  console.log("Starter schema v1 ready; existing data preserved.");
} catch (e) {
  await db.query("ROLLBACK");
  throw new Error("Starter schema initialization failed; no changes committed");
} finally {
  await db.end();
}
