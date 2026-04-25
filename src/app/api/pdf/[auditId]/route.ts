import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { Audit, Post } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { auditId } = await params;

  const { data: audit } = await supabase
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .eq("user_id", session.user.id)
    .single();

  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("audit_id", auditId)
    .order("views", { ascending: false });

  const typedAudit = audit as Audit;
  const typedPosts = (posts || []) as Post[];

  const html = generatePdfHtml(typedAudit, typedPosts);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "X-Robots-Tag": "noindex",
    },
  });
}

function pct(val: number | null) {
  if (!val) return "—";
  return `${(val * 100).toFixed(1)}%`;
}

function generatePdfHtml(audit: Audit, posts: Post[]) {
  const totalViews = posts.reduce((a, p) => a + (p.views || 0), 0);
  const totalReach = posts.reduce((a, p) => a + (p.accounts_reached || 0), 0);
  const totalFollows = posts.reduce((a, p) => a + (p.follows_from_post || 0), 0);
  const avgLike = posts.reduce((a, p) => a + (p.like_rate || 0), 0) / (posts.length || 1);
  const avgSave = posts.reduce((a, p) => a + (p.save_rate || 0), 0) / (posts.length || 1);

  const best = posts.filter((p) => p.performance_tiers?.includes("best_views")).slice(0, 3);
  const worst = posts.filter((p) => p.performance_tiers?.includes("worst_views")).slice(0, 3);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Instagram Audit Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: #fff; color: #111; padding: 48px; font-size: 13px; line-height: 1.6; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #999; margin-bottom: 16px; margin-top: 40px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 40px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  .card { background: #f5f5f5; border-radius: 10px; padding: 16px; }
  .card-label { font-size: 11px; color: #888; margin-bottom: 4px; }
  .card-value { font-size: 22px; font-weight: 700; }
  .summary-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; padding: 20px; color: #333; }
  .post { border: 1px solid #eee; border-radius: 10px; padding: 16px; margin-bottom: 8px; }
  .post-meta { font-size: 11px; color: #888; margin-bottom: 6px; }
  .post-caption { color: #333; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .post-stats { font-size: 11px; color: #666; display: flex; gap: 16px; }
  .tag { background: #f0f0f0; border-radius: 4px; padding: 2px 8px; font-size: 11px; margin-right: 6px; }
  .list li { padding: 10px 16px; border-bottom: 1px solid #f0f0f0; color: #333; }
  .list { list-style: none; border: 1px solid #eee; border-radius: 10px; overflow: hidden; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <h1>Instagram Audit Report</h1>
  <p class="subtitle">
    ${new Date(audit.date_range_start).toLocaleDateString()} – ${new Date(audit.date_range_end).toLocaleDateString()}
    &nbsp;·&nbsp; ${posts.length} posts analysed
  </p>

  ${audit.claude_summary ? `
  <h2>AI Summary</h2>
  <div class="summary-box">${audit.claude_summary}</div>
  ` : ""}

  <h2>90-Day Overview</h2>
  <div class="grid">
    <div class="card"><div class="card-label">Total Posts</div><div class="card-value">${posts.length}</div></div>
    <div class="card"><div class="card-label">Total Views</div><div class="card-value">${totalViews.toLocaleString()}</div></div>
    <div class="card"><div class="card-label">Total Reach</div><div class="card-value">${totalReach.toLocaleString()}</div></div>
    <div class="card"><div class="card-label">Total Follows</div><div class="card-value">${totalFollows.toLocaleString()}</div></div>
    <div class="card"><div class="card-label">Avg Like Rate</div><div class="card-value">${pct(avgLike)}</div></div>
    <div class="card"><div class="card-label">Avg Save Rate</div><div class="card-value">${pct(avgSave)}</div></div>
  </div>

  ${best.length > 0 ? `
  <h2>Best Performing Posts — Views</h2>
  ${best.map((p) => `
  <div class="post">
    <div class="post-meta">
      <span class="tag">${p.post_type || "post"}</span>
      ${p.posted_at ? new Date(p.posted_at).toLocaleDateString() : ""}
    </div>
    ${p.caption ? `<div class="post-caption">${p.caption.slice(0, 200)}</div>` : ""}
    <div class="post-stats">
      <span>${(p.views || 0).toLocaleString()} views</span>
      <span>${(p.accounts_reached || 0).toLocaleString()} reached</span>
      <span>${pct(p.like_rate)} likes</span>
      <span>${(p.follows_from_post || 0)} follows</span>
    </div>
  </div>`).join("")}` : ""}

  ${worst.length > 0 ? `
  <h2>Needs Improvement — Lowest Views</h2>
  ${worst.map((p) => `
  <div class="post">
    <div class="post-meta">
      <span class="tag">${p.post_type || "post"}</span>
      ${p.posted_at ? new Date(p.posted_at).toLocaleDateString() : ""}
    </div>
    ${p.caption ? `<div class="post-caption">${p.caption.slice(0, 200)}</div>` : ""}
    <div class="post-stats">
      <span>${(p.views || 0).toLocaleString()} views</span>
      <span>${pct(p.like_rate)} likes</span>
    </div>
  </div>`).join("")}` : ""}

  ${audit.claude_json?.patterns?.length ? `
  <h2>Patterns</h2>
  <ul class="list">
    ${audit.claude_json.patterns.map((p) => `<li>${p}</li>`).join("")}
  </ul>` : ""}

  ${audit.claude_json?.notable_observations?.length ? `
  <h2>Observations</h2>
  <ul class="list">
    ${audit.claude_json.notable_observations.map((o) => `<li>${o}</li>`).join("")}
  </ul>` : ""}

  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}
