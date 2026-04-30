import { NextResponse } from "next/server";
import { Pool } from "pg";

// Each migration target maps to a secret + SQL statements. Hit
//   GET /api/migrate?secret=<secret>
// to apply that target's statements.
const MIGRATIONS: Record<string, string[]> = {
  "migrate-counts-2026": [
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS saves_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count integer default 0",
  ],
  "onboarding-2026": [
    `CREATE TABLE IF NOT EXISTS brand_profiles (
       user_id              uuid PRIMARY KEY,
       responses            jsonb NOT NULL,
       archetype_primary    text,
       archetype_secondary  text,
       created_at           timestamptz NOT NULL DEFAULT now(),
       updated_at           timestamptz NOT NULL DEFAULT now()
     )`,
    "CREATE INDEX IF NOT EXISTS brand_profiles_archetype_idx ON brand_profiles(archetype_primary)",
  ],
};

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  const statements = secret ? MIGRATIONS[secret] : null;
  if (!statements) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

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
