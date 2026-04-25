import {
  getRecentMediaIds,
  getMediaDetails,
  getMediaInsights,
  getTopComments,
} from "./client";
import { extractQuestions } from "@/lib/claude/analyze";
import { supabase } from "@/lib/supabase/client";

function parseInsights(insights: { name: string; values?: { value: number }[]; value?: number }[]) {
  const map: Record<string, number> = {};
  for (const item of insights) {
    const val = item.value ?? item.values?.[0]?.value ?? 0;
    map[item.name] = val;
  }
  return map;
}

function safeRate(numerator: number, denominator: number): number | null {
  if (!denominator || denominator === 0) return null;
  return parseFloat((numerator / denominator).toFixed(4));
}

export async function scrapeAndStore(
  auditId: string,
  userId: string,
  igUserId: string,
  accessToken: string,
  since: Date,
  onProgress?: (scraped: number, total: number) => void
) {
  const mediaIds = await getRecentMediaIds(igUserId, accessToken, since);
  if (mediaIds.length === 0) return 0;

  let scraped = 0;

  for (const mediaId of mediaIds) {
    try {
      // Get details first so we know the media type for correct insights
      const details = await getMediaDetails(mediaId, accessToken);
      const isVideo = details.media_type === "VIDEO";

      const [insights, comments] = await Promise.all([
        getMediaInsights(mediaId, details.media_type, accessToken),
        getTopComments(mediaId, accessToken),
      ]);

      const m = parseInsights(insights);
      const reach = m["reach"] || 0;

      // "views" works for all media types (reels, carousels, images)
      const views = m["views"] || 0;

      const likes = m["likes"] || 0;
      const shares = m["shares"] || 0;
      const saves = m["saved"] || 0;
      const commentsRaw = m["comments"] ?? m["comments_count"] ?? null;
      const follows = m["follows"] ?? null;
      const navigation = m["navigation"] ?? null;

      const postType = isVideo
        ? (details.permalink?.includes("reel") ? "reel" : "video")
        : details.media_type === "CAROUSEL_ALBUM"
        ? "carousel"
        : "image";

      const hashtags = details.caption
        ? [...details.caption.matchAll(/#(\w+)/g)].map((m: RegExpMatchArray) => m[1])
        : [];

      const questions = extractQuestions(comments);

      await supabase.from("posts").upsert(
        {
          audit_id: auditId,
          user_id: userId,
          instagram_post_id: mediaId,
          post_type: postType,
          posted_at: details.timestamp,
          caption: details.caption || null,
          hashtags: hashtags.length > 0 ? hashtags : null,
          is_collab: false,
          duration_seconds: null,
          thumbnail_url: details.thumbnail_url || details.media_url || null,

          views,
          accounts_reached: reach,
          avg_watch_time_seconds: m["ig_reels_avg_watch_time"] ? m["ig_reels_avg_watch_time"] / 1000 : null,
          follows_from_post: follows ?? 0,

          likes_count: likes,
          shares_count: shares,
          saves_count: saves,
          comments_count: commentsRaw ?? 0,

          skip_rate: navigation != null ? safeRate(navigation, views) : null,
          share_rate: safeRate(shares, reach),
          like_rate: safeRate(likes, reach),
          save_rate: safeRate(saves, reach),
          repost_rate: null,
          comment_rate: commentsRaw != null ? safeRate(commentsRaw, reach) : null,

          source_home: null,
          source_explore: null,
          source_profile: null,
          source_hashtags: null,
          source_other: null,

          top_comments: comments.length > 0 ? comments : null,
          questions_in_comments: questions.length > 0 ? questions : null,
          performance_tiers: null,
        },
        { onConflict: "audit_id,instagram_post_id" }
      );

      scraped++;
      onProgress?.(scraped, mediaIds.length);
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`Failed to scrape post ${mediaId}:`, err);
    }
  }

  return scraped;
}
