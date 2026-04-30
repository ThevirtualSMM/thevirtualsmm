import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import Onboarding from "./Onboarding";

export const dynamic = "force-dynamic";
export const metadata = { title: "Setup · Virtual SMMA" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("username")
    .eq("user_id", session.user.id)
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <Onboarding
      igConnected={!!account}
      igUsername={account?.username ?? null}
    />
  );
}
