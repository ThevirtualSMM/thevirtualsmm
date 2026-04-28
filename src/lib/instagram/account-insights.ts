// IG Login tokens (IGAA…) only validate against graph.instagram.com.
// graph.facebook.com rejects them with OAuth code 190 ("Cannot parse access token").
const BASE = `https://graph.instagram.com/v21.0`;

// All account-level metrics in v21+ require period=day + metric_type=total_value.
// Double breakdown (follow_type,media_product_type) IS supported for views — gives
// exact per-cell counts so we don't approximate. Reach single-breakdown only.

export interface ContentBreakdown {
  reels: number;
  stories: number;
  posts: number;
}

export interface AccountInsightsResult {
  totalViews: number;
  followerViews: number;
  nonFollowerViews: number;
  totalReach: number;
  followerReach: number;
  nonFollowerReach: number;
  viewsByContentType: ContentBreakdown;
  followerViewsByContentType: ContentBreakdown;
  nonFollowerViewsByContentType: ContentBreakdown;
  days: number;
  insufficientData: boolean;
}

function toUnix(d: Date) {
  return Math.floor(d.getTime() / 1000);
}

// ── Response types ───────────────────────────────────────────────────────────

interface InsightsItem {
  total_value?: {
    value?: number;
    breakdowns?: {
      dimension_keys: string[];
      results: { dimension_values: string[]; value: number }[];
    }[];
  };
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchInsight(
  igUserId: string,
  accessToken: string,
  metric: string,
  breakdown: string | null,
  since: number,
  until: number
): Promise<InsightsItem | null> {
  const params = new URLSearchParams({
    metric,
    period: "day",
    metric_type: "total_value",
    since: String(since),
    until: String(until),
    access_token: accessToken,
  });
  if (breakdown) params.set("breakdown", breakdown);

  const res = await fetch(`${BASE}/${igUserId}/insights?${params}`);
  const json = await res.json();
  if (json.error) {
    console.error(
      `[account-insights] ${metric} breakdown=${breakdown}:`,
      json.error.message
    );
    throw new Error(json.error.message);
  }
  return (json.data?.[0] ?? null) as InsightsItem | null;
}

// Map IG's media_product_type values to our { reels, stories, posts } buckets.
// REEL → reels, STORY → stories, anything else (POST, CAROUSEL_CONTAINER,
// CAROUSEL_ALBUM, FEED, IGTV, …) → posts.
function bucketOf(mediaType: string): keyof ContentBreakdown {
  if (mediaType === "REEL" || mediaType === "REELS") return "reels";
  if (mediaType === "STORY" || mediaType === "STORIES") return "stories";
  return "posts";
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function fetchAccountInsights(
  igUserId: string,
  accessToken: string,
  since: Date,
  until: Date
): Promise<AccountInsightsResult> {
  const sinceTs = toUnix(since);
  const untilTs = toUnix(until);
  const days = Math.round((until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));

  // 2 parallel calls. The double-breakdown gives us exact per-cell views; the
  // reach call covers total reach + the follower/non-follower reach split.
  const [viewsRaw, reachRaw] = await Promise.allSettled([
    fetchInsight(igUserId, accessToken, "views", "follow_type,media_product_type", sinceTs, untilTs),
    fetchInsight(igUserId, accessToken, "reach", "follow_type", sinceTs, untilTs),
  ]);

  const viewsData = viewsRaw.status === "fulfilled" ? viewsRaw.value : null;
  const reachData = reachRaw.status === "fulfilled" ? reachRaw.value : null;

  // ── Views: walk every cell of the (follow_type × media_product_type) matrix ─
  const totalViews = viewsData?.total_value?.value ?? 0;

  const empty = (): ContentBreakdown => ({ reels: 0, stories: 0, posts: 0 });
  const viewsByContentType         = empty();
  const followerViewsByContentType = empty();
  const nonFollowerViewsByContentType = empty();
  let followerViews = 0;
  let nonFollowerViews = 0;

  const cells = viewsData?.total_value?.breakdowns?.[0]?.results ?? [];
  const keys  = viewsData?.total_value?.breakdowns?.[0]?.dimension_keys ?? [];
  const followIdx = keys.indexOf("follow_type");
  const typeIdx   = keys.indexOf("media_product_type");

  if (followIdx >= 0 && typeIdx >= 0) {
    for (const cell of cells) {
      const follow = cell.dimension_values[followIdx]; // FOLLOWER | NON_FOLLOWER | UNKNOWN
      const type   = cell.dimension_values[typeIdx];
      const value  = cell.value ?? 0;
      const bucket = bucketOf(type);

      viewsByContentType[bucket] += value;

      if (follow === "FOLLOWER") {
        followerViewsByContentType[bucket] += value;
        followerViews += value;
      } else if (follow === "NON_FOLLOWER") {
        nonFollowerViewsByContentType[bucket] += value;
        nonFollowerViews += value;
      }
      // UNKNOWN cells contribute to viewsByContentType (and totalViews from the
      // API), but we deliberately drop them from follower/non-follower buckets
      // so percentages add to 100% — matches Instagram's native panel.
    }
  }

  // ── Reach ────────────────────────────────────────────────────────────────────
  const totalReach = reachData?.total_value?.value ?? 0;

  const reachCells = reachData?.total_value?.breakdowns?.[0]?.results ?? [];
  const reachKeys  = reachData?.total_value?.breakdowns?.[0]?.dimension_keys ?? [];
  const reachFollowIdx = reachKeys.indexOf("follow_type");
  let followerReach = 0;
  let nonFollowerReach = 0;
  if (reachFollowIdx >= 0) {
    for (const cell of reachCells) {
      const follow = cell.dimension_values[reachFollowIdx];
      if (follow === "FOLLOWER")     followerReach    += cell.value ?? 0;
      if (follow === "NON_FOLLOWER") nonFollowerReach += cell.value ?? 0;
    }
  }

  const insufficientData = totalViews === 0 && totalReach === 0;

  return {
    totalViews,
    followerViews,
    nonFollowerViews,
    totalReach,
    followerReach,
    nonFollowerReach,
    viewsByContentType,
    followerViewsByContentType,
    nonFollowerViewsByContentType,
    days,
    insufficientData,
  };
}
