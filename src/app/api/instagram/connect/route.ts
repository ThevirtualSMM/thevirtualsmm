import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOAuthUrl } from "@/lib/instagram/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // State encodes the user ID so we can associate the token on callback
  const state = Buffer.from(session.user.id).toString("base64");
  const url = getOAuthUrl(state);

  return NextResponse.redirect(url);
}
