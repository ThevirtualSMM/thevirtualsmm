import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== "migrate-counts-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const statements = [
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS saves_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count integer default 0",
  ];

  const results: string[] = [];
  const client = await pool.connect();

  try {
    for (const sql of statements) {
      await client.query(sql);
      results.push(`OK: ${sql}`);
    }
  } catch (err) {
    results.push(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    client.release();
    await pool.end();
  }

  return NextResponse.json({ results });
}
