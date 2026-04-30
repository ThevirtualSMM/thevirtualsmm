"use client";

import { ChoiceCard, PrimaryButton, QuestionLabel, SectionHeader, TextField } from "../components/primitives";
import type { Action, GoalAnswers, FollowerTarget, GoalPrimary, SellingState } from "../state";

interface Props {
  answers: GoalAnswers;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
}

const PRIMARY_GOALS: { value: GoalPrimary; icon: string; label: string; description: string }[] = [
  { value: "grow",      icon: "📈", label: "Grow my audience",         description: "More followers, more reach" },
  { value: "sell",      icon: "💸", label: "Sell my offer or product",  description: "Turn views into revenue" },
  { value: "authority", icon: "🎓", label: "Build authority",            description: "Be the go-to in my space" },
  { value: "traffic",   icon: "🔗", label: "Drive traffic",              description: "Send people to my site or funnel" },
];

const FOLLOWER_TARGETS: { value: FollowerTarget; label: string }[] = [
  { value: "1k",       label: "I just want to hit 1K"   },
  { value: "1k_5k",    label: "1K → 5K"   },
  { value: "5k_10k",   label: "5K → 10K"  },
  { value: "10k_50k",  label: "10K → 50K" },
  { value: "50k_plus", label: "50K and up" },
];

export default function GoalSection({ answers, dispatch, onNext }: Props) {
  const canContinue =
    !!answers.primary &&
    !!answers.followers_target &&
    !!answers.selling &&
    (answers.selling === "not_yet" || (answers.offer && answers.price));

  return (
    <div>
      <SectionHeader
        title="Let's figure out what you're here for."
        subtitle="Pick what matters most to you right now."
      />

      <div className="space-y-10">
        {/* ── Q1: Primary goal ── */}
        <div>
          <QuestionLabel>What's your main goal on Instagram right now?</QuestionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRIMARY_GOALS.map((g) => (
              <ChoiceCard
                key={g.value}
                icon={g.icon}
                label={g.label}
                description={g.description}
                selected={answers.primary === g.value}
                onClick={() => dispatch({ type: "PATCH_GOAL", patch: { primary: g.value } })}
              />
            ))}
          </div>
        </div>

        {/* ── Q2: Follower target ── */}
        <div>
          <QuestionLabel>How many followers do you want to reach in the next 90 days?</QuestionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FOLLOWER_TARGETS.map((t) => (
              <ChoiceCard
                key={t.value}
                label={t.label}
                size="sm"
                selected={answers.followers_target === t.value}
                onClick={() => dispatch({ type: "PATCH_GOAL", patch: { followers_target: t.value } })}
              />
            ))}
          </div>
        </div>

        {/* ── Q3: Selling toggle + conditional inputs ── */}
        <div>
          <QuestionLabel>Do you have something you're selling or promoting right now?</QuestionLabel>
          <div className="flex gap-2">
            {(["yes", "not_yet"] as SellingState[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => dispatch({ type: "PATCH_GOAL", patch: { selling: opt } })}
                className={`flex-1 py-3 px-6 rounded-full text-sm font-semibold transition-all ${
                  answers.selling === opt
                    ? "bg-[#1F1B2E] text-white"
                    : "bg-white border border-[#E9E3D8] text-[#1F1B2E] hover:border-[#5B21B6]"
                }`}
              >
                {opt === "yes" ? "Yes" : "Not yet"}
              </button>
            ))}
          </div>

          <div
            className={`grid transition-all duration-500 ease-out ${
              answers.selling === "yes" ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 pt-2">
                <TextField
                  label="What is it? Describe it in one sentence."
                  placeholder="e.g. A 6-week coaching program that helps moms over 35 lose fat without dieting"
                  value={answers.offer ?? ""}
                  charLimit={120}
                  onChange={(e) => dispatch({ type: "PATCH_GOAL", patch: { offer: e.target.value } })}
                />
                <TextField
                  label="What's the price?"
                  placeholder='e.g. "$97" or "$500–$2,000"'
                  value={answers.price ?? ""}
                  charLimit={40}
                  onChange={(e) => dispatch({ type: "PATCH_GOAL", patch: { price: e.target.value } })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-end">
        <PrimaryButton disabled={!canContinue} onClick={onNext}>
          Continue →
        </PrimaryButton>
      </div>
    </div>
  );
}
