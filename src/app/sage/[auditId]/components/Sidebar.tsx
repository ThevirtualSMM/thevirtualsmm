"use client";

import { useState } from "react";
import { GridIcon, LockIcon, DocLinesIcon, LineChartIcon, SparkleIcon } from "./icons";
import type { ComponentType, SVGProps } from "react";

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  id: string;
  label: string;
  icon: IconCmp;
  pro?: boolean;
}

const ITEMS: NavItem[] = [
  { id: "dashboard",   label: "Dashboard",     icon: GridIcon },
  { id: "full",        label: "Full Audit",    icon: LockIcon,      pro: true },
  { id: "content",     label: "Content Plan",  icon: DocLinesIcon,  pro: true },
  { id: "scripts",     label: "Scripts",       icon: LineChartIcon, pro: true },
  { id: "trends",      label: "Trends",        icon: SparkleIcon,   pro: true },
];

const GREEN     = "#b8ff57";
const GREEN_BG  = "rgba(184,255,87,0.10)";
const GREEN_BR  = "rgba(184,255,87,0.25)";

export default function Sidebar() {
  const [active, setActive] = useState<string>("dashboard");

  return (
    <aside
      className="relative overflow-hidden flex flex-col"
      style={{ background: "#111", width: 210, padding: "1.25rem 0.85rem" }}
    >
      {/* Decorative blurred circles */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{ left: -40, bottom: -40, width: 160, height: 160, background: GREEN, opacity: 0.05, filter: "blur(40px)", borderRadius: "50%" }}
      />
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{ right: -40, top: -40, width: 150, height: 150, background: "#ff4d8d", opacity: 0.08, filter: "blur(40px)", borderRadius: "50%" }}
      />

      {/* Logo */}
      <div className="relative px-2 mb-4">
        <span className="text-white font-bold" style={{ fontSize: 19, letterSpacing: -0.5 }}>
          Sage<span style={{ color: GREEN }}>.</span>
        </span>
      </div>

      {/* Section label */}
      <div
        className="relative px-2 mt-4 mb-2 text-white"
        style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", opacity: 0.25 }}
      >
        MENU
      </div>

      {/* Items */}
      <nav className="relative flex flex-col gap-1.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const isLocked = !!item.pro;

          // Pro items: always faded, can't activate.
          const interactive = !isLocked;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => interactive && setActive(item.id)}
              disabled={isLocked}
              className="group relative flex items-center gap-2.5 transition-all"
              style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color:      isActive ? GREEN : "#fff",
                background: isActive ? GREEN_BG : "transparent",
                border:     `1px solid ${isActive ? GREEN_BR : "transparent"}`,
                padding:    "9px 12px",
                borderRadius: 10,
                opacity:    isLocked ? 0.4 : 1,
                cursor:     isLocked ? "not-allowed" : "pointer",
                textAlign:  "left",
                transitionDuration: "150ms",
                transitionTimingFunction: "ease",
              }}
              onMouseEnter={(e) => {
                if (interactive && !isActive) {
                  const el = e.currentTarget;
                  el.style.color = GREEN;
                  el.style.background = GREEN_BG;
                  el.style.borderColor = GREEN_BR;
                }
              }}
              onMouseLeave={(e) => {
                if (interactive && !isActive) {
                  const el = e.currentTarget;
                  el.style.color = "#fff";
                  el.style.background = "transparent";
                  el.style.borderColor = "transparent";
                }
              }}
            >
              <Icon
                width={15}
                height={15}
                style={{
                  color: isActive ? GREEN : "#fff",
                  opacity: isActive ? 1 : 0.5,
                  transition: "color 150ms ease, opacity 150ms ease",
                  flexShrink: 0,
                }}
              />
              <span className="flex-1">{item.label}</span>

              {item.pro && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.60)",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    letterSpacing: "0.04em",
                  }}
                >
                  PRO
                </span>
              )}

              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute"
                  style={{ right: -3, top: "50%", transform: "translateY(-50%)", width: 6, height: 6, borderRadius: "50%", background: GREEN }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer + footer mark */}
      <div className="flex-1" />
      <div className="relative text-white/30 text-[10px] tracking-[0.1em] uppercase px-2">
        Free audit · v1
      </div>
    </aside>
  );
}
