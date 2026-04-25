import Link from "next/link";
import { Audit } from "@/types";

const statusStyles: Record<string, string> = {
  pending:   "bg-neutral-800 text-neutral-400",
  scraping:  "bg-blue-950 text-blue-400",
  analyzing: "bg-purple-950 text-purple-400",
  complete:  "bg-emerald-950 text-emerald-400",
  failed:    "bg-red-950 text-red-400",
};

export default function AuditList({ audits }: { audits: Audit[] }) {
  if (audits.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
        <p className="text-neutral-500 text-sm">No audits yet. Connect your Instagram and run your first audit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {audits.map((audit) => (
        <Link
          key={audit.id}
          href={`/audit/${audit.id}`}
          className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4 hover:border-neutral-700 transition-colors"
        >
          <div>
            <p className="text-sm text-white">
              {new Date(audit.date_range_start).toLocaleDateString()} →{" "}
              {new Date(audit.date_range_end).toLocaleDateString()}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {audit.total_posts_scraped} posts ·{" "}
              {new Date(audit.triggered_at).toLocaleDateString()}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[audit.status] || statusStyles.pending}`}>
            {audit.status}
          </span>
        </Link>
      ))}
    </div>
  );
}
