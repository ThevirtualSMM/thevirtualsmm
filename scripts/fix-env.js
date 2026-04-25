const TOKEN = "vcp_2KDWHJl8nxxhRzGEzZ85znlKlBj0rg6SASRAtqFAr9WRMNYxyj2lGWmu";
const PROJECT_ID = "prj_kDy9uDn0tdTXVYC2SQU1YSdbRcsX";
const TEAM_ID = "team_hCItcU37Ofu3f8UFiCg8iOkY";
const PROD_URL = "https://smm-audit-platform.vercel.app";

async function getEnvIds() {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const data = await res.json();
  return data.envs || [];
}

async function deleteEnv(id) {
  await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env/${id}?teamId=${TEAM_ID}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${TOKEN}` } }
  );
}

async function addEnv(key, value) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        key, value, type: "encrypted",
        target: ["production", "preview", "development"],
      }),
    }
  );
  return res.json();
}

async function main() {
  const envs = await getEnvIds();
  const toFix = ["INSTAGRAM_REDIRECT_URI", "NEXTAUTH_URL"];

  for (const key of toFix) {
    const existing = envs.filter(e => e.key === key);
    for (const e of existing) {
      await deleteEnv(e.id);
      console.log(`Deleted old ${key}`);
    }
  }

  await addEnv("INSTAGRAM_REDIRECT_URI", `${PROD_URL}/api/instagram/callback`);
  console.log("Set INSTAGRAM_REDIRECT_URI →", `${PROD_URL}/api/instagram/callback`);

  await addEnv("NEXTAUTH_URL", PROD_URL);
  console.log("Set NEXTAUTH_URL →", PROD_URL);
}

main().catch(console.error);
