import { NextResponse } from "next/server";
import { getOAuthUrl } from "@/lib/instagram/client";

export async function GET() {
  const oauthUrl = getOAuthUrl("debug_state");
  return NextResponse.json({
    instagram_app_id: process.env.INSTAGRAM_APP_ID,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    nextauth_url: process.env.NEXTAUTH_URL,
    has_secret: !!process.env.INSTAGRAM_APP_SECRET,
    full_oauth_url: oauthUrl,
  });
}
