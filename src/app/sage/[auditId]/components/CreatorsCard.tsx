"use client";

import { useSage } from "../SageContext";

const COLORS = {
  border: "rgba(31,27,46,0.10)",
  card:   "#fff",
  dark:   "#1F1B2E",
  muted:  "#7A7088",
  green:  "#4a7000",
  amber:  "#7a5000",
};

function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export default function CreatorsCard() {
  const { auditData } = useSage();
  const competitors = auditData.competitors;

  return (
    <div
      className="sage-fade-in-up"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "1rem 1.1rem",
        animationDelay: "0.8s",
        animationFillMode: "both",
      }}
    >
      <h3
        style={{
          fontSize: 11, fontWeight: 600, color: COLORS.muted,
          textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, marginBottom: 6,
        }}
      >
        Creators to watch in your niche
      </h3>

      {competitors.map((c, i) => {
        const isLast = i === competitors.length - 1;
        const initials = c.handle.replace("@", "").slice(0, 2).toUpperCase();
        const erColor = c.engagementRate >= 3 ? COLORS.green : COLORS.amber;

        return (
          <div
            key={c.handle}
            className="flex items-center gap-2.5"
            style={{
              padding: "0.6rem 0",
              borderBottom: isLast ? "none" : `1px solid ${COLORS.border}`,
            }}
          >
            <div
              className="flex items-center justify-center text-white flex-shrink-0"
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: c.avatarColor,
                fontSize: 11, fontWeight: 700,
              }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div style={{ color: COLORS.dark, fontSize: 12, fontWeight: 600 }}>{c.handle}</div>
              <div style={{ color: COLORS.muted, fontSize: 10, marginTop: 1 }}>
                {c.niche}
                {c.followers ? ` · ${fmtFollowers(c.followers)} followers` : ""}
              </div>
              <span
                className="inline-block mt-1"
                style={{
                  background: "rgba(184,255,87,0.22)", color: COLORS.green,
                  fontSize: 9, fontWeight: 600,
                  padding: "2px 7px", borderRadius: 20,
                }}
              >
                {c.studyTag}
              </span>
            </div>

            <span style={{ color: erColor, fontSize: 13, fontWeight: 700 }}>
              {c.engagementRate.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
