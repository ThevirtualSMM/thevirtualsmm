"use client";

import { useSage } from "../SageContext";
import { CheckIcon, LockIcon } from "./icons";

const COLORS = {
  border: "rgba(31,27,46,0.10)",
  card:   "#fff",
  dark:   "#1F1B2E",
  muted:  "#7A7088",
};

const PERKS = [
  "30-day content calendar",
  "10 hooks in your brand voice",
  "Competitor script remixes",
  "Weekly niche trend alerts",
];

export default function LockedFullAudit() {
  const { onUpgrade } = useSage();

  return (
    <div
      className="relative sage-fade-in-up"
      style={{
        animationDelay: "0.9s",
        animationFillMode: "both",
        minHeight: 280,
      }}
    >
      {/* ── Blurred preview behind the unlock card ──────────────────── */}
      <div
        aria-hidden="true"
        style={{ filter: "blur(6px)", pointerEvents: "none" }}
      >
        <div
          style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: "1rem 1.1rem",
          }}
        >
          <h3
            style={{
              fontSize: 11, fontWeight: 600, color: COLORS.muted,
              textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, marginBottom: 12,
            }}
          >
            30-Day Content Plan
          </h3>
          {/* Fake list rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#5B21B6,#FB7185)" }} />
              <div className="flex-1">
                <div style={{ background: "#eee", height: 8, width: "70%", borderRadius: 4, marginBottom: 4 }} />
                <div style={{ background: "#eee", height: 6, width: "50%", borderRadius: 4 }} />
              </div>
              <div style={{ background: "rgba(184,255,87,0.4)", height: 14, width: 36, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Unlock card overlay ─────────────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          padding: "1.1rem 1.25rem",
          maxWidth: 240,
          textAlign: "center",
          boxShadow: "0 16px 40px -12px rgba(31,27,46,0.20)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #b8ff57, #ff4d8d)",
            color: "#fff", marginBottom: 10,
          }}
        >
          <LockIcon width={15} height={15} />
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.dark, margin: 0, marginBottom: 4 }}>
          See the full picture
        </h4>
        <p style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5, margin: 0, marginBottom: 12 }}>
          30-day plan, scripts, hooks and weekly trend alerts — built for your account.
        </p>

        <ul className="text-left mb-3 mx-1" style={{ listStyle: "none", padding: 0 }}>
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: 11, color: COLORS.dark }}>
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 14, height: 14, borderRadius: 4,
                  background: "rgba(184,255,87,0.30)", color: "#4a7000",
                }}
              >
                <CheckIcon width={9} height={9} />
              </span>
              {perk}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onUpgrade}
          className="w-full transition-opacity"
          style={{
            background: COLORS.dark, color: "#fff",
            borderRadius: 10, padding: "9px 18px",
            fontSize: 12, fontWeight: 600,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Unlock full audit →
        </button>
      </div>
    </div>
  );
}
