"use client";

import Link from "next/link";
import { Audit, Post } from "@/types";
import PerformanceChart from "./PerformanceChart";
import MetricCard from "./MetricCard";
import PostCard from "./PostCard";
import PostGallery from "./PostGallery";
import AccountInsightsPanel from "@/components/dashboard/AccountInsightsPanel";

function sum(posts: Post[], key: keyof Post): number {
  return posts.reduce((a, p) => a + Number(p[key] || 0), 0);
}

// Weighted rate: total actions across all posts ÷ total reach
// More accurate than simple average — gives proper weight to high-reach posts
function weightedRate(posts: Post[], rateKey: keyof Post): number {
  const totalReach = sum(posts, "accounts_reached");
  if (totalReach === 0) return 0;
  const totalActions = posts.reduce((a, p) => {
    return a + Number(p[rateKey] || 0) * Number(p.accounts_reached || 0);
  }, 0);
  return totalActions / totalReach;
}

function pct(val: number) {
  return `${(val * 100).toFixed(1)}%`;
}

interface AuditReportProps {
  audit: Audit;
  posts: Post[];
  followerReach?: number | null;
  nonFollowerReach?: number | null;
}

export default function AuditReport({ audit, posts, followerReach, nonFollowerReach }: AuditReportProps) {
  const analysis = audit.claude_json;

  const bestByViews = posts.filter((p) => p.performance_tiers?.includes("best_views"));
  const bestByEngagement = posts.filter((p) => p.performance_tiers?.includes("best_engagement"));
  const bestByFollowers = posts.filter((p) => p.performance_tiers?.includes("best_followers"));
  const worstByViews = posts.filter((p) => p.performance_tiers?.includes("worst_views"));

  // Most viewed reel/video
  const videos = posts.filter((p) => p.post_type === "reel" || p.post_type === "video");
  const mostViewedVideo = videos.length > 0
    ? videos.reduce((a, b) => (b.views || 0) > (a.views || 0) ? b : a)
    : null;

  // Most shared post (highest share_rate * reach as proxy for raw shares)
  const mostShared = posts.length > 0
    ? posts.reduce((a, b) => {
        const aShares = (a.share_rate || 0) * (a.accounts_reached || 0);
        const bShares = (b.share_rate || 0) * (b.accounts_reached || 0);
        return bShares > aShares ? b : a;
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-neutral-900 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-white transition-colors">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">
            {new Date(audit.date_range_start).toLocaleDateString()} –{" "}
            {new Date(audit.date_range_end).toLocaleDateString()}
          </span>
          <a
            href={`/api/pdf/${audit.id}`}
            className="bg-white text-black text-xs font-medium rounded-lg px-3.5 py-2 hover:bg-neutral-200 transition-colors"
          >
            Download PDF
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* AI Summary */}
        {audit.claude_summary && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">AI Summary</h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <p className="text-neutral-300 text-sm leading-relaxed">{audit.claude_summary}</p>
            </div>
          </section>
        )}

        {/* Overview metrics */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard label="Total Posts" value={posts.length.toString()} />
            <MetricCard
              label="Avg Views / Post"
              value={posts.length > 0 ? Math.round(sum(posts, "views") / posts.length).toLocaleString() : "—"}
            />
            <MetricCard label="Avg Watch Time" value={
              (() => {
                const reelsWithWatch = posts.filter(p => p.avg_watch_time_seconds != null && p.avg_watch_time_seconds > 0);
                if (reelsWithWatch.length === 0) return "—";
                const avg = reelsWithWatch.reduce((a, p) => a + (p.avg_watch_time_seconds || 0), 0) / reelsWithWatch.length;
                return `${avg.toFixed(1)}s`;
              })()
            } />
            <MetricCard
              label="Reach — Followers"
              value={followerReach != null ? followerReach.toLocaleString() : "—"}
            />
            <MetricCard
              label="Reach — Non-followers"
              value={nonFollowerReach != null ? nonFollowerReach.toLocaleString() : "—"}
            />
            <MetricCard label="Avg Like Rate" value={pct(weightedRate(posts, "like_rate"))} />
            <MetricCard label="Avg Save Rate" value={pct(weightedRate(posts, "save_rate"))} />
            <MetricCard label="Avg Share Rate" value={pct(weightedRate(posts, "share_rate"))} />
            <MetricCard label="Avg Comment Rate" value={pct(weightedRate(posts, "comment_rate"))} />
          </div>
        </section>

        {/* Account Insights — locked to this audit's exact date window */}
        <section>
          <AccountInsightsPanel
            since={audit.date_range_start}
            until={audit.date_range_end}
            showToggle={false}
          />
        </section>

        {/* Post Gallery */}
        {posts.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-6">
              All Posts — Click for Details
            </h2>
            <PostGallery posts={posts} auditId={audit.id} />
          </section>
        )}

        {/* Most Viewed Video */}
        {mostViewedVideo && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Most Viewed Video</h2>
            <PostCard post={mostViewedVideo} metric="views" />
          </section>
        )}

        {/* Most Shared */}
        {mostShared && mostShared.share_rate && mostShared.share_rate > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Most Shared Post</h2>
            <PostCard post={mostShared} metric="engagement" />
          </section>
        )}

        {/* Chart */}
        {posts.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Views Over Time</h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <PerformanceChart posts={posts} />
            </div>
          </section>
        )}

        {/* Best posts */}
        {bestByViews.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Best — Most Views</h2>
            <div className="space-y-3">
              {bestByViews.map((p) => <PostCard key={p.id} post={p} metric="views" />)}
            </div>
          </section>
        )}

        {bestByEngagement.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Best — Highest Engagement</h2>
            <div className="space-y-3">
              {bestByEngagement.map((p) => <PostCard key={p.id} post={p} metric="engagement" />)}
            </div>
          </section>
        )}

        {bestByFollowers.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Best — Most Followers Gained</h2>
            <div className="space-y-3">
              {bestByFollowers.map((p) => <PostCard key={p.id} post={p} metric="followers" />)}
            </div>
          </section>
        )}

        {worstByViews.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Needs Improvement</h2>
            <div className="space-y-3">
              {worstByViews.map((p) => <PostCard key={p.id} post={p} metric="views" />)}
            </div>
          </section>
        )}

        {/* Patterns */}
        {analysis?.patterns && analysis.patterns.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Patterns Found</h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {analysis.patterns.map((p, i) => (
                <div key={i} className="px-5 py-4 text-sm text-neutral-300">{p}</div>
              ))}
            </div>
          </section>
        )}

        {analysis?.notable_observations && analysis.notable_observations.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Notable Observations</h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {analysis.notable_observations.map((o, i) => (
                <div key={i} className="px-5 py-4 text-sm text-neutral-300">{o}</div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
