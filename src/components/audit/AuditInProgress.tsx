"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Audit } from "@/types";

const statusMessages: Record<string, string> = {
  pending:   "Starting audit...",
  scraping:  "Fetching your Instagram posts and metrics...",
  analyzing: "Analyzing your 90-day performance...",
};

export default function AuditInProgress({ audit }: { audit: Audit }) {
  const router = useRouter();

  useEffect(() => {
    if (audit.status === "failed") return;
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [router, audit.status]);

  if (audit.status === "failed") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-10 h-10 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 text-xl font-bold">
            !
          </div>
          <h2 className="text-white font-medium mb-2">Audit failed</h2>
          <div className="mt-3 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 text-left">
            {audit.error_message || "Something went wrong. Please try again."}
          </div>
          <Link
            href="/dashboard"
            className="inline-block mt-6 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-white font-medium mb-2">Running your audit</h2>
        <p className="text-neutral-500 text-sm">
          {statusMessages[audit.status] || "Processing..."}
        </p>
        <p className="text-neutral-700 text-xs mt-8">
          This usually takes 1–2 minutes. This page refreshes automatically.
        </p>
      </div>
    </div>
  );
}
