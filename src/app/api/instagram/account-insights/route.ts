import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { fetchAccountInsights } from "@/lib/instagram/account-insights";

// Simple in-memory cache — 1 hour TTL
const cache = new Map<string, { data: unknown; expires: number }>();

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = req.nextUrl.searchParams.get("days");
  const days: 30 | 90 = daysParam === "90" ? 90 : 30;

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

  const cacheKey = `${account.instagram_user_id}:${days}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const insights = await fetchAccountInsights(
      account.instagram_user_id,
      account.access_token,
      days
    );

    cache.set(cacheKey, { data: insights, expires: Date.now() + 60 * 60 * 1000 });

    return NextResponse.json(insights);
  } catch (err) {
    console.error("Account insights fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch account insights" },
      { status: 500 }
    );
  }
}
