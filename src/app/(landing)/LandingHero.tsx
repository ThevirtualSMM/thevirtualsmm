"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingHero({ initialHandle = "", autorun = false }: { initialHandle?: string; autorun?: boolean }) {
  const [handle, setHandle] = useState(initialHandle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // If the user just came back from /login with ?autorun=1, kick off the
  // audit they originally requested without making them click again.
  useEffect(() => {
    if (autorun && initialHandle) {
      void runAudit(initialHandle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAudit(rawHandle: string) {
    const cleaned = rawHandle.replace(/^@/, "").trim();
    if (!cleaned) {
      setError("Type your Instagram handle first");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleaned, days: 30 }),
      });
      const json = await res.json();

      if (json.redirect) {
        window.location.href = json.redirect;
        return;
      }
      if (json.audit_id) {
        router.push(`/audit/${json.audit_id}`);
        return;
      }
      throw new Error(json.error ?? "Couldn't start the audit");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void runAudit(handle);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex items-center bg-white border-2 border-[#E9E3D8] rounded-full pl-5 pr-2 py-2 shadow-[0_8px_24px_-12px_rgba(31,27,46,0.15)] focus-within:border-[#5B21B6] focus-within:shadow-[0_8px_24px_-8px_rgba(91,33,182,0.3)] transition-all">
        <span className="text-[#8B829F] text-base mr-1 select-none">@</span>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
          placeholder="yourhandle"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={submitting}
          className="flex-1 bg-transparent text-base text-[#1F1B2E] placeholder:text-[#8B829F] outline-none py-2 disabled:opacity-50"
          aria-label="Your Instagram handle"
        />
        <button
          type="submit"
          disabled={submitting || !handle.trim()}
          className="ml-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all bg-gradient-to-r from-[#5B21B6] to-[#FB7185] hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <span className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Auditing…</span>
            </>
          ) : (
            <>
              <span>Audit my account</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#8B829F]">
        <span>Free 30-day audit · No card required</span>
      </div>

      {error && (
        <div className="mt-4 max-w-md mx-auto text-center text-sm text-[#BE185D] bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-xl px-4 py-3">
          {error}
        </div>
      )}
    </form>
  );
}
