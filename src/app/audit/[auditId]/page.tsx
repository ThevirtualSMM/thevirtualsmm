import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { redirect, notFound } from "next/navigation";
import { Audit, Post } from "@/types";
import AuditInProgress from "@/components/audit/AuditInProgress";
import AuditReport from "@/components/audit/AuditReport";

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

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("audit_id", auditId)
    .gte("posted_at", typedAudit.date_range_start)
    .lte("posted_at", typedAudit.date_range_end + "T23:59:59")
    .order("posted_at", { ascending: true });

  return <AuditReport audit={typedAudit} posts={(posts || []) as Post[]} />;
}
