"use client";

import { STEPS, type StepId } from "../state";

const LABELS: Record<StepId, string> = {
  goal:        "Goal",
  audience:    "Audience",
  branding:    "Brand",
  archetype:   "Archetype",
  account:     "Account",
  competitors: "Compete",
};

const ICONS: Record<StepId, string> = {
  goal:        "🎯",
  audience:    "👥",
  branding:    "✨",
  archetype:   "🎭",
  account:     "📷",
  competitors: "⚔️",
};

interface Props {
  currentStep: StepId;
  completedSteps: StepId[];
  onStepClick?: (step: StepId) => void;
}

/**
 * Treasure-route progress map. Renders a winding dotted path with one node
 * per step. The path between completed nodes is solid; the active node
 * pulses; future nodes are dashed/muted.
 */
export default function OnboardingMap({ currentStep, completedSteps, onStepClick }: Props) {
  const currentIdx = STEPS.indexOf(currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-6 pb-2">
      <div className="relative">
        {/* Background dotted path */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 60"
          className="absolute inset-0 w-full h-[60px] pointer-events-none"
          preserveAspectRatio="none"
        >
          <path
            d="M 30 30 Q 130 5, 200 30 T 400 30 T 570 30"
            fill="none"
            stroke={"#E9E3D8"}
            strokeWidth="2"
            strokeDasharray="4 5"
            strokeLinecap="round"
          />
          {/* Progress overlay */}
          <path
            d="M 30 30 Q 130 5, 200 30 T 400 30 T 570 30"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              strokeDasharray: 800,
              strokeDashoffset: 800 - (currentIdx / (STEPS.length - 1)) * 800,
              transition: "stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5B21B6" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#FB7185" />
            </linearGradient>
          </defs>
        </svg>

        {/* Nodes */}
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}>
          {STEPS.map((step, i) => {
            const isDone    = completedSteps.includes(step);
            const isCurrent = step === currentStep;
            const isLocked  = i > currentIdx && !isDone;
            const clickable = (isDone || isCurrent || i === currentIdx + 1) && !!onStepClick;

            return (
              <div key={step} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => clickable && onStepClick?.(step)}
                  disabled={isLocked}
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-[#5B21B6] to-[#FB7185] text-white shadow-[0_0_0_6px_rgba(123,58,237,0.15)] scale-110"
                      : isDone
                      ? "bg-[#1F1B2E] text-white"
                      : "bg-[#FAF7F2] border-2 border-dashed border-[#E9E3D8] text-[#8B829F]"
                  } ${clickable && !isCurrent ? "hover:scale-105 cursor-pointer" : ""} ${isLocked ? "cursor-not-allowed" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${i + 1}: ${LABELS[step]}${isCurrent ? " (current)" : ""}`}
                >
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full"
                      style={{
                        animation: "onb-pulse 2s ease-out infinite",
                        background: "radial-gradient(circle, rgba(123,58,237,0.4) 0%, transparent 70%)",
                      }}
                    />
                  )}
                  <span className="relative">{ICONS[step]}</span>
                </button>
                <span
                  className={`mt-2 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                    isCurrent ? "text-[#1F1B2E]" : isDone ? "text-[#544A6B]" : "text-[#8B829F]"
                  }`}
                >
                  {LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes onb-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
