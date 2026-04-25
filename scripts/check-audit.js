const PAT = "sbp_fc548a135b532c694bf1bb5c4657ff2e60a88131";
const PROJECT_REF = "eniruejiuyjmnoukrksm";

async function query(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
      body: JSON.stringify({ query: sql }),
    }
  );
  return res.json();
}

async function main() {
  console.log("=== USERS ===");
  const users = await query("SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5;");
  console.log(JSON.stringify(users, null, 2));

  console.log("\n=== INSTAGRAM ACCOUNTS ===");
  const accounts = await query("SELECT id, user_id, username, connected_at, token_expires_at FROM instagram_accounts ORDER BY connected_at DESC LIMIT 5;");
  console.log(JSON.stringify(accounts, null, 2));

  console.log("\n=== AUDITS ===");
  const audits = await query("SELECT id, status, total_posts_scraped, error_message, triggered_at, completed_at FROM audits ORDER BY triggered_at DESC LIMIT 5;");
  console.log(JSON.stringify(audits, null, 2));

  console.log("\n=== POSTS COUNT ===");
  const posts = await query("SELECT audit_id, COUNT(*) as count FROM posts GROUP BY audit_id;");
  console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error);
