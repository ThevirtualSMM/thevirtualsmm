"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingMap from "./components/OnboardingMap";
import GoalSection from "./sections/GoalSection";
import AudienceSection from "./sections/AudienceSection";
import BrandingSection from "./sections/BrandingSection";
import ArchetypeSection from "./sections/ArchetypeSection";
import AccountSection from "./sections/AccountSection";
import CompetitorsSection from "./sections/CompetitorsSection";
import { initialState, reducer, STEPS, type StepId, type OnboardingState } from "./state";

const STORAGE_KEY = "vsmma:onboarding";

interface Props {
  igConnected: boolean;
  igUsername: string | null;
}

export default function Onboarding({ igConnected, igUsername }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const slideRef = useRef<HTMLDivElement>(null);

  // ── Hydrate from localStorage on mount ─────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as OnboardingState;
        dispatch({ type: "HYDRATE", state: saved });
      }
    } catch {
      // Corrupt local state — ignore, start fresh
    }
    setHydrated(true);
  }, []);

  // ── Persist to localStorage on every change ────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or unavailable — non-fatal
    }
  }, [state, hydrated]);

  // ── Slide-in animation key + scroll to top on step change ──────────────
  useEffect(() => {
    if (!slideRef.current) return;
    slideRef.current.classList.remove("onb-step-enter");
    // Force reflow so the animation restarts
    void slideRef.current.offsetWidth;
    slideRef.current.classList.add("onb-step-enter");
    // Always reset scroll on step change so the user lands at the section title
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step]);

  // Steps the user has filled in (used for the map's "completed" markers)
  const completedSteps = computeCompleted(state, igConnected);

  const goNext = () => dispatch({ type: "NEXT" });
  const goBack = () => dispatch({ type: "BACK" });

  const handleFinish = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      // Clear the local draft on success
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      router.push("/dashboard");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Couldn't save. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#FAF7F2" }}>
      {/* Top map — always visible */}
      <div className="sticky top-0 z-20 backdrop-blur bg-[#FAF7F2]/95 border-b border-[#E9E3D8]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-[#1F1B2E]">Setup</div>
          <a href="/dashboard?onboarding=skip" className="text-xs text-[#8B829F] hover:text-[#1F1B2E]">
            Skip for now
          </a>
        </div>
        <OnboardingMap
          currentStep={state.step}
          completedSteps={completedSteps}
          onStepClick={(s) => {
            // Allow jumping back to any prior step or one ahead if completed
            const targetIdx = STEPS.indexOf(s);
            const currentIdx = STEPS.indexOf(state.step);
            if (targetIdx <= currentIdx || completedSteps.includes(s)) {
              dispatch({ type: "SET_STEP", step: s });
            }
          }}
        />
      </div>

      {/* Section body */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div ref={slideRef} className="onb-step-enter">
          {state.step === "goal" && (
            <GoalSection answers={state.goal} dispatch={dispatch} onNext={goNext} />
          )}
          {state.step === "audience" && (
            <AudienceSection answers={state.audience} dispatch={dispatch} onNext={goNext} onBack={goBack} />
          )}
          {state.step === "branding" && (
            <BrandingSection answers={state.branding} dispatch={dispatch} onNext={goNext} onBack={goBack} />
          )}
          {state.step === "archetype" && (
            <ArchetypeSection answers={state.archetype} dispatch={dispatch} onNext={goNext} onBack={goBack} />
          )}
          {state.step === "account" && (
            <AccountSection
              isConnected={igConnected}
              username={igUsername}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {state.step === "competitors" && (
            <CompetitorsSection
              answers={state.competitors}
              dispatch={dispatch}
              onFinish={handleFinish}
              onBack={goBack}
              submitting={submitting}
            />
          )}
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-[#BE185D] bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-lg px-4 py-3">
            {submitError}
          </div>
        )}
      </main>

      <style jsx global>{`
        .onb-step-enter {
          animation: onb-step-enter 450ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes onb-step-enter {
          0%   { opacity: 0; transform: translateX(32px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function computeCompleted(state: OnboardingState, igConnected: boolean): StepId[] {
  const done: StepId[] = [];
  const g = state.goal;
  if (g.primary && g.followers_target && g.selling && (g.selling === "not_yet" || (g.offer && g.price))) done.push("goal");

  const a = state.audience;
  if (a.niche?.trim() && (a.locations?.length ?? 0) > 0 && a.problem?.trim() && a.following?.trim()) done.push("audience");

  const b = state.branding;
  if ((b.topics?.length ?? 0) > 0 && (b.voice?.length ?? 0) > 0 && b.differentiator?.trim() && b.brand_kind) done.push("branding");

  if (state.archetype.result) done.push("archetype");
  if (igConnected) done.push("account");
  if ((state.competitors.handles?.length ?? 0) >= 3) done.push("competitors");

  return done;
}
