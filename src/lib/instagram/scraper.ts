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
): Promise<{ scraped: number; total: number; errors: string[] }> {
  const mediaIds = await getRecentMediaIds(igUserId, accessToken, since);
  if (mediaIds.length === 0) return { scraped: 0, total: 0, errors: [] };

  let scraped = 0;
  const errors: string[] = [];

  for (const mediaId of mediaIds) {
    try {
      const details = await getMediaDetails(mediaId, accessToken);
      const isVideo = details.media_type === "VIDEO";

      const [insights, comments] = await Promise.all([
        getMediaInsights(mediaId, details.media_type, accessToken),
        getTopComments(mediaId, accessToken),
      ]);

      const m = parseInsights(insights);

      const reach      = m["reach"]  || 0;
      const views      = m["views"]  || 0;
      const likes      = m["likes"]  || 0;
      const shares     = m["shares"] || 0;
      const saves      = m["saved"]  || 0;
      // comments metric — present only when tier-1 request succeeds
      const commentsCount = m["comments"] != null ? m["comments"] : null;
      // navigation only works for Stories, not feed/reels — will be null
      const navigation = m["navigation"] != null ? m["navigation"] : null;
      // ig_reels_avg_watch_time is in milliseconds
      const avgWatchMs = m["ig_reels_avg_watch_time"] || 0;

      const postType = isVideo
        ? (details.permalink?.includes("reel") ? "reel" : "video")
        : details.media_type === "CAROUSEL_ALBUM"
        ? "carousel"
        : "image";

      const hashtags = details.caption
        ? [...details.caption.matchAll(/#(\w+)/g)].map((match: RegExpMatchArray) => match[1])
        : [];

      const questions = extractQuestions(comments);

      const baseRecord = {
        audit_id:              auditId,
        user_id:               userId,
        instagram_post_id:     mediaId,
        post_type:             postType,
        posted_at:             details.timestamp,
        caption:               details.caption || null,
        hashtags:              hashtags.length > 0 ? hashtags : null,
        is_collab:             false,
        duration_seconds:      null,
        thumbnail_url:         details.thumbnail_url || details.media_url || null,

        views,
        accounts_reached:      reach,
        avg_watch_time_seconds: isVideo && avgWatchMs > 0 ? avgWatchMs / 1000 : null,
        follows_from_post:     0,

        skip_rate:    navigation != null ? safeRate(navigation, views) : null,
        share_rate:   safeRate(shares, reach),
        like_rate:    safeRate(likes, reach),
        save_rate:    safeRate(saves, reach),
        repost_rate:  null,
        comment_rate: commentsCount != null ? safeRate(commentsCount, reach) : null,

        source_home:     null,
        source_explore:  null,
        source_profile:  null,
        source_hashtags: null,
        source_other:    null,

        top_comments:           comments.length > 0 ? comments : null,
        questions_in_comments:  questions.length > 0 ? questions : null,
        performance_tiers:      null,
      };

      // Try with new count columns; fall back to base record if columns don't exist yet
      const { error: upsertError } = await supabase.from("posts").upsert(
        {
          ...baseRecord,
          likes_count:    likes,
          shares_count:   shares,
          saves_count:    saves,
          comments_count: commentsCount ?? 0,
        },
        { onConflict: "audit_id,instagram_post_id" }
      );

      if (upsertError) {
        const { error: retryError } = await supabase.from("posts").upsert(
          baseRecord,
          { onConflict: "audit_id,instagram_post_id" }
        );
        if (retryError) {
          const msg = `Post ${mediaId}: ${retryError.message}`;
          errors.push(msg);
          console.error("Failed to upsert post:", msg);
          continue;
        }
      }

      scraped++;
      onProgress?.(scraped, mediaIds.length);
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      const msg = `Post ${mediaId}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error("Failed to scrape post:", msg);
    }
  }

  return { scraped, total: mediaIds.length, errors };
}
