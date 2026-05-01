import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { createAuditRow, runAudit } from "@/lib/audits/run";

export const maxDuration = 300;

/**
 * One-shot audit kickoff for the landing page. Takes a username, figures
 * out which audit to send the user to, and tells the client where to go next.
 *
 * Body: { username: string, days?: 30 | 90 }
 *
 * Responses (always 200):
 *   { redirect: "/sage/demo?u=<handle>" } — anonymous visitor → free demo audit (no signup)
 *   { redirect: "/api/instagram/connect" } — logged in, no IG connected
 *   { audit_id: "..." }                  — logged-in real audit kickoff succeeded
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { username?: string; days?: number };
  const handle = (body.username ?? "").replace(/^@/, "").trim().toLowerCase();
  const auditDays: 30 | 90 = body.days === 90 ? 90 : 30;

  if (!handle) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    // Anonymous visitor — send them straight to a free demo audit. No
    // signup required. The 'Unlock full audit' CTA on the dashboard is
    // what eventually drives signup.
    return NextResponse.json({ redirect: `/sage/demo?u=${encodeURIComponent(handle)}` });
  }
  const userId = session.user.id;

  // Look up the user's connected IG accounts. We try to match the typed
  // handle case-insensitively; if not found, we fall back to their most
  // recently connected account so the demo flow still works for users who
  // typed the wrong thing.
  const { data: accounts } = await supabase
    .from("instagram_accounts")
    .select("id, instagram_user_id, access_token, username")
    .eq("user_id", userId)
    .order("connected_at", { ascending: false });

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ redirect: "/api/instagram/connect" });
  }

  const matched = accounts.find((a) => (a.username ?? "").toLowerCase() === handle);
  const account = matched ?? accounts[0];

  const created = await createAuditRow({
    userId,
    instagramAccountId: account.id,
    days: auditDays,
  });
  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 500 });
  }

  after(() =>
    runAudit(created.auditId, userId, account.instagram_user_id, account.access_token, created.since)
  );

  return NextResponse.json({
    audit_id:        created.auditId,
    matched_handle:  account.username,
    requested_handle: handle,
    fallback:        !matched,
  });
}
