import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
const globalDb = globalThis as typeof globalThis & { starterPool?: Pool };
export function pool() {
  if (!process.env.APP_DATABASE_URL)
    throw new Error("APP_DATABASE_URL is required");
  return (globalDb.starterPool ??= new Pool({
    connectionString: process.env.APP_DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  }));
}
export async function query<Row extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<Row[]> {
  return (await pool().query<Row>(sql, params)).rows;
}
export async function transaction<T>(
  fn: (db: PoolClient) => Promise<T>,
): Promise<T> {
  const db = await pool().connect();
  try {
    await db.query("BEGIN");
    const value = await fn(db);
    await db.query("COMMIT");
    return value;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    db.release();
  }
}
