"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunAuditButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<30 | 90 | null>(null);
  const [error, setError] = useState("");

  async function handleRun(days: 30 | 90) {
    setLoading(days);
    setError("");

    const res = await fetch("/api/audit/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagram_account_id: accountId, days }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to start audit");
      setLoading(null);
      return;
    }

    router.push(`/audit/${data.audit_id}`);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRun(30)}
          disabled={loading !== null}
          className="bg-white text-black text-xs font-medium rounded-lg px-3.5 py-2 hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {loading === 30 ? "Starting..." : "Last 30 Days"}
        </button>
        <button
          onClick={() => handleRun(90)}
          disabled={loading !== null}
          className="bg-neutral-800 text-white text-xs font-medium rounded-lg px-3.5 py-2 hover:bg-neutral-700 transition-colors disabled:opacity-50 border border-neutral-700"
        >
          {loading === 90 ? "Starting..." : "Last 90 Days"}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
