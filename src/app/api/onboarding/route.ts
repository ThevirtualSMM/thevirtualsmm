import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import type { OnboardingState } from "@/app/onboarding/state";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: OnboardingState;
  try {
    body = (await req.json()) as OnboardingState;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Light validation — we trust the client UI to gate completeness, but reject
  // anything obviously missing so we don't write empty rows.
  if (!body?.goal?.primary || !body?.archetype?.result) {
    return NextResponse.json({ error: "Onboarding is incomplete" }, { status: 400 });
  }

  const { error } = await supabase
    .from("brand_profiles")
    .upsert(
      {
        user_id:              session.user.id,
        responses:            body,
        archetype_primary:    body.archetype.result.primary,
        archetype_secondary:  body.archetype.result.secondary,
        updated_at:           new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[onboarding] upsert failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("brand_profiles")
    .select("responses, archetype_primary, archetype_secondary, updated_at")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? null);
}
