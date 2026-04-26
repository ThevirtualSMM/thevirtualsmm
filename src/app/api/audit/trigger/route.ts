import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { scrapeAndStore } from "@/lib/instagram/scraper";
import { analyzeAudit } from "@/lib/claude/analyze";
import { Post } from "@/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instagram_account_id, days = 30 } = await req.json();
  if (!instagram_account_id) {
    return NextResponse.json({ error: "instagram_account_id required" }, { status: 400 });
  }
  const auditDays = days === 90 ? 90 : 30;

  const userId = session.user.id;

  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("*")
    .eq("id", instagram_account_id)
    .eq("user_id", userId)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const today = new Date();
  const since = new Date();
  since.setDate(today.getDate() - auditDays);

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .insert({
      user_id: userId,
      instagram_account_id,
      status: "scraping",
      date_range_start: since.toISOString().split("T")[0],
      date_range_end: today.toISOString().split("T")[0],
    })
    .select()
    .single();

  if (auditError || !audit) {
    return NextResponse.json({ error: "Failed to create audit" }, { status: 500 });
  }

  after(() => runAudit(audit.id, userId, account.instagram_user_id, account.access_token, since));

  return NextResponse.json({ audit_id: audit.id });
}

async function runAudit(
  auditId: string,
  userId: string,
  igUserId: string,
  accessToken: string,
  since: Date,
) {
  try {
    const { scraped, total, errors } = await scrapeAndStore(auditId, userId, igUserId, accessToken, since);

    if (total === 0) {
      await supabase.from("audits").update({
        status: "failed",
        error_message: "No posts found in the last 30 days on this Instagram account.",
      }).eq("id", auditId);
      return;
    }

    await supabase
      .from("audits")
      .update({ status: "analyzing", total_posts_scraped: scraped })
      .eq("id", auditId);

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("audit_id", auditId);

    if (postsError || !posts || posts.length === 0) {
      const detail = postsError
        ? `DB error: ${postsError.message}`
        : `Found ${total} posts on Instagram, scraped ${scraped}, but 0 saved. Errors: ${errors.slice(0, 3).join(" | ")}`;
      await supabase
        .from("audits")
        .update({ status: "failed", error_message: detail })
        .eq("id", auditId);
      return;
    }

    const { summary, analysis } = await analyzeAudit(posts as Post[]);

    const tierUpdates: Record<string, string[]> = {};
    const addTier = (postId: string, tier: string) => {
      tierUpdates[postId] = [...(tierUpdates[postId] || []), tier];
    };

    analysis.best_by_views?.forEach((p) => addTier(p.instagram_post_id, "best_views"));
    analysis.best_by_engagement?.forEach((p) => addTier(p.instagram_post_id, "best_engagement"));
    analysis.best_by_followers?.forEach((p) => addTier(p.instagram_post_id, "best_followers"));
    analysis.worst_by_views?.forEach((p) => addTier(p.instagram_post_id, "worst_views"));
    analysis.worst_by_engagement?.forEach((p) => addTier(p.instagram_post_id, "worst_engagement"));
    analysis.worst_by_followers?.forEach((p) => addTier(p.instagram_post_id, "worst_followers"));

    for (const [postId, tiers] of Object.entries(tierUpdates)) {
      await supabase
        .from("posts")
        .update({ performance_tiers: tiers })
        .eq("instagram_post_id", postId)
        .eq("audit_id", auditId);
    }

    await supabase
      .from("audits")
      .update({
        status: "complete",
        completed_at: new Date().toISOString(),
        claude_summary: summary,
        claude_json: analysis,
      })
      .eq("id", auditId);
  } catch (err) {
    console.error("Audit failed:", err);
    await supabase
      .from("audits")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", auditId);
  }
}
