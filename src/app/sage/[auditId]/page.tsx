import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { buildAuditData } from "./lib/buildAuditData";
import { buildDemoAuditData } from "./lib/buildDemoData";
import { SageProvider } from "./SageContext";
import SageDashboard from "./SageDashboard";
import SageInProgress from "./SageInProgress";
import "./sage.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Sage audit — Virtual SMMA" };

interface Params {
  params: Promise<{ auditId: string }>;
  searchParams: Promise<{ u?: string }>;
}

export default async function SagePage({ params, searchParams }: Params) {
  const { auditId } = await params;
  const sp = await searchParams;

  // ── Demo path: anonymous visitor from the landing page. No DB lookup,
  // no auth required — just a Sage dashboard built from the typed handle.
  if (auditId === "demo") {
    const auditData = buildDemoAuditData(sp.u ?? "your_account");
    return (
      <SageProvider auditData={auditData}>
        <SageDashboard />
      </SageProvider>
    );
  }

  const { data: audit } = await supabase
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .maybeSingle();
  if (!audit) notFound();

  if (audit.status !== "complete") {
    return <SageInProgress status={audit.status} errorMessage={audit.error_message ?? null} />;
  }

  // Pull all the bits we need to build the typed AuditData. Each query is
  // independent so we run them in parallel.
  const [postsResult, accountResult, brandResult] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .eq("audit_id", auditId)
      .order("views", { ascending: false }),
    supabase
      .from("instagram_accounts")
      .select("username")
      .eq("id", audit.instagram_account_id)
      .maybeSingle(),
    supabase
      .from("brand_profiles")
      .select("responses")
      .eq("user_id", audit.user_id)
      .maybeSingle(),
  ]);

  const posts   = postsResult.data ?? [];
  const account = accountResult.data ?? { username: "your_account" };
  const brand   = brandResult.data?.responses ?? null;

  const auditData = buildAuditData({
    posts,
    account,
    brand,
    audit: { date_range_start: audit.date_range_start, date_range_end: audit.date_range_end },
  });

  return (
    <SageProvider auditData={auditData}>
      <SageDashboard />
    </SageProvider>
  );
}
