import type { Tier } from "../lib/types";

const STYLE: Record<Tier, { bg: string; color: string; dot: string }> = {
  green: { bg: "rgba(184,255,87,0.22)", color: "#4a7000", dot: "#4a7000" },
  amber: { bg: "rgba(240,165,0,0.16)",  color: "#7a5000", dot: "#c98800" },
  red:   { bg: "rgba(255,77,141,0.14)", color: "#a83061", dot: "#ff4d8d" },
};

export default function InsightChip({ tier, text, fullWidth = true }: { tier: Tier; text: string; fullWidth?: boolean }) {
  const s = STYLE[tier];
  return (
    <div
      className="flex items-start gap-2"
      style={{
        background: s.bg, color: s.color,
        padding: "5px 8px", borderRadius: 7, fontSize: 10, lineHeight: 1.45,
        width: fullWidth ? "100%" : "fit-content",
      }}
    >
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, marginTop: 5, flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}
