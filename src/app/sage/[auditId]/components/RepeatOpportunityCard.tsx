"use client";

import { useSage } from "../SageContext";

const COLORS = {
  border: "rgba(31,27,46,0.10)",
  card:   "#fff",
  dark:   "#1F1B2E",
  muted:  "#7A7088",
  green:  "#b8ff57",
  pink:   "#ff4d8d",
};

export default function RepeatOpportunityCard() {
  const { auditData } = useSage();

  return (
    <div
      className="sage-fade-in-up"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "1rem 1.1rem",
        animationDelay: "0.7s",
        animationFillMode: "both",
      }}
    >
      <h3
        style={{
          fontSize: 11, fontWeight: 600, color: COLORS.muted,
          textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, marginBottom: 10,
        }}
      >
        Repeat vs opportunity
      </h3>

      <div className="flex flex-col gap-1.5">
        {auditData.repeatOpportunity.map((it, i) => {
          const isRepeat = it.kind === "repeat";
          return (
            <div
              key={i}
              className="flex items-center gap-2.5"
              style={{
                padding: "0.55rem 0.75rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 11,
                background: COLORS.card,
              }}
            >
              <span
                style={{
                  background:   isRepeat ? COLORS.green : "rgba(255,77,141,0.16)",
                  color:        isRepeat ? "#111" : COLORS.pink,
                  border:       isRepeat ? "none" : `1px solid rgba(255,77,141,0.4)`,
                  fontSize:     9, fontWeight: 700,
                  padding:      "3px 8px",
                  borderRadius: 20,
                  flexShrink:   0,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {isRepeat ? "Repeat" : "Opportunity"}
              </span>
              <span style={{ color: COLORS.dark, fontSize: 11, lineHeight: 1.4, flex: 1 }}>{it.text}</span>
              <span style={{ color: COLORS.muted, fontSize: 10, whiteSpace: "nowrap" }}>{it.stat}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
