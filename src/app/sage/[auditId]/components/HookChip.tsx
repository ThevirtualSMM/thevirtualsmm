import { hookLabel, hookTier } from "../lib/scoring";
import type { HookType, Tier } from "../lib/types";

const STYLE: Record<Tier, { bg: string; color: string }> = {
  green: { bg: "rgba(184,255,87,0.20)", color: "#4a7000" },
  amber: { bg: "rgba(240,165,0,0.18)",  color: "#7a5000" },
  red:   { bg: "rgba(255,77,141,0.16)", color: "#a83061" },
};

export default function HookChip({ hook, size = "sm" }: { hook: HookType; size?: "sm" | "md" }) {
  const tier = hookTier(hook);
  const s = STYLE[tier];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: size === "md" ? 11 : 10,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {hookLabel(hook)}
    </span>
  );
}
