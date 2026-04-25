const TOKEN = "vcp_2KDWHJl8nxxhRzGEzZ85znlKlBj0rg6SASRAtqFAr9WRMNYxyj2lGWmu";
const PROJECT_ID = "prj_kDy9uDn0tdTXVYC2SQU1YSdbRcsX";
const TEAM_ID = "team_hCItcU37Ofu3f8UFiCg8iOkY";
const PROD_URL = "https://smm-audit-platform-virtualsmms-projects.vercel.app";

const envVars = [
  { key: "INSTAGRAM_APP_ID",               value: "930465666637054" },
  { key: "INSTAGRAM_APP_SECRET",           value: "739b1cf02d70614560cb264c4588ee72" },
  { key: "INSTAGRAM_REDIRECT_URI",         value: `${PROD_URL}/api/instagram/callback` },
  { key: "NEXT_PUBLIC_SUPABASE_URL",       value: "https://eniruejiuyjmnoukrksm.supabase.co" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",  value: "sb_publishable_GzryR9fWX-1erE5HrLUVYg_LKStSIAd" },
  { key: "SUPABASE_SERVICE_ROLE_KEY",      value: "sb_secret_yEgIfsi9XEMFKSUGN1u6aQ_gcAgu661" },
  { key: "DATABASE_URL",                   value: "postgresql://postgres:o1fucC8iqmTbq9ZW@db.eniruejiuyjmnoukrksm.supabase.co:5432/postgres" },
  { key: "OPENROUTER_API_KEY",             value: "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" },
  { key: "OPENROUTER_MODEL",               value: "anthropic/claude-sonnet-4-5" },
  { key: "NEXTAUTH_SECRET",               value: "24357e4d2985a3d664fd89693cf2867dc6a521ef50563a1335da4d2cbad1ce0e" },
  { key: "NEXTAUTH_URL",                   value: PROD_URL },
  { key: "SUPABASE_PAT",                   value: "sbp_fc548a135b532c694bf1bb5c4657ff2e60a88131" },
];

async function setEnv(key, value) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: ["production", "preview", "development"],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok && !data.error?.includes("already exists")) {
    throw new Error(`${key}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  for (const { key, value } of envVars) {
    process.stdout.write(`Setting ${key}... `);
    try {
      await setEnv(key, value);
      console.log("OK");
    } catch (e) {
      console.error("FAILED:", e.message);
    }
  }
  console.log("\nAll env vars set. Ready to redeploy.");
}

main().catch(console.error);
