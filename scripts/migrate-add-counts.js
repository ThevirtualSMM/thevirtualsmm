const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://eniruejiuyjmnoukrksm.supabase.co",
  "sb_secret_yEgIfsi9XEMFKSUGN1u6aQ_gcAgu661"
);

async function run() {
  const columns = [
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS saves_count integer default 0",
    "ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count integer default 0",
  ];

  for (const sql of columns) {
    const { error } = await supabase.rpc("exec_sql", { sql });
    if (error) {
      // rpc not available, fall back to raw fetch
      const res = await fetch(
        `https://eniruejiuyjmnoukrksm.supabase.co/rest/v1/rpc/exec_sql`,
        {
          method: "POST",
          headers: {
            apikey: "sb_secret_yEgIfsi9XEMFKSUGN1u6aQ_gcAgu661",
            Authorization: "Bearer sb_secret_yEgIfsi9XEMFKSUGN1u6aQ_gcAgu661",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sql }),
        }
      );
      if (!res.ok) {
        console.error("Failed:", sql, await res.text());
      } else {
        console.log("OK:", sql);
      }
    } else {
      console.log("OK:", sql);
    }
  }
}

run().catch(console.error);
