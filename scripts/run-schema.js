const fs = require("fs");
const path = require("path");

const PAT = "sbp_fc548a135b532c694bf1bb5c4657ff2e60a88131";
const PROJECT_REF = "eniruejiuyjmnoukrksm";

async function runQuery(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAT}`,
      },
      body: JSON.stringify({ query }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, "../supabase-schema.sql"),
    "utf8"
  );

  console.log("Running full schema...");
  try {
    await runQuery(sql);
    console.log("Schema applied.");
  } catch (e) {
    console.error("Schema error:", e.message);
  }

  console.log("Verifying tables...");
  const tables = await runQuery(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
  );

  if (tables.length === 0) {
    console.log("No tables found — checking error details...");
  } else {
    console.log("Tables created:", tables.map((t) => t.table_name).join(", "));
  }
}

main().catch(console.error);
