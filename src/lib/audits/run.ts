import { supabase } from "@/lib/supabase/client";
import { scrapeAndStore } from "@/lib/instagram/scraper";
import { analyzeAudit, type BrandContext } from "@/lib/claude/analyze";
import type { Post } from "@/types";

/**
 * Background audit pipeline. Scrapes Instagram via the user's stored OAuth
 * token, persists the posts, asks Claude to analyze them with the user's
 * brand context, and updates the audit row to "complete" (or "failed").
 *
 * Used by both POST /api/audit/trigger (dashboard button) and
 * POST /api/audit/start (landing page input). Always invoked via Next's
 * `after()` so the response returns immediately.
 */
export async function runAudit(
  auditId: string,
  userId: string,
  igUserId: string,
  accessToken: string,
  since: Date,
) {
  try {
    const { scraped, total, errors } = await scrapeAndStore(auditId, userId, igUserId, accessToken, since);

    if (total === 0) {
      // No posts in the audit window — still mark complete so the report
      // renders the Account Insights panel (account-level metrics exist
      // even when no posts were published in the period).
      await supabase
        .from("audits")
        .update({
          status: "complete",
          completed_at: new Date().toISOString(),
          total_posts_scraped: 0,
          claude_summary:
            "No posts were published in this date range. Account-level insights below show overall reach, views, and audience composition for the period.",
          claude_json: null,
        })
        .eq("id", auditId);
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

    // Load the user's brand profile so the analysis is tailored to their
    // niche, voice, archetype, and goal. Non-fatal if missing.
    const { data: profileRow } = await supabase
      .from("brand_profiles")
      .select("responses, archetype_primary, archetype_secondary")
      .eq("user_id", userId)
      .maybeSingle();
    const brand: BrandContext | null = profileRow
      ? {
          responses:           profileRow.responses,
          archetype_primary:   profileRow.archetype_primary,
          archetype_secondary: profileRow.archetype_secondary,
        }
      : null;

    const { summary, analysis } = await analyzeAudit(posts as Post[], brand);

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

/**
 * Create the audit row + return its id. Caller is responsible for scheduling
 * runAudit() via `after()`.
 */
export async function createAuditRow(opts: {
  userId: string;
  instagramAccountId: string;
  days: 30 | 90;
}): Promise<{ auditId: string; since: Date } | { error: string }> {
  const today = new Date();
  const since = new Date();
  since.setDate(today.getDate() - opts.days);

  const { data, error } = await supabase
    .from("audits")
    .insert({
      user_id:                opts.userId,
      instagram_account_id:   opts.instagramAccountId,
      status:                 "scraping",
      date_range_start:       since.toISOString().split("T")[0],
      date_range_end:         today.toISOString().split("T")[0],
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create audit row" };
  }
  return { auditId: data.id, since };
}
