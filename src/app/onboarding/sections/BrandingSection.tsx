"use client";

import { ChoiceCard, Chip, PrimaryButton, QuestionLabel, SectionHeader, TextArea, TextField } from "../components/primitives";
import type { Action, BrandingAnswers, BrandKind, Voice } from "../state";

const TOPIC_OPTIONS = [
  "Education", "Mindset", "Business", "Lifestyle", "Health", "Relationships",
  "Finance", "Spirituality", "Marketing", "Fitness", "Parenting", "Beauty",
  "Travel", "Tech",
];

const VOICE_OPTIONS: { value: Voice; label: string; description: string }[] = [
  { value: "educational",   label: "Educational",   description: "I teach and explain" },
  { value: "entertaining",  label: "Entertaining",  description: "I make people laugh or feel something" },
  { value: "inspirational", label: "Inspirational", description: "I motivate and uplift" },
  { value: "direct",        label: "Direct",        description: "I say it straight, no fluff" },
  { value: "conversational", label: "Conversational", description: "I talk like a friend" },
];

interface Props {
  answers: BrandingAnswers;
  dispatch: React.Dispatch<Action>;
  onNext: () => void;
  onBack: () => void;
}

export default function BrandingSection({ answers, dispatch, onNext, onBack }: Props) {
  const topics = answers.topics ?? [];
  const voice  = answers.voice ?? [];
  const showOtherTopic = topics.includes("Other");

  const toggleTopic = (t: string) => {
    const has = topics.includes(t);
    let next: string[];
    if (has) {
      next = topics.filter((x) => x !== t);
    } else if (topics.length >= 3) {
      return;
    } else {
      next = [...topics, t];
    }
    dispatch({ type: "PATCH_BRANDING", patch: { topics: next } });
  };

  const toggleVoice = (v: Voice) => {
    const has = voice.includes(v);
    let next: Voice[];
    if (has) {
      next = voice.filter((x) => x !== v);
    } else if (voice.length >= 2) {
      return;
    } else {
      next = [...voice, v];
    }
    dispatch({ type: "PATCH_BRANDING", patch: { voice: next } });
  };

  const canContinue =
    topics.length > 0 &&
    voice.length > 0 &&
    !!answers.differentiator?.trim() &&
    !!answers.brand_kind;

  return (
    <div>
      <SectionHeader
        title="What does your brand actually feel like?"
        subtitle="Let's define your voice, your pillars, and what makes you different."
      />

      <div className="space-y-10">
        {/* ── Topics ── */}
        <div>
          <QuestionLabel>What are your main content topics? Pick up to 3.</QuestionLabel>
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={topics.includes(t)}
                disabled={!topics.includes(t) && topics.length >= 3}
                onClick={() => toggleTopic(t)}
              />
            ))}
            <Chip
              label="Other"
              selected={topics.includes("Other")}
              disabled={!topics.includes("Other") && topics.length >= 3}
              onClick={() => toggleTopic("Other")}
            />
          </div>
          <div
            className={`grid transition-all duration-500 ease-out ${
              showOtherTopic ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <TextField
                placeholder="Type it in"
                value={answers.topics_other ?? ""}
                charLimit={50}
                onChange={(e) => dispatch({ type: "PATCH_BRANDING", patch: { topics_other: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* ── Voice ── */}
        <div>
          <QuestionLabel>How would you describe the way you communicate? (Pick up to 2)</QuestionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VOICE_OPTIONS.map((v) => (
              <ChoiceCard
                key={v.value}
                label={v.label}
                description={v.description}
                selected={voice.includes(v.value)}
                onClick={() => toggleVoice(v.value)}
              />
            ))}
          </div>
        </div>

        {/* ── Differentiator ── */}
        <div>
          <QuestionLabel>What makes you different from everyone else in your space?</QuestionLabel>
          <TextArea
            placeholder="e.g. I combine X with Y in a way nobody else does because…"
            value={answers.differentiator ?? ""}
            charLimit={200}
            onChange={(e) => dispatch({ type: "PATCH_BRANDING", patch: { differentiator: e.target.value } })}
          />
        </div>

        {/* ── Brand kind ── */}
        <div>
          <QuestionLabel>Are you building a personal brand or a brand brand?</QuestionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChoiceCard
              size="lg"
              label="Personal brand"
              description="My face, my name, my story"
              selected={answers.brand_kind === "personal"}
              onClick={() => dispatch({ type: "PATCH_BRANDING", patch: { brand_kind: "personal" satisfies BrandKind } })}
            />
            <ChoiceCard
              size="lg"
              label="Brand / business"
              description="It's bigger than just me"
              selected={answers.brand_kind === "brand"}
              onClick={() => dispatch({ type: "PATCH_BRANDING", patch: { brand_kind: "brand" satisfies BrandKind } })}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-between">
        <PrimaryButton variant="ghost" onClick={onBack}>← Back</PrimaryButton>
        <PrimaryButton disabled={!canContinue} onClick={onNext}>Continue →</PrimaryButton>
      </div>
    </div>
  );
}
