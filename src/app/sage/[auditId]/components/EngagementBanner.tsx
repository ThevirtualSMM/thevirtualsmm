"use client";

import { useSage } from "../SageContext";
import { calculateScores } from "../lib/scoring";
import { CrownIcon } from "./icons";
import CountUp from "./CountUp";

export default function EngagementBanner() {
  const { auditData } = useSage();
  const { engagementRate: er, erTier } = calculateScores(auditData.profile);

  return (
    <div
      className="sage-fade-in-up flex items-center justify-between"
      style={{
        background: "linear-gradient(90deg, #6a11cb 0%, #c5507e 35%, #ff4d8d 65%, #f0a500 100%)",
        borderRadius: 14,
        padding: "0.9rem 1.5rem",
        gap: "1rem",
        animationDelay: "0.4s",
        animationFillMode: "both",
      }}
    >
      {/* Left zone */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center"
          style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.25)", color: "#fff" }}
        >
          <CrownIcon />
        </div>
        <div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Engagement Rate</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>
            Based on your last 12 posts
          </div>
        </div>
      </div>

      {/* Center zone */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{erTier.bigLabel}</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>{erTier.copy}</div>
      </div>

      {/* Right zone */}
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#fff", fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
          <CountUp to={er * 10} durationMs={1100} format={(n) => `${(n / 10).toFixed(1)}%`} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 4 }}>engagement rate</div>
      </div>
    </div>
  );
}
