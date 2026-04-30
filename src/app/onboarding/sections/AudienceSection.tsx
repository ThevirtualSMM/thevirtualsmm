"use client";

import { Chip, PrimaryButton, QuestionLabel, SectionHeader, TextArea, TextField } from "../components/primitives";
import type { Action, AudienceAnswers } from "../state";

const LOCATIONS = ["United States", "Latin America", "Spain", "Europe (other)", "Global / Mixed", "Other"];

interface Props {
  answers: AudienceAnswers;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
  onBack: () => void;
}

export default function AudienceSection({ answers, dispatch, onNext, onBack }: Props) {
  const locations = answers.locations ?? [];
  const showOtherInput = locations.includes("Other");

  const toggleLocation = (loc: string) => {
    const has = locations.includes(loc);
    let next: string[];
    if (has) {
      next = locations.filter((l) => l !== loc);
    } else if (locations.length >= 3) {
      return; // multi-select cap
    } else {
      next = [...locations, loc];
    }
    dispatch({ type: "PATCH_AUDIENCE", patch: { locations: next } });
  };

  const canContinue =
    !!answers.niche?.trim() &&
    locations.length > 0 &&
    !!answers.problem?.trim() &&
    !!answers.following?.trim();

  return (
    <div>
      <SectionHeader
        title="Who are you talking to?"
        subtitle="The more specific you are, the better your strategy."
      />

      <div className="space-y-10">
        {/* ── Niche ── */}
        <div>
          <QuestionLabel>Describe your niche as specifically as possible</QuestionLabel>
          <TextField
            placeholder='e.g. "fat loss for moms over 35" — not just "fitness"'
            value={answers.niche ?? ""}
            charLimit={150}
            onChange={(e) => dispatch({ type: "PATCH_AUDIENCE", patch: { niche: e.target.value } })}
          />
        </div>

        {/* ── Locations ── */}
        <div>
          <QuestionLabel>Where does most of your audience live? (Pick up to 3)</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <Chip
                key={loc}
                label={loc}
                selected={locations.includes(loc)}
                disabled={!locations.includes(loc) && locations.length >= 3}
                onClick={() => toggleLocation(loc)}
              />
            ))}
          </div>
          <div
            className={`grid transition-all duration-500 ease-out ${
              showOtherInput ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <TextField
                placeholder="Where else?"
                value={answers.locations_other ?? ""}
                charLimit={60}
                onChange={(e) => dispatch({ type: "PATCH_AUDIENCE", patch: { locations_other: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* ── Problem ── */}
        <div>
          <QuestionLabel>What's the biggest problem your audience has that you help solve?</QuestionLabel>
          <TextArea
            placeholder="e.g. They know what to do but can't stay consistent because…"
            value={answers.problem ?? ""}
            charLimit={200}
            onChange={(e) => dispatch({ type: "PATCH_AUDIENCE", patch: { problem: e.target.value } })}
          />
        </div>

        {/* ── Following ── */}
        <div>
          <QuestionLabel>Who else are they following besides you? Name 1–3 creators or brands.</QuestionLabel>
          <TextField
            placeholder="e.g. @creator1, @brand2, @author3"
            helper="Think of the accounts your audience probably already follows."
            value={answers.following ?? ""}
            charLimit={150}
            onChange={(e) => dispatch({ type: "PATCH_AUDIENCE", patch: { following: e.target.value } })}
          />
        </div>
      </div>

      <div className="mt-12 flex justify-between">
        <PrimaryButton variant="ghost" onClick={onBack}>← Back</PrimaryButton>
        <PrimaryButton disabled={!canContinue} onClick={onNext}>Continue →</PrimaryButton>
      </div>
    </div>
  );
}
