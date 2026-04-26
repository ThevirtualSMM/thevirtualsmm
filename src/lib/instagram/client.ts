const APP_ID = process.env.INSTAGRAM_APP_ID!;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!;
const API_VERSION = "20.0";
const BASE = `https://graph.instagram.com/v${API_VERSION}`;

export function getOAuthUrl(state: string) {
  const scopes = [
    "instagram_business_basic",
    "instagram_business_manage_insights",
  ].join(",");

  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: scopes,
    state,
  });

  return `https://www.instagram.com/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code,
  });

  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (data.error_type || data.error) throw new Error(data.error_message || data.error?.message);
  return data.access_token;
}

export async function getLongLivedToken(shortToken: string): Promise<{ token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: APP_SECRET,
    access_token: shortToken,
  });

  const res = await fetch(`https://graph.instagram.com/access_token?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { token: data.access_token, expires_in: data.expires_in };
}

export async function getInstagramAccountId(longToken: string): Promise<{ igUserId: string; username: string; pageAccessToken: string }> {
  const res = await fetch(`https://graph.instagram.com/v${API_VERSION}/me?fields=id,username&access_token=${longToken}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return {
    igUserId: data.id,
    username: data.username || "unknown",
    pageAccessToken: longToken,
  };
}

export async function getRecentMediaIds(
  igUserId: string,
  accessToken: string,
  since: Date
): Promise<string[]> {
  const mediaIds: string[] = [];
  let url = `${BASE}/${igUserId}/media?fields=id,timestamp&limit=50&access_token=${accessToken}`;

  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    for (const item of data.data || []) {
      const ts = new Date(item.timestamp);
      if (ts >= since) {
        mediaIds.push(item.id);
      } else {
        // Posts come newest-first — once past the window, stop
        return mediaIds;
      }
    }

    url = data.paging?.next || null;
  }

  return mediaIds;
}

export async function getMediaDetails(mediaId: string, accessToken: string) {
  const fields = [
    "id", "media_type", "timestamp", "caption", "is_shared_to_feed",
    "thumbnail_url", "media_url", "permalink",
  ].join(",");

  const res = await fetch(`${BASE}/${mediaId}?fields=${fields}&access_token=${accessToken}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function getMediaInsights(mediaId: string, mediaType: string, accessToken: string) {
  const isVideo = mediaType === "VIDEO" || mediaType === "REEL";

  // Tier 1 — full metrics including comments
  const tier1 = isVideo
    ? ["reach", "saved", "shares", "likes", "comments", "views", "ig_reels_avg_watch_time", "total_interactions"]
    : ["reach", "saved", "shares", "likes", "comments", "views", "total_interactions"];

  const res1 = await fetch(`${BASE}/${mediaId}/insights?${new URLSearchParams({ metric: tier1.join(","), access_token: accessToken })}`);
  const data1 = await res1.json();
  if (!data1.error) return data1.data || [];

  // Tier 2 — without comments (in case comments causes the rejection)
  const tier2 = isVideo
    ? "reach,saved,shares,likes,views,ig_reels_avg_watch_time,total_interactions"
    : "reach,saved,shares,likes,views,total_interactions";

  const res2 = await fetch(`${BASE}/${mediaId}/insights?${new URLSearchParams({ metric: tier2, access_token: accessToken })}`);
  const data2 = await res2.json();
  if (!data2.error) return data2.data || [];

  // Tier 3 — bare minimum guaranteed to work
  const res3 = await fetch(`${BASE}/${mediaId}/insights?${new URLSearchParams({ metric: "reach,saved,shares,likes,total_interactions", access_token: accessToken })}`);
  const data3 = await res3.json();
  return data3.data || [];
}

export async function getTopComments(mediaId: string, accessToken: string) {
  const res = await fetch(
    `${BASE}/${mediaId}/comments?fields=text,like_count&limit=20&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) return [];
  return (data.data || []).map((c: { text: string; like_count: number }) => ({
    text: c.text,
    likes: c.like_count || 0,
  }));
}
