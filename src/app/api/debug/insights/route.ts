import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

const BASE = `https://graph.instagram.com/v21.0`;

function toUnix(d: Date) {
  return Math.floor(d.getTime() / 1000);
}

async function rawFetch(url: string): Promise<{ url: string; ok: boolean; data: unknown }> {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return { url: url.replace(/access_token=[^&]+/, "access_token=REDACTED"), ok: !data.error, data };
  } catch (e) {
    return { url, ok: false, data: { fetch_error: String(e) } };
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("*")
    .eq("user_id", session.user.id)
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "No Instagram account connected" }, { status: 404 });
  }

  const igUserId = account.instagram_user_id;
  const token    = account.access_token;
  const tokenPfx = token.slice(0, 12) + "...";

  // Use 90-day window — user hasn't posted in 30 days
  const until = new Date();
  until.setHours(0, 0, 0, 0);
  const since = new Date(until);
  since.setDate(since.getDate() - 90);
  const sinceTs = toUnix(since);
  const untilTs = toUnix(until);

  const calls = [
    // 1. Verify the account identity
    `${BASE}/me?fields=id,username,account_type,media_count&access_token=${token}`,
    // 2. Views — bare (returns empty in our testing)
    `${BASE}/${igUserId}/insights?metric=views&period=total_over_range&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 3. Views — with metric_type=total_value
    `${BASE}/${igUserId}/insights?metric=views&period=day&metric_type=total_value&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 4. Views — period=day + breakdown follow_type
    `${BASE}/${igUserId}/insights?metric=views&period=day&breakdown=follow_type&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 5. Reach — total_over_range (works in 90d)
    `${BASE}/${igUserId}/insights?metric=reach&period=total_over_range&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 6. Reach — total_over_range + follow_type breakdown (errored at 30d)
    `${BASE}/${igUserId}/insights?metric=reach&period=total_over_range&breakdown=follow_type&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 7. Reach — period=day
    `${BASE}/${igUserId}/insights?metric=reach&period=day&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 8. Try alternate: profile_views (legacy account metric)
    `${BASE}/${igUserId}/insights?metric=profile_views&period=day&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 9. accounts_engaged
    `${BASE}/${igUserId}/insights?metric=accounts_engaged&period=total_over_range&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 10. total_interactions
    `${BASE}/${igUserId}/insights?metric=total_interactions&period=total_over_range&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 11. views + metric_type=total_value + follow_type breakdown
    `${BASE}/${igUserId}/insights?metric=views&period=day&metric_type=total_value&breakdown=follow_type&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 12. views + metric_type=total_value + media_product_type breakdown
    `${BASE}/${igUserId}/insights?metric=views&period=day&metric_type=total_value&breakdown=media_product_type&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 13. reach + metric_type=total_value
    `${BASE}/${igUserId}/insights?metric=reach&period=day&metric_type=total_value&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
    // 14. reach + metric_type=total_value + follow_type
    `${BASE}/${igUserId}/insights?metric=reach&period=day&metric_type=total_value&breakdown=follow_type&since=${sinceTs}&until=${untilTs}&access_token=${token}`,
  ];

  const results = await Promise.all(calls.map(rawFetch));

  return NextResponse.json({
    ig_user_id: igUserId,
    token_prefix: tokenPfx,
    window: { since: since.toISOString(), until: until.toISOString(), sinceTs, untilTs },
    calls: results,
  });
}
