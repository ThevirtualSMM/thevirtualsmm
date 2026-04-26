import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { redirect, notFound } from "next/navigation";
import { Audit, Post } from "@/types";
import AuditInProgress from "@/components/audit/AuditInProgress";
import AuditReport from "@/components/audit/AuditReport";
import { fetchAccountInsights } from "@/lib/instagram/account-insights";

export const dynamic = "force-dynamic";

export default async function AuditPage({ params }: { params: Promise<{ auditId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { auditId } = await params;

  const { data: audit } = await supabase
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .eq("user_id", session.user.id)
    .single();

  if (!audit) notFound();

  const typedAudit = audit as Audit;

  if (typedAudit.status !== "complete") {
    return <AuditInProgress audit={typedAudit} />;
  }

  const [postsResult, accountResult] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .eq("audit_id", auditId)
      .gte("posted_at", typedAudit.date_range_start)
      .lte("posted_at", typedAudit.date_range_end + "T23:59:59")
      .order("posted_at", { ascending: true }),
    supabase
      .from("instagram_accounts")
      .select("instagram_user_id, access_token")
      .eq("user_id", session.user.id)
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const posts = (postsResult.data || []) as Post[];
  const igAccount = accountResult.data;

  // Fetch account-level reach breakdown for the audit's date window
  let followerReach: number | null = null;
  let nonFollowerReach: number | null = null;
  if (igAccount) {
    try {
      const since = new Date(typedAudit.date_range_start);
      const until = new Date(typedAudit.date_range_end);
      until.setHours(23, 59, 59, 999);
      const insights = await fetchAccountInsights(
        igAccount.instagram_user_id,
        igAccount.access_token,
        since,
        until
      );
      followerReach    = insights.followerReach;
      nonFollowerReach = insights.nonFollowerReach;
    } catch {
      // Non-fatal — overview shows "—" for reach breakdown
    }
  }

  return (
    <AuditReport
      audit={typedAudit}
      posts={posts}
      followerReach={followerReach}
      nonFollowerReach={nonFollowerReach}
    />
  );
}
