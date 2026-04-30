import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { createAuditRow, runAudit } from "@/lib/audits/run";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instagram_account_id, days = 30 } = await req.json();
  if (!instagram_account_id) {
    return NextResponse.json({ error: "instagram_account_id required" }, { status: 400 });
  }
  const auditDays: 30 | 90 = days === 90 ? 90 : 30;
  const userId = session.user.id;

  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("*")
    .eq("id", instagram_account_id)
    .eq("user_id", userId)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const created = await createAuditRow({
    userId,
    instagramAccountId: instagram_account_id,
    days: auditDays,
  });
  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 500 });
  }

  after(() =>
    runAudit(created.auditId, userId, account.instagram_user_id, account.access_token, created.since)
  );

  return NextResponse.json({ audit_id: created.auditId });
}
