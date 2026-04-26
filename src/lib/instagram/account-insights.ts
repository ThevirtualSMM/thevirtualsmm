const BASE = `https://graph.instagram.com/v20.0`;

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
  viewsByContentType: ContentBreakdown;
  followerViewsByContentType: ContentBreakdown;
  nonFollowerViewsByContentType: ContentBreakdown;
  days: number;
  insufficientData: boolean;
}

function toUnix(d: Date) {
  return Math.floor(d.getTime() / 1000);
}

// Parse breakdown results from total_value.breakdowns
function parseBreakdown(data: unknown, key: string): Record<string, number> {
  const item = data as { total_value?: { breakdowns?: { dimension_keys: string[]; results: { dimension_values: string[]; value: number }[] }[] } } | null;
  if (!item?.total_value?.breakdowns) return {};
  const bd = item.total_value.breakdowns.find((b) => b.dimension_keys?.includes(key));
  if (!bd) return {};
  const out: Record<string, number> = {};
  for (const r of bd.results ?? []) {
    out[r.dimension_values?.[0] ?? ""] = r.value;
  }
  return out;
}

function parseTotalValue(data: unknown): number {
  const item = data as { total_value?: { value?: number }; values?: { value: number }[] } | null;
  if (!item) return 0;
  if (item.total_value?.value != null) return item.total_value.value;
  // Fallback: sum daily values array
  if (Array.isArray(item.values)) {
    return item.values.reduce((a, v) => a + (v.value ?? 0), 0);
  }
  return 0;
}

async function insightsFetch(
  igUserId: string,
  accessToken: string,
  metric: string,
  breakdown: string | null,
  since: number,
  until: number
): Promise<unknown> {
  const params = new URLSearchParams({
    metric,
    period: "total_over_range",
    since: String(since),
    until: String(until),
    access_token: accessToken,
  });
  if (breakdown) params.set("breakdown", breakdown);

  const res = await fetch(`${BASE}/${igUserId}/insights?${params}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data?.[0] ?? null;
}

// Fallback: fetch with period=day and sum values (no breakdown support)
async function insightsFetchDay(
  igUserId: string,
  accessToken: string,
  metric: string,
  since: number,
  until: number
): Promise<number> {
  const params = new URLSearchParams({
    metric,
    period: "day",
    since: String(since),
    until: String(until),
    access_token: accessToken,
  });
  const res = await fetch(`${BASE}/${igUserId}/insights?${params}`);
  const json = await res.json();
  if (json.error) return 0;
  const values: { value: number }[] = json.data?.[0]?.values ?? [];
  return values.reduce((a, v) => a + (v.value ?? 0), 0);
}

export async function fetchAccountInsights(
  igUserId: string,
  accessToken: string,
  days: 30 | 90
): Promise<AccountInsightsResult> {
  const until = new Date();
  until.setHours(0, 0, 0, 0);
  const since = new Date(until);
  since.setDate(since.getDate() - days);

  const sinceTs = toUnix(since);
  const untilTs = toUnix(until);

  // Fetch all in parallel: views by content type, views by follow type, reach
  const [viewsByTypeRaw, viewsByFollowRaw, reachRaw] = await Promise.allSettled([
    insightsFetch(igUserId, accessToken, "views", "media_product_type", sinceTs, untilTs),
    insightsFetch(igUserId, accessToken, "views", "follow_type", sinceTs, untilTs),
    insightsFetch(igUserId, accessToken, "reach", null, sinceTs, untilTs),
  ]);

  const viewsByTypeData = viewsByTypeRaw.status === "fulfilled" ? viewsByTypeRaw.value : null;
  const viewsByFollowData = viewsByFollowRaw.status === "fulfilled" ? viewsByFollowRaw.value : null;
  const reachData = reachRaw.status === "fulfilled" ? reachRaw.value : null;

  // If total_over_range failed for views, fall back to daily sum
  let totalViews = parseTotalValue(viewsByTypeData) || parseTotalValue(viewsByFollowData);
  if (totalViews === 0) {
    totalViews = await insightsFetchDay(igUserId, accessToken, "views", sinceTs, untilTs);
  }

  // Content type breakdown: REEL, STORY, POST/FEED
  const byType = parseBreakdown(viewsByTypeData, "media_product_type");
  const viewsByContentType: ContentBreakdown = {
    reels:   byType["REEL"]  ?? byType["REELS"]   ?? 0,
    stories: byType["STORY"] ?? byType["STORIES"]  ?? 0,
    posts:   (byType["POST"] ?? 0) + (byType["FEED"] ?? 0) + (byType["CAROUSEL_ALBUM"] ?? 0),
  };

  // Follow type breakdown
  const byFollow = parseBreakdown(viewsByFollowData, "follow_type");
  const followerViews    = byFollow["FOLLOWER"]     ?? 0;
  const nonFollowerViews = byFollow["NON_FOLLOWER"] ?? 0;

  // Reach
  let totalReach = parseTotalValue(reachData);
  if (totalReach === 0) {
    totalReach = await insightsFetchDay(igUserId, accessToken, "reach", sinceTs, untilTs);
  }

  const insufficientData = totalViews === 0 && totalReach === 0;

  // Approximate per-content-type follower split using overall ratio
  // (API doesn't support double breakdown in a single call)
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
    viewsByContentType,
    followerViewsByContentType,
    nonFollowerViewsByContentType,
    days,
    insufficientData,
  };
}
