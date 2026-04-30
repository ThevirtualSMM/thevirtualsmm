import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InstagramAccount, Audit } from "@/types";
import ConnectInstagramButton from "@/components/dashboard/ConnectInstagramButton";
import RunAuditButton from "@/components/dashboard/RunAuditButton";
import AuditList from "@/components/dashboard/AuditList";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ig_connected?: string; ig_error?: string; onboarding?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const params = await searchParams;

  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Onboarding gate ────────────────────────────────────────────────────
  // First-time users are redirected to /onboarding. Users who clicked
  // "Skip for now" land here with ?onboarding=skip and we let them through
  // for this render (refreshing without the param would redirect again,
  // which is intentional — completing onboarding is meant to be the path).
  if (params.onboarding !== "skip") {
    const { data: profile, error: profileError } = await supabase
      .from("brand_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    // If the table doesn't exist yet (migration not run), don't gate.
    // Forward-compatible — feature lights up the moment the migration runs.
    const tableMissing = profileError?.message?.toLowerCase().includes("could not find the table");
    if (!profile && !tableMissing) {
      redirect("/onboarding");
    }
  }

  const { data: audits } = await supabase
    .from("audits")
    .select("*")
    .eq("user_id", userId)
    .order("triggered_at", { ascending: false })
    .limit(20);

  const igAccount = account as InstagramAccount | null;
  const auditList = (audits || []) as Audit[];

  const tokenExpiresSoon = igAccount?.token_expires_at
    ? new Date(igAccount.token_expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-neutral-900 px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-white tracking-tight">SMM Audit</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-500">{session.user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Notifications */}
        {params.ig_connected && (
          <div className="mb-6 bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm rounded-lg px-4 py-3">
            Instagram account connected successfully.
          </div>
        )}
        {params.ig_error && (
          <div className="mb-6 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            Could not connect Instagram: {decodeURIComponent(params.ig_error)}
          </div>
        )}
        {tokenExpiresSoon && (
          <div className="mb-6 bg-yellow-950 border border-yellow-800 text-yellow-300 text-sm rounded-lg px-4 py-3">
            Your Instagram connection expires soon.{" "}
            <a href="/api/instagram/connect" className="underline">Reconnect now</a>
          </div>
        )}

        {/* Account section */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
            Instagram Account
          </h2>

          {igAccount ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">@{igAccount.username}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Connected {new Date(igAccount.connected_at).toLocaleDateString()}
                  {igAccount.token_expires_at && (
                    <> · expires {new Date(igAccount.token_expires_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RunAuditButton accountId={igAccount.id} />
                <a
                  href="/api/instagram/connect"
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Reconnect
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <p className="text-neutral-400 text-sm mb-4">
                No Instagram account connected yet.
              </p>
              <ConnectInstagramButton />
            </div>
          )}
        </section>

        {/* Audits section */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
            Audits
          </h2>
          <AuditList audits={auditList} />
        </section>
      </main>
    </div>
  );
}
