import type { Tier } from "../lib/types";

const STYLES: Record<Tier, { bg: string; text: string; dot: string }> = {
  green: { bg: "rgba(184,255,87,0.18)", text: "#4a7000", dot: "#4a7000" },
  amber: { bg: "rgba(240,165,0,0.15)",  text: "#7a5000", dot: "#c98800" },
  red:   { bg: "rgba(255,77,141,0.15)", text: "#a83061", dot: "#ff4d8d" },
};

export default function BenchmarkPill({ tier, label }: { tier: Tier; label: string }) {
  const s = STYLES[tier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        background: s.bg,
        color:      s.text,
        fontSize:   9,
        fontWeight: 600,
        padding:    "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
      {label}
    </span>
  );
}
