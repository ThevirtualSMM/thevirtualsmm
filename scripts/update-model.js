const TOKEN = "vcp_2KDWHJl8nxxhRzGEzZ85znlKlBj0rg6SASRAtqFAr9WRMNYxyj2lGWmu";
const PROJECT_ID = "prj_kDy9uDn0tdTXVYC2SQU1YSdbRcsX";
const TEAM_ID = "team_hCItcU37Ofu3f8UFiCg8iOkY";
const FREE_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

async function main() {
  // List all env vars to find the OPENROUTER_MODEL id
  const listRes = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&limit=100`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const listData = await listRes.json();
  const envs = listData.envs || [];

  const existing = envs.find((e) => e.key === "OPENROUTER_MODEL");

  if (existing) {
    console.log(`Found OPENROUTER_MODEL (id: ${existing.id}), current value: ${existing.value}`);
    // PATCH to update
    const patchRes = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env/${existing.id}?teamId=${TEAM_ID}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ value: FREE_MODEL, target: ["production", "preview", "development"] }),
      }
    );
    const patchData = await patchRes.json();
    if (!patchRes.ok) {
      console.error("PATCH failed:", JSON.stringify(patchData));
    } else {
      console.log("Updated to:", FREE_MODEL);
    }
  } else {
    // Create new
    console.log("OPENROUTER_MODEL not found, creating...");
    const createRes = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "OPENROUTER_MODEL",
          value: FREE_MODEL,
          type: "encrypted",
          target: ["production", "preview", "development"],
        }),
      }
    );
    const createData = await createRes.json();
    if (!createRes.ok) {
      console.error("Create failed:", JSON.stringify(createData));
    } else {
      console.log("Created with value:", FREE_MODEL);
    }
  }

  console.log("\nDone. Now redeploy on Vercel to pick up the new model.");
}

main().catch(console.error);
