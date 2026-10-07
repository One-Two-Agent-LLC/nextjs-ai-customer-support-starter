import pg from "pg";
if (!process.env.APP_DATABASE_URL) throw new Error("APP_DATABASE_URL required");
const db = new pg.Client({ connectionString: process.env.APP_DATABASE_URL });
await db.connect();
try {
  const result = await db.query(
    "DELETE FROM ota_starter.visitors WHERE expires_at < now()",
  );
  console.log(
    `Removed ${result.rowCount} expired synthetic visitors from ota_starter only.`,
  );
} finally {
  await db.end();
}
