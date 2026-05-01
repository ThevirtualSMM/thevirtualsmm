"use client";

import type { VideoItem } from "../lib/types";
import VideoItemRow from "./VideoItemRow";

interface Props {
  title: string;
  videos: VideoItem[];
  variant?: "scores" | "engagement";
  /** Used to stagger the per-item entrance animation */
  baseDelay?: number;
}

export default function VideosCard({ title, videos, variant = "scores", baseDelay = 0.5 }: Props) {
  return (
    <div
      className="sage-fade-in-up"
      style={{
        background: "#fff",
        border: "1px solid rgba(31,27,46,0.10)",
        borderRadius: 16,
        padding: "1rem 1.1rem",
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3
          style={{
            fontSize: 11, fontWeight: 600, color: "#7A7088",
            textTransform: "uppercase", letterSpacing: "0.07em", margin: 0,
          }}
        >
          {title}
        </h3>
        <button
          type="button"
          style={{ color: "#ff4d8d", fontSize: 10, fontWeight: 500 }}
        >
          view all
        </button>
      </div>

      {videos.map((v, i) => (
        <div
          key={v.id}
          className="sage-fade-in-up"
          style={{ animationDelay: `${baseDelay + i * 0.1}s`, animationFillMode: "both" }}
        >
          <VideoItemRow
            video={v}
            rank={(i + 1) as 1 | 2 | 3}
            showLast={i === videos.length - 1}
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}
