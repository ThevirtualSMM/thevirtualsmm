"use client";

import { PrimaryButton, QuestionLabel, SectionHeader } from "../components/primitives";
import type { Action, CompetitorsAnswers } from "../state";

interface Props {
  answers: CompetitorsAnswers;
  dispatch: React.Dispatch<Action>;
  onFinish: () => void;
  onBack: () => void;
  submitting: boolean;
}

const SLOTS = 5;

export default function CompetitorsSection({ answers, dispatch, onFinish, onBack, submitting }: Props) {
  // Always render exactly 5 input slots, padding the array.
  const handles = [...(answers.handles ?? []), ...Array(SLOTS).fill("")].slice(0, SLOTS);

  const setHandle = (i: number, v: string) => {
    const cleaned = v.replace(/^@/, "").replace(/\s/g, "");
    const next = [...handles];
    next[i] = cleaned;
    dispatch({ type: "PATCH_COMPETITORS", patch: { handles: next.filter(Boolean) } });
  };

  const filledCount = handles.filter((h) => h.trim().length > 0).length;
  const canFinish = filledCount >= 3;

  return (
    <div>
      <SectionHeader
        title="Who are you competing with?"
        subtitle="List 3 to 5 accounts in your space — we'll keep an eye on them and steal what works."
      />

      <div className="space-y-4">
        <QuestionLabel>Instagram handles (3 minimum, 5 max)</QuestionLabel>
        {handles.map((h, i) => (
          <div key={i} className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B829F] text-sm pointer-events-none">@</span>
            <input
              type="text"
              value={h}
              onChange={(e) => setHandle(i, e.target.value)}
              placeholder={i < 3 ? `competitor ${i + 1}` : `competitor ${i + 1} (optional)`}
              className="w-full rounded-xl border border-[#E9E3D8] bg-white pl-9 pr-4 py-3 text-sm text-[#1F1B2E] placeholder:text-[#8B829F] focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/15 transition-all"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        ))}
        <p className="text-xs text-[#8B829F]">
          {filledCount} of {SLOTS} filled · {filledCount < 3 ? `${3 - filledCount} more to finish` : "you're good to go"}
        </p>
      </div>

      <div className="mt-12 flex justify-between">
        <PrimaryButton variant="ghost" onClick={onBack} disabled={submitting}>← Back</PrimaryButton>
        <PrimaryButton onClick={onFinish} disabled={!canFinish || submitting}>
          {submitting ? "Saving…" : "Finish setup ✨"}
        </PrimaryButton>
      </div>
    </div>
  );
}
