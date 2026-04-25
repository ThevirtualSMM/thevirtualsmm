const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Connecting to Supabase...");
  await client.connect();
  console.log("Connected.");

  const sql = fs.readFileSync(
    path.join(__dirname, "../supabase-schema.sql"),
    "utf8"
  );

  console.log("Running schema...");
  await client.query(sql);
  console.log("Schema created successfully.");
  await client.end();
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
