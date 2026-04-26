// IG Login tokens (IGAA…) only validate against graph.instagram.com.
// graph.facebook.com rejects them with OAuth code 190 ("Cannot parse access token").
const BASE = `https://graph.instagram.com/v21.0`;

// All account-level metrics in v21+ require period=day + metric_type=total_value.
// Without metric_type=total_value the API silently returns {data:[]}.
// period=total_over_range errors with code 1 ("unknown error") for some metrics.

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

// ── Response parsers ─────────────────────────────────────────────────────────

interface InsightsItem {
  total_value?: {
    value?: number;
    breakdowns?: {
      dimension_keys: string[];
      results: { dimension_values: string[]; value: number }[];
    }[];
  };
}

function getTotalValue(data: unknown): number {
  return (data as InsightsItem | null)?.total_value?.value ?? 0;
}

function getBreakdown(data: unknown, key: string): Record<string, number> {
  const item = data as InsightsItem | null;
  const bd = item?.total_value?.breakdowns?.find((b) => b.dimension_keys?.includes(key));
  if (!bd) return {};
  const out: Record<string, number> = {};
  for (const r of bd.results) {
    out[r.dimension_values[0]] = r.value;
  }
  return out;
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchInsight(
  igUserId: string,
  accessToken: string,
  metric: string,
  breakdown: string | null,
  since: number,
  until: number
): Promise<unknown> {
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
  return json.data?.[0] ?? null;
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

  // 4 parallel calls — every breakdown response also contains the unbroken total
  // in total_value.value, so we only need one for the views total and one for reach.
  const [viewsByTypeRaw, viewsByFollowRaw, reachRaw, reachByFollowRaw] =
    await Promise.allSettled([
      fetchInsight(igUserId, accessToken, "views", "media_product_type", sinceTs, untilTs),
      fetchInsight(igUserId, accessToken, "views", "follow_type",        sinceTs, untilTs),
      fetchInsight(igUserId, accessToken, "reach", null,                 sinceTs, untilTs),
      fetchInsight(igUserId, accessToken, "reach", "follow_type",        sinceTs, untilTs),
    ]);

  const viewsByTypeData   = viewsByTypeRaw.status   === "fulfilled" ? viewsByTypeRaw.value   : null;
  const viewsByFollowData = viewsByFollowRaw.status === "fulfilled" ? viewsByFollowRaw.value : null;
  const reachData         = reachRaw.status         === "fulfilled" ? reachRaw.value         : null;
  const reachByFollowData = reachByFollowRaw.status === "fulfilled" ? reachByFollowRaw.value : null;

  // Totals — prefer the unbreakdown call, fall back to a breakdown response if needed
  const totalViews =
    getTotalValue(viewsByTypeData) ||
    getTotalValue(viewsByFollowData);
  const totalReach =
    getTotalValue(reachData) ||
    getTotalValue(reachByFollowData);

  // Content-type breakdown (REEL, STORY, CAROUSEL_CONTAINER, POST)
  const byType = getBreakdown(viewsByTypeData, "media_product_type");
  const viewsByContentType: ContentBreakdown = {
    reels:   byType["REEL"]  ?? byType["REELS"]  ?? 0,
    stories: byType["STORY"] ?? byType["STORIES"] ?? 0,
    posts:
      (byType["POST"] ?? 0) +
      (byType["FEED"] ?? 0) +
      (byType["CAROUSEL_CONTAINER"] ?? 0) +
      (byType["CAROUSEL_ALBUM"] ?? 0),
  };

  // Views by follow type
  const byFollow = getBreakdown(viewsByFollowData, "follow_type");
  const followerViews    = byFollow["FOLLOWER"]     ?? 0;
  const nonFollowerViews = byFollow["NON_FOLLOWER"] ?? 0;

  // Reach by follow type
  const byReachFollow = getBreakdown(reachByFollowData, "follow_type");
  const followerReach    = byReachFollow["FOLLOWER"]     ?? 0;
  const nonFollowerReach = byReachFollow["NON_FOLLOWER"] ?? 0;

  const insufficientData = totalViews === 0 && totalReach === 0;

  // Per-content-type follower split (approximated via overall ratio —
  // the API doesn't support double-breakdown in a single call)
  const followerRatio    = totalViews > 0 ? followerViews    / totalViews : 0;
  const nonFollowerRatio = totalViews > 0 ? nonFollowerViews / totalViews : 0;

  const followerViewsByContentType: ContentBreakdown = {
    reels:   Math.round(viewsByContentType.reels   * followerRatio),
    stories: Math.round(viewsByContentType.stories * followerRatio),
    posts:   Math.round(viewsByContentType.posts   * followerRatio),
  };
  const nonFollowerViewsByContentType: ContentBreakdown = {
    reels:   Math.round(viewsByContentType.reels   * nonFollowerRatio),
    stories: Math.round(viewsByContentType.stories * nonFollowerRatio),
    posts:   Math.round(viewsByContentType.posts   * nonFollowerRatio),
  };

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
