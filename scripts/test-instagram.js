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
  const accounts = await query("SELECT instagram_user_id, access_token FROM instagram_accounts ORDER BY connected_at DESC LIMIT 1;");
  const account = accounts[0];
  const { instagram_user_id, access_token } = account;

  console.log("Testing with IG user ID:", instagram_user_id);
  console.log("Token preview:", access_token.slice(0, 30) + "...\n");

  // Test 1: get user profile
  console.log("=== PROFILE ===");
  const profile = await fetch(`https://graph.instagram.com/v20.0/me?fields=id,username&access_token=${access_token}`);
  console.log(await profile.json());

  // Test 2: get media
  console.log("\n=== MEDIA (first 5) ===");
  const media = await fetch(`https://graph.instagram.com/v20.0/${instagram_user_id}/media?fields=id,timestamp,media_type&limit=5&access_token=${access_token}`);
  const mediaData = await media.json();
  console.log(JSON.stringify(mediaData, null, 2));

  // Test 3: if we got media, test insights on first post
  if (mediaData.data && mediaData.data.length > 0) {
    const firstPost = mediaData.data[0];
    console.log("\n=== INSIGHTS FOR FIRST POST ===", firstPost.id);
    const insights = await fetch(`https://graph.instagram.com/v20.0/${firstPost.id}/insights?metric=reach,impressions,saved&access_token=${access_token}`);
    console.log(await insights.json());
  }
}

main().catch(console.error);
