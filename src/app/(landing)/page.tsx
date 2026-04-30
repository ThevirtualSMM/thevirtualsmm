import { auth } from "@/lib/auth";
import Link from "next/link";
import LandingHero from "./LandingHero";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Virtual SMMA — A 2-minute audit for your Instagram",
  description: "Get a smart, AI-driven Instagram audit. Type your handle and we'll analyze the last 30 days.",
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; autorun?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const initialHandle = (params.u ?? "").replace(/^@/, "").trim();
  const autorun = params.autorun === "1";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF7F2" }}>
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#1F1B2E] font-semibold text-base">
            <span
              aria-hidden="true"
              className="inline-block w-7 h-7 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #5B21B6 0%, #FB7185 100%)",
              }}
            />
            <span>Virtual SMMA</span>
          </Link>

          <nav className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#1F1B2E] bg-white border border-[#E9E3D8] hover:border-[#5B21B6] rounded-full px-4 py-2 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[#544A6B] hover:text-[#1F1B2E]">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-white bg-[#1F1B2E] hover:bg-[#5B21B6] rounded-full px-4 py-2 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-3xl w-full text-center">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 bg-[#FBA68A]/30 border border-[#FB7185]/30 rounded-full px-4 py-1.5 text-xs font-semibold text-[#7C3AED] uppercase tracking-wider mb-7">
            <span aria-hidden="true">✨</span>
            <span>From audit to strategy in 2 minutes</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1F1B2E] tracking-tight leading-[1.05]">
            What's actually working <br className="hidden md:block" />
            on your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #5B21B6, #FB7185)" }}
            >
              Instagram
            </span>
            ?
          </h1>

          <p className="mt-6 text-lg md:text-xl text-[#544A6B] max-w-xl mx-auto leading-relaxed">
            Drop your handle. We'll audit the last 30 days, surface what's
            growing your account, and tell you what to do next.
          </p>

          <div className="mt-10">
            <LandingHero initialHandle={initialHandle} autorun={autorun} />
          </div>

          {/* Trust line */}
          <p className="mt-12 text-xs text-[#8B829F] uppercase tracking-[0.2em]">
            Read-only · Never posts on your behalf
          </p>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E9E3D8] px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[#8B829F]">
          <span>© {new Date().getFullYear()} Virtual SMMA</span>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-[#1F1B2E]">Log in</Link>
            <Link href="/signup" className="hover:text-[#1F1B2E]">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
