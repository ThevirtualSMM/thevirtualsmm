"use client";

import { useEffect, useState } from "react";
import { scoreTier } from "../lib/scoring";
import type { Tier } from "../lib/types";

const FILL: Record<Tier, string> = {
  green: "linear-gradient(90deg, #b8ff57, #8fd400)",
  amber: "linear-gradient(90deg, #f0a500, #f4c542)",
  red:   "linear-gradient(90deg, #ff4d8d, #ff8ab8)",
};

const TEXT: Record<Tier, string> = {
  green: "#4a7000",
  amber: "#7a5000",
  red:   "#a83061",
};

export default function ScoreBar({ label, value }: { label: string; value: number }) {
  const tier = scoreTier(value);
  const [w, setW] = useState(0);

  // Animate fill on mount
  useEffect(() => {
    const t = setTimeout(() => setW(value), 40);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="flex items-center gap-2.5">
      <span style={{ width: 90, fontSize: 10, color: "#7A7088", flexShrink: 0 }}>{label}</span>
      <div className="relative" style={{ flex: 1, height: 5, borderRadius: 999, background: "#f0f0e8", overflow: "hidden" }}>
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            background: FILL[tier],
            borderRadius: 999,
            transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
      <span style={{ width: 26, textAlign: "right", fontSize: 10, fontWeight: 700, color: TEXT[tier] }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}
