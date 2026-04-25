import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramAccountId,
} from "@/lib/instagram/client";
import { supabase } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(new URL("/dashboard?ig_error=denied", req.nextUrl));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?ig_error=missing_params", req.nextUrl));
  }

  let userId: string;
  try {
    userId = Buffer.from(state, "base64").toString("utf8");
  } catch {
    return NextResponse.redirect(new URL("/dashboard?ig_error=invalid_state", req.nextUrl));
  }

  try {
    const shortToken = await exchangeCodeForToken(code);
    const { token: longToken, expires_in } = await getLongLivedToken(shortToken);
    const { igUserId, username, pageAccessToken } = await getInstagramAccountId(longToken);

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Upsert — replace if same Instagram account reconnected
    await supabase.from("instagram_accounts").upsert(
      {
        user_id: userId,
        instagram_user_id: igUserId,
        username,
        access_token: pageAccessToken,
        token_expires_at: tokenExpiresAt,
      },
      { onConflict: "user_id,instagram_user_id" }
    );

    return NextResponse.redirect(new URL("/dashboard?ig_connected=1", req.nextUrl));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("Instagram OAuth error:", msg);
    const url = new URL("/dashboard", req.nextUrl);
    url.searchParams.set("ig_error", encodeURIComponent(msg));
    return NextResponse.redirect(url);
  }
}
