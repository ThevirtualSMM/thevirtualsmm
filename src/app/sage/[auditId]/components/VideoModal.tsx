"use client";

import { useEffect } from "react";
import { useSage } from "../SageContext";
import HookChip from "./HookChip";
import InsightChip from "./InsightChip";
import ScoreBar from "./ScoreBar";
import { CloseIcon } from "./icons";
import { hookLabel } from "../lib/scoring";

const COLORS = {
  border: "rgba(31,27,46,0.10)",
  card:   "#fff",
  dark:   "#1F1B2E",
  muted:  "#7A7088",
  green:  "#b8ff57",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString();
}

const WAVEFORM_BARS = 9;
// Pre-generated peak heights so each bar feels distinct
const PEAKS = [22, 38, 14, 30, 40, 18, 34, 24, 28];

export default function VideoModal() {
  const { selectedVideo, setSelectedVideo } = useSage();

  // Close on Esc
  useEffect(() => {
    if (!selectedVideo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedVideo(null); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selectedVideo, setSelectedVideo]);

  if (!selectedVideo) return null;
  const v = selectedVideo;

  return (
    <div
      className="fixed inset-0 sage-modal-fade"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => setSelectedVideo(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sage-modal-title"
        className="sage-modal-pop"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, width: 380, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Player area */}
        <div className="relative flex flex-col items-center justify-center" style={{ background: "#111", height: 200 }}>
          <button
            type="button"
            onClick={() => setSelectedVideo(null)}
            aria-label="Close"
            className="absolute"
            style={{
              top: 12, right: 12,
              width: 26, height: 26, borderRadius: "50%",
              background: "rgba(255,255,255,0.20)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <CloseIcon width={13} height={13} />
          </button>

          {/* Animated waveform */}
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
              <span
                key={i}
                className="sage-wave-bar"
                style={{
                  width: 3, borderRadius: 999, background: COLORS.green,
                  ["--peak" as string]: `${PEAKS[i]}px`,
                  ["--delay" as string]: `${(i % 5) * 0.12}s`,
                  height: "8px",
                }}
              />
            ))}
          </div>
          <div style={{ color: COLORS.green, fontSize: 12, fontWeight: 600 }}>Analyzing video…</div>
        </div>

        {/* Body */}
        <div style={{ padding: "1rem" }}>
          <h2 id="sage-modal-title" style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, lineHeight: 1.4, marginBottom: 10 }}>
            {v.title}
          </h2>

          {/* Hook type row */}
          <div
            className="flex items-center justify-between gap-2 mb-2.5"
            style={{ background: "#f8f8f2", borderRadius: 10, padding: "0.55rem 0.75rem" }}
          >
            <span style={{ color: COLORS.muted, fontSize: 10 }}>Hook type</span>
            <div className="flex items-center gap-2">
              <span style={{ color: COLORS.dark, fontSize: 11, fontWeight: 600 }}>{hookLabel(v.hookType)}</span>
              <HookChip hook={v.hookType} />
            </div>
          </div>

          {/* Key metrics 2x2 */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              { label: "Views",    value: fmt(v.views) },
              { label: "Likes",    value: fmt(v.likes) },
              { label: "Comments", value: fmt(v.comments) },
              { label: "Saves",    value: fmt(v.saves) },
            ].map((m) => (
              <div
                key={m.label}
                style={{ background: "#f8f8f2", borderRadius: 10, padding: "0.5rem 0.75rem" }}
              >
                <div style={{ color: COLORS.dark, fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>{m.value}</div>
                <div style={{ color: COLORS.muted, fontSize: 10, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Score bars with breathing room */}
          <div className="space-y-2 mb-3">
            <ScoreBar label="Hook"      value={v.scores.hook} />
            <ScoreBar label="Caption"   value={v.scores.caption} />
            <ScoreBar label="CTA"       value={v.scores.cta} />
            <ScoreBar label="Retention" value={v.scores.retention} />
          </div>

          {/* Insight */}
          <InsightChip tier={v.insightTier} text={v.insight} />
        </div>
      </div>
    </div>
  );
}
