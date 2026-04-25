"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunAuditButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/audit/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagram_account_id: accountId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to start audit");
      setLoading(false);
      return;
    }

    router.push(`/audit/${data.audit_id}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRun}
        disabled={loading}
        className="bg-white text-black text-sm font-medium rounded-lg px-4 py-2 hover:bg-neutral-200 transition-colors disabled:opacity-50"
      >
        {loading ? "Starting..." : "Run Audit"}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
