"use client";

import Image from "next/image";
import { useSage } from "../SageContext";
import type { VideoItem } from "../lib/types";
import HookChip from "./HookChip";
import InsightChip from "./InsightChip";
import ScoreBar from "./ScoreBar";
import { PlayIcon } from "./icons";

const COLORS = {
  border: "rgba(31,27,46,0.10)",
  dark:   "#1F1B2E",
  muted:  "#7A7088",
  bg:     "#F4F1EA",
  green:  "#b8ff57",
};

interface Props {
  video: VideoItem;
  rank: 1 | 2 | 3;
  showLast?: boolean;
  /**
   * Which 4 score dimensions to render. The "viewed" card uses the spec's
   * defaults (hook/caption/cta/retention). The "engagement" card uses
   * engagement / save / comment rates instead.
   */
  variant?: "scores" | "engagement";
}

const RANK_STYLES = {
  1: { bg: "#b8ff57",            color: "#111",          border: "transparent" },
  2: { bg: "#111",               color: "#b8ff57",       border: "#b8ff57" },
  3: { bg: "#F4F1EA",            color: "#7A7088",       border: "rgba(31,27,46,0.10)" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function VideoItemRow({ video, rank, showLast = false, variant = "scores" }: Props) {
  const { setSelectedVideo } = useSage();
  const r = RANK_STYLES[rank];

  const bars = variant === "engagement"
    ? [
        { label: "Engagement",  value: clampPct(video.scores.engagementRate ?? 0, 1, 10) },
        { label: "Save rate",   value: clampPct(video.scores.saveRate       ?? 0, 0.5, 6) },
        { label: "Comment rate",value: clampPct(video.scores.commentRate    ?? 0, 0.5, 5) },
        { label: "Retention",   value: video.scores.retention },
      ]
    : [
        { label: "Hook",      value: video.scores.hook      },
        { label: "Caption",   value: video.scores.caption   },
        { label: "CTA",       value: video.scores.cta       },
        { label: "Retention", value: video.scores.retention },
      ];

  return (
    <button
      type="button"
      onClick={() => setSelectedVideo(video)}
      className="text-left w-full group"
      style={{
        borderBottom: showLast ? "none" : `1px solid ${COLORS.border}`,
        padding: "12px 0",
      }}
    >
      <div className="flex gap-2.5 items-start">
        {/* Rank badge */}
        <span
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: r.bg, color: r.color, border: `1px solid ${r.border}`,
            fontSize: 10, fontWeight: 700,
          }}
        >
          {rank}
        </span>

        {/* Thumbnail */}
        <div
          className="relative flex-shrink-0 group-hover:opacity-80 transition-opacity"
          style={{ width: 52, height: 52, borderRadius: 9, overflow: "hidden", background: "linear-gradient(135deg, #5B21B6, #FB7185)" }}
        >
          {video.thumbnailUrl ? (
            <Image src={video.thumbnailUrl} alt="" width={52} height={52} unoptimized style={{ width: 52, height: 52, objectFit: "cover" }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlayIcon width={20} height={20} style={{ color: "#fff" }} />
            </div>
          )}
          <span
            className="absolute"
            style={{ left: "50%", bottom: -14, transform: "translateX(-50%)", color: COLORS.green, fontSize: 8, fontWeight: 700 }}
          >
            Play
          </span>
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div
            style={{
              fontSize: 11, fontWeight: 600, color: COLORS.dark,
              lineHeight: 1.4, marginBottom: 4,
              display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {video.title}
          </div>
          <div className="flex items-center gap-2 mb-1.5" style={{ fontSize: 10, color: COLORS.muted }}>
            <span>{fmt(video.views)} views</span>
            <span>·</span>
            <span>{fmt(video.saves)} saves</span>
            <span>·</span>
            <span>{fmt(video.likes)} likes</span>
          </div>
          <HookChip hook={video.hookType} />
        </div>
      </div>

      {/* Score bars */}
      <div className="mt-3 space-y-1">
        {bars.map((b) => (
          <ScoreBar key={b.label} label={b.label} value={b.value} />
        ))}
      </div>

      {/* Insight chip */}
      <div className="mt-2.5">
        <InsightChip tier={video.insightTier} text={video.insight} />
      </div>
    </button>
  );
}

/** Map a raw % into the 0..100 score-bar scale around target ranges. */
function clampPct(pct: number, ambGreen: number, max: number): number {
  if (pct >= max) return 100;
  if (pct >= ambGreen) return 75 + ((pct - ambGreen) / (max - ambGreen)) * 25;
  return Math.max(5, (pct / ambGreen) * 75);
}
