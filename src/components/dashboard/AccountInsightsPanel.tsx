"use client";

import { useState, useEffect } from "react";

interface ContentBreakdown {
  reels: number;
  stories: number;
  posts: number;
}

interface AccountInsightsResult {
  totalViews: number;
  followerViews: number;
  nonFollowerViews: number;
  totalReach: number;
  viewsByContentType: ContentBreakdown;
  followerViewsByContentType: ContentBreakdown;
  nonFollowerViewsByContentType: ContentBreakdown;
  days: number;
  insufficientData: boolean;
}

type WindowDays = 30 | 90;
type Tab = "all" | "followers" | "non-followers";

const PINK   = "#E879F9";
const PURPLE = "#8B5CF6";

function fmt(n: number) {
  return n.toLocaleString();
}

function pct(value: number, total: number): string {
  if (!total) return "—";
  return `${((value / total) * 100).toFixed(1)}%`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
      <div className="space-y-4">
        <div className="h-3 bg-neutral-800 rounded w-16" />
        <div className="h-12 bg-neutral-800 rounded w-36" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-neutral-800 rounded w-full" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-8 bg-neutral-800 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 bg-neutral-800 rounded w-12" />
            <div className="h-2 bg-neutral-800 rounded flex-1" />
            <div className="h-3 bg-neutral-800 rounded w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar row ───────────────────────────────────────────────────────────────────
interface BarRowProps {
  label: string;
  followerV: number;
  nonFollowerV: number;
  tab: Tab;
  totalForTab: number;
}

function BarRow({ label, followerV, nonFollowerV, tab, totalForTab }: BarRowProps) {
  let barWidthPct: number;
  let pinkPct: number;   // % of bar that is pink
  let purplePct: number; // % of bar that is purple

  if (tab === "all") {
    const categoryTotal = followerV + nonFollowerV;
    barWidthPct = totalForTab > 0 ? (categoryTotal / totalForTab) * 100 : 0;
    pinkPct   = categoryTotal > 0 ? (followerV    / categoryTotal) * 100 : 0;
    purplePct = categoryTotal > 0 ? (nonFollowerV / categoryTotal) * 100 : 0;
  } else if (tab === "followers") {
    barWidthPct = totalForTab > 0 ? (followerV / totalForTab) * 100 : 0;
    pinkPct   = 100;
    purplePct = 0;
  } else {
    barWidthPct = totalForTab > 0 ? (nonFollowerV / totalForTab) * 100 : 0;
    pinkPct   = 0;
    purplePct = 100;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-400 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full flex overflow-hidden"
          style={{ width: `${Math.max(barWidthPct, 0)}%`, transition: "width 0.6s ease" }}
        >
          <div style={{ width: `${pinkPct}%`, background: PINK, transition: "width 0.3s" }} />
          <div style={{ width: `${purplePct}%`, background: PURPLE, transition: "width 0.3s" }} />
        </div>
      </div>
      <span className="text-xs text-neutral-500 w-12 text-right flex-shrink-0 tabular-nums">
        {barWidthPct > 0 ? `${barWidthPct.toFixed(1)}%` : "—"}
      </span>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function AccountInsightsPanel() {
  const [days, setDays] = useState<WindowDays>(30);
  const [tab, setTab] = useState<Tab>("all");
  const [data, setData] = useState<AccountInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/instagram/account-insights?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  // The "total" denominator changes per tab
  const tabTotal = !data
    ? 0
    : tab === "all"
    ? data.totalViews
    : tab === "followers"
    ? data.followerViews
    : data.nonFollowerViews;

  const rows: { label: string; fv: number; nfv: number }[] = data
    ? [
        { label: "Reels",   fv: data.followerViewsByContentType.reels,   nfv: data.nonFollowerViewsByContentType.reels   },
        { label: "Stories", fv: data.followerViewsByContentType.stories, nfv: data.nonFollowerViewsByContentType.stories },
        { label: "Posts",   fv: data.followerViewsByContentType.posts,   nfv: data.nonFollowerViewsByContentType.posts   },
      ]
    : [];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500">Account Insights</h3>

        {/* 30d / 90d toggle */}
        <div className="flex rounded-lg overflow-hidden border border-neutral-700 text-xs">
          {([30, 90] as WindowDays[]).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 transition-colors ${
                days === d
                  ? "bg-white text-black font-medium"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="mt-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Insufficient data */}
      {!loading && !error && data?.insufficientData && (
        <div className="mt-6 text-center py-6">
          <p className="text-neutral-400 text-sm">
            Not enough data — Instagram requires 100+ followers for audience insights.
          </p>
          <p className="text-neutral-600 text-xs mt-1">
            Post some Reels to grow your audience and unlock insights.
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && !data.insufficientData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">

          {/* ── Left column ── */}
          <div>
            <p className="text-xs text-neutral-500 mb-1">Views</p>
            <p className="text-5xl font-bold text-white tracking-tight mb-5">
              {fmt(data.totalViews)}
            </p>

            <div className="space-y-3">
              {/* Followers row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: PINK }} />
                  <span className="text-sm text-neutral-300">Followers</span>
                </div>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {pct(data.followerViews, data.totalViews)}
                </span>
              </div>

              {/* Non-followers row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: PURPLE }} />
                  <span className="text-sm text-neutral-300">Non-followers</span>
                </div>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {pct(data.nonFollowerViews, data.totalViews)}
                </span>
              </div>

              {/* Accounts reached */}
              <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                <span className="text-sm text-neutral-300">Accounts reached</span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {fmt(data.totalReach)}
                </span>
              </div>

              {/* Raw counts for context */}
              {data.followerViews > 0 && (
                <div className="pt-1 space-y-1">
                  <p className="text-xs text-neutral-600">
                    {fmt(data.followerViews)} views from followers
                  </p>
                  <p className="text-xs text-neutral-600">
                    {fmt(data.nonFollowerViews)} views from non-followers
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div>
            {/* Tab pills */}
            <div className="flex gap-1 bg-neutral-800 rounded-lg p-1 mb-5">
              {(["all", "followers", "non-followers"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                    tab === t
                      ? "bg-neutral-700 text-white font-medium"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {t === "all" ? "All" : t === "followers" ? "Followers" : "Non-followers"}
                </button>
              ))}
            </div>

            {/* Bars */}
            <div className="space-y-5">
              {rows.map((row) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  followerV={row.fv}
                  nonFollowerV={row.nfv}
                  tab={tab}
                  totalForTab={tabTotal}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: PINK }} />
                <span className="text-xs text-neutral-500">Followers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: PURPLE }} />
                <span className="text-xs text-neutral-500">Non-followers</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
