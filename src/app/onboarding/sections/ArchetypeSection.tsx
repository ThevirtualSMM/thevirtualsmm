"use client";

import { useEffect, useState } from "react";
import { ChoiceCard, PrimaryButton, SectionHeader } from "../components/primitives";
import { ARCHETYPES } from "../archetypes";
import {
  scoreArchetype,
  type Action,
  type ArchetypeAnswers,
  type ArchetypeQ1,
  type ArchetypeQ2,
  type ArchetypeQ3,
} from "../state";

interface Props {
  answers: ArchetypeAnswers;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
  onBack: () => void;
}

const Q1_OPTIONS: { value: ArchetypeQ1; label: string; description: string }[] = [
  { value: "teacher", label: "The Teacher", description: "You make complicated things easy and people trust you for it" },
  { value: "leader",  label: "The Leader",  description: "You set the tone and people look to you to know what's next" },
  { value: "rebel",   label: "The Rebel",   description: "You say what others are afraid to say and people love you for it" },
  { value: "friend",  label: "The Friend",  description: "You feel real and relatable — people feel like they already know you" },
];

const Q2_OPTIONS: { value: ArchetypeQ2; label: string; description: string }[] = [
  { value: "inspired",    label: "Inspired",    description: "They feel a pull to do something, change something, start something" },
  { value: "understood",  label: "Understood",  description: "They feel seen — like your content was made for them" },
  { value: "entertained", label: "Entertained", description: "They feel lighter, they laughed, they shared it with someone" },
  { value: "transformed", label: "Transformed", description: "They think differently about something they thought they knew" },
];

const Q3_OPTIONS: { value: ArchetypeQ3; label: string; description: string }[] = [
  { value: "expert",      label: "The expert",      description: "Everyone goes to them with questions because they always have the answer" },
  { value: "host",        label: "The host",        description: "Making sure everyone feels included and comfortable being there" },
  { value: "wildcard",    label: "The wildcard",    description: "Saying exactly what everyone was thinking but nobody said out loud" },
  { value: "storyteller", label: "The storyteller", description: "The one with a crowd around them because the story is just that good" },
];

type Phase = "q1" | "q2" | "q3" | "result";

export default function ArchetypeSection({ answers, dispatch, onNext, onBack }: Props) {
  // Local phase machine — separate from outer step machine so the user can
  // retry without leaving the section.
  const [phase, setPhase] = useState<Phase>(
    answers.result ? "result" : answers.q3 ? "q3" : answers.q2 ? "q2" : "q1"
  );

  // Compute result when all three answered
  useEffect(() => {
    if (answers.q1 && answers.q2 && answers.q3 && !answers.result) {
      const r = scoreArchetype(answers.q1, answers.q2, answers.q3);
      dispatch({
        type: "PATCH_ARCHETYPE",
        patch: { result: { primary: r.primary, secondary: r.secondary } },
      });
      setPhase("result");
    }
  }, [answers.q1, answers.q2, answers.q3, answers.result, dispatch]);

  const retry = () => {
    dispatch({ type: "RESET_ARCHETYPE" });
    setPhase("q1");
  };

  // ── RESULT REVEAL ────────────────────────────────────────────────────────
  if (phase === "result" && answers.result) {
    const primary = ARCHETYPES[answers.result.primary];
    const secondary = ARCHETYPES[answers.result.secondary];

    return (
      <div>
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#544A6B] mb-3">Your archetype</p>
          <h1
            className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent leading-tight"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primary.gradient[0]}, ${primary.gradient[1]})`,
              animation: "onb-reveal 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {primary.name}
          </h1>
          <p className="mt-3 text-lg text-[#1F1B2E] font-medium">{primary.tagline}</p>
        </div>

        <div className="bg-white border border-[#E9E3D8] rounded-2xl p-8 mb-4">
          <p className="text-base text-[#1F1B2E] leading-relaxed">{primary.description}</p>
          <div className="mt-5 pt-5 border-t border-[#E9E3D8]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#544A6B] mb-2">Your strengths</p>
            <ul className="space-y-1.5">
              {primary.strengths.map((s, i) => (
                <li key={i} className="text-sm text-[#1F1B2E] flex items-start gap-2">
                  <span className="text-[#FB7185] mt-1">●</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[#F5F1EB] rounded-2xl p-5 mb-8 flex items-start gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#544A6B] flex-shrink-0 mt-0.5">Secondary</span>
          <div>
            <p className="text-sm font-semibold text-[#1F1B2E]">{secondary.name}</p>
            <p className="text-xs text-[#544A6B]">{secondary.tagline}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={retry} className="text-sm text-[#544A6B] hover:text-[#1F1B2E] underline underline-offset-4 decoration-dotted">
            Doesn't feel right? Retry the quiz
          </button>
          <PrimaryButton onClick={onNext}>Continue →</PrimaryButton>
        </div>

        <style jsx>{`
          @keyframes onb-reveal {
            0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
            100% { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── QUIZ QUESTIONS ───────────────────────────────────────────────────────
  const phaseConfig = {
    q1: { title: "When you show up online, people would describe you as…", options: Q1_OPTIONS, num: 1 },
    q2: { title: "What do you want people to feel after seeing your content?",  options: Q2_OPTIONS, num: 2 },
    q3: { title: "If your brand were a person at a party, they would be…",      options: Q3_OPTIONS, num: 3 },
  } as const;

  const cfg = phaseConfig[phase as keyof typeof phaseConfig];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePick = (value: any) => {
    if (phase === "q1") {
      dispatch({ type: "PATCH_ARCHETYPE", patch: { q1: value as ArchetypeQ1 } });
      setTimeout(() => setPhase("q2"), 200);
    } else if (phase === "q2") {
      dispatch({ type: "PATCH_ARCHETYPE", patch: { q2: value as ArchetypeQ2 } });
      setTimeout(() => setPhase("q3"), 200);
    } else if (phase === "q3") {
      dispatch({ type: "PATCH_ARCHETYPE", patch: { q3: value as ArchetypeQ3 } });
      // result computes via useEffect above
    }
  };

  return (
    <div>
      <SectionHeader
        title="Every brand has a vibe. What's yours?"
        subtitle="Pick the one that feels most like you — trust your gut."
      />

      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
          Question {cfg.num} of 3
        </span>
        <div className="flex-1 h-0.5 bg-[#E9E3D8] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5B21B6] to-[#FB7185] transition-all duration-500"
            style={{ width: `${(cfg.num / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Slide-keyed by phase so each question fades in fresh */}
      <div key={phase} className="onb-slide">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1F1B2E] mb-6 leading-snug">
          {cfg.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cfg.options.map((opt) => (
            <ChoiceCard
              key={opt.value}
              size="lg"
              label={opt.label}
              description={opt.description}
              selected={false}
              onClick={() => handlePick(opt.value)}
            />
          ))}
        </div>
      </div>

      <div className="mt-12 flex justify-between">
        <PrimaryButton variant="ghost" onClick={phase === "q1" ? onBack : () => setPhase(phase === "q3" ? "q2" : "q1")}>
          ← Back
        </PrimaryButton>
      </div>

      <style jsx>{`
        .onb-slide {
          animation: onb-slidein 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes onb-slidein {
          0%   { opacity: 0; transform: translateX(24px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
