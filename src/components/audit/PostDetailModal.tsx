"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ExternalLink } from "lucide-react";
import { Post } from "@/types";
import ScoreGauge from "./ScoreGauge";
import { computePostScores } from "@/lib/utils/scores";

interface AiResult {
  hook_analysis?: string;
  hook_verdict?: "good" | "average" | "poor";
  strengths?: string[];
  improvements?: string[];
  overall_verdict?: string;
  error?: string;
}

interface Props {
  post: Post;
  allPosts: Post[];
  auditId: string;
  open: boolean;
  onClose: () => void;
}

function pct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function num(v: number | null | undefined) {
  if (v == null || v === 0) return "—";
  return v.toLocaleString();
}

const verdictColors = {
  good: "text-green-400",
  average: "text-yellow-400",
  poor: "text-red-400",
};

export default function PostDetailModal({ post, allPosts, auditId, open, onClose }: Props) {
  const [ai, setAi] = useState<AiResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const scores = computePostScores(post, allPosts);
  const isVideo = post.post_type === "reel" || post.post_type === "video";

  async function runAiAnalysis() {
    setLoadingAi(true);
    try {
      const res = await fetch(`/api/audit/${auditId}/analyze-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.instagram_post_id }),
      });
      setAi(await res.json());
    } catch {
      setAi({ error: "Failed to load analysis" });
    } finally {
      setLoadingAi(false);
    }
  }

  const metrics = [
    { label: "Views", value: num(post.views) },
    { label: "Accounts Reached", value: num(post.accounts_reached) },
    { label: "Followers Gained", value: post.follows_from_post > 0 ? `+${post.follows_from_post.toLocaleString()}` : "—" },
    { label: "Like Rate", value: pct(post.like_rate), formula: "likes ÷ reach" },
    { label: "Share Rate", value: pct(post.share_rate), formula: "shares ÷ reach" },
    { label: "Save Rate", value: pct(post.save_rate), formula: "saves ÷ reach" },
    { label: "Comment Rate", value: pct(post.comment_rate), formula: "comments ÷ reach" },
    { label: "Skip Rate", value: pct(post.skip_rate), formula: "exits ÷ views" },
    ...(isVideo
      ? [
          {
            label: "Avg Watch Time",
            value: post.avg_watch_time_seconds
              ? `${post.avg_watch_time_seconds.toFixed(1)}s`
              : "—",
          },
          {
            label: "Retention",
            value: scores.retention != null ? `${scores.retention.toFixed(1)}%` : "—",
          },
        ]
      : []),
  ];

  const subGauges = [
    { label: "Engagement", score: scores.engagementScore },
    { label: "Reach", score: scores.reachScore },
    { label: "Follows", score: scores.followsScore },
    ...(scores.hookScore != null ? [{ label: "Hook", score: scores.hookScore }] : []),
  ];

  const typeLabel: Record<string, string> = {
    reel: "Reel",
    video: "Video",
    carousel: "Carousel",
    image: "Image",
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111] border border-neutral-800 rounded-2xl p-0 shadow-2xl focus:outline-none">

          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-neutral-800">
            {post.thumbnail_url && (
              <img
                src={post.thumbnail_url}
                alt=""
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0 bg-neutral-800"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                  {typeLabel[post.post_type || ""] || post.post_type}
                </span>
                {post.posted_at && (
                  <span className="text-xs text-neutral-500">
                    {new Date(post.posted_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {post.caption && (
                <p className="text-sm text-neutral-300 line-clamp-3">{post.caption}</p>
              )}
              <a
                href={`https://www.instagram.com/p/${post.instagram_post_id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-neutral-500 hover:text-white transition-colors"
              >
                View on Instagram <ExternalLink size={10} />
              </a>
            </div>
            <Dialog.Close asChild>
              <button className="text-neutral-500 hover:text-white transition-colors flex-shrink-0">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-8">

            {/* Score gauges */}
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-5">Performance Score</p>
              <div className="flex items-end justify-center gap-6 flex-wrap">
                <ScoreGauge score={scores.overall} label="Overall" size="lg" />
                {subGauges.map((g) => (
                  <ScoreGauge key={g.label} score={g.score} label={g.label} size="sm" />
                ))}
              </div>
            </div>

            {/* Metrics grid */}
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Metrics</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {metrics.map((m) => (
                  <div key={m.label} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                    <p className="text-xs text-neutral-500 mb-0.5">{m.label}</p>
                    {"formula" in m && m.formula && (
                      <p className="text-[10px] text-neutral-700 mb-1">{m.formula}</p>
                    )}
                    <p className="text-base font-semibold text-white">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention bar (video only) */}
            {isVideo && scores.retention != null && (
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Retention</p>
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <div className="flex justify-between text-xs text-neutral-500 mb-2">
                    <span>Average watch time</span>
                    <span>{scores.retention.toFixed(1)}% retained</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, scores.retention)}%`,
                        background:
                          scores.retention >= 50
                            ? "#22c55e"
                            : scores.retention >= 25
                            ? "#eab308"
                            : "#ef4444",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-neutral-600 mt-1">
                    <span>0s</span>
                    <span>{post.duration_seconds}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-neutral-500">AI Analysis</p>
                {!ai && (
                  <button
                    onClick={runAiAnalysis}
                    disabled={loadingAi}
                    className="text-xs bg-white text-black px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {loadingAi ? "Analyzing..." : "Run AI Analysis"}
                  </button>
                )}
              </div>

              {!ai && !loadingAi && (
                <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-xl p-6 text-center">
                  <p className="text-neutral-500 text-sm">
                    Click &quot;Run AI Analysis&quot; to get hook feedback and recommendations.
                  </p>
                </div>
              )}

              {loadingAi && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-neutral-400 text-sm">Analyzing with AI...</p>
                </div>
              )}

              {ai && !ai.error && (
                <div className="space-y-3">
                  {/* Hook */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-neutral-500 uppercase tracking-wider">Hook</span>
                      {ai.hook_verdict && (
                        <span className={`text-xs font-medium capitalize ${verdictColors[ai.hook_verdict]}`}>
                          {ai.hook_verdict}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-300">{ai.hook_analysis}</p>
                  </div>

                  {/* Strengths */}
                  {ai.strengths && ai.strengths.length > 0 && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {ai.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-neutral-300 flex gap-2">
                            <span className="text-green-500 flex-shrink-0">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {ai.improvements && ai.improvements.length > 0 && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Improvements</p>
                      <ul className="space-y-1">
                        {ai.improvements.map((imp, i) => (
                          <li key={i} className="text-sm text-neutral-300 flex gap-2">
                            <span className="text-yellow-500 flex-shrink-0">→</span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Overall */}
                  {ai.overall_verdict && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Overall</p>
                      <p className="text-sm text-neutral-300">{ai.overall_verdict}</p>
                    </div>
                  )}
                </div>
              )}

              {ai?.error && (
                <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl p-4">
                  {ai.error}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
