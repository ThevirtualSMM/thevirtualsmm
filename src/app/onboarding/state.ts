// Onboarding state shape, reducer, and archetype scoring.
// Pure logic — no React, no I/O. Imported by the client component and the
// /api/onboarding endpoint.

import { ARCHETYPES, type ArchetypeKey } from "./archetypes";

// ── Step IDs ─────────────────────────────────────────────────────────────────
export const STEPS = ["goal", "audience", "branding", "archetype", "account", "competitors"] as const;
export type StepId = (typeof STEPS)[number];

// ── Section answers ──────────────────────────────────────────────────────────
export type GoalPrimary = "grow" | "sell" | "authority" | "traffic";
export type FollowerTarget = "1k" | "1k_5k" | "5k_10k" | "10k_50k" | "50k_plus";
export type SellingState = "yes" | "not_yet";

export interface GoalAnswers {
  primary?: GoalPrimary;
  followers_target?: FollowerTarget;
  selling?: SellingState;
  offer?: string;
  price?: string;
}

export interface AudienceAnswers {
  niche?: string;
  locations?: string[];
  locations_other?: string;
  problem?: string;
  following?: string;
}

export type Voice = "educational" | "entertaining" | "inspirational" | "direct" | "conversational";
export type BrandKind = "personal" | "brand";

export interface BrandingAnswers {
  topics?: string[];
  topics_other?: string;
  voice?: Voice[];
  differentiator?: string;
  brand_kind?: BrandKind;
}

export type ArchetypeQ1 = "teacher" | "leader" | "rebel" | "friend";
export type ArchetypeQ2 = "inspired" | "understood" | "entertained" | "transformed";
export type ArchetypeQ3 = "expert" | "host" | "wildcard" | "storyteller";

export interface ArchetypeAnswers {
  q1?: ArchetypeQ1;
  q2?: ArchetypeQ2;
  q3?: ArchetypeQ3;
  result?: { primary: ArchetypeKey; secondary: ArchetypeKey };
}

export interface CompetitorsAnswers {
  handles?: string[];
}

// ── Full state ───────────────────────────────────────────────────────────────
export interface OnboardingState {
  step: StepId;
  goal: GoalAnswers;
  audience: AudienceAnswers;
  branding: BrandingAnswers;
  archetype: ArchetypeAnswers;
  competitors: CompetitorsAnswers;
}

export const initialState: OnboardingState = {
  step: "goal",
  goal: {},
  audience: {},
  branding: {},
  archetype: {},
  competitors: { handles: [] },
};

// ── Reducer actions ──────────────────────────────────────────────────────────
export type Action =
  | { type: "SET_STEP";       step: StepId }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "PATCH_GOAL";     patch: Partial<GoalAnswers> }
  | { type: "PATCH_AUDIENCE"; patch: Partial<AudienceAnswers> }
  | { type: "PATCH_BRANDING"; patch: Partial<BrandingAnswers> }
  | { type: "PATCH_ARCHETYPE"; patch: Partial<ArchetypeAnswers> }
  | { type: "PATCH_COMPETITORS"; patch: Partial<CompetitorsAnswers> }
  | { type: "RESET_ARCHETYPE" }
  | { type: "HYDRATE";        state: OnboardingState };

export function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "SET_STEP": return { ...state, step: action.step };
    case "NEXT": {
      const i = STEPS.indexOf(state.step);
      return { ...state, step: STEPS[Math.min(i + 1, STEPS.length - 1)] };
    }
    case "BACK": {
      const i = STEPS.indexOf(state.step);
      return { ...state, step: STEPS[Math.max(i - 1, 0)] };
    }
    case "PATCH_GOAL":        return { ...state, goal:        { ...state.goal,        ...action.patch } };
    case "PATCH_AUDIENCE":    return { ...state, audience:    { ...state.audience,    ...action.patch } };
    case "PATCH_BRANDING":    return { ...state, branding:    { ...state.branding,    ...action.patch } };
    case "PATCH_ARCHETYPE":   return { ...state, archetype:   { ...state.archetype,   ...action.patch } };
    case "PATCH_COMPETITORS": return { ...state, competitors: { ...state.competitors, ...action.patch } };
    case "RESET_ARCHETYPE":   return { ...state, archetype: {} };
    case "HYDRATE":           return action.state;
  }
}

// ── Archetype scoring ────────────────────────────────────────────────────────

type Family = "sage" | "ruler" | "rebel" | "caregiver";
type Variant = "hero" | "caregiver" | "jester" | "magician";

const Q1_TO_FAMILY: Record<ArchetypeQ1, Family> = {
  teacher: "sage",
  leader:  "ruler",
  rebel:   "rebel",
  friend:  "caregiver",
};

const Q3_TO_FAMILY: Record<ArchetypeQ3, Family> = {
  expert:      "sage",
  host:        "caregiver",
  wildcard:    "rebel",
  storyteller: "ruler",
};

const Q2_TO_VARIANT: Record<ArchetypeQ2, Variant> = {
  inspired:    "hero",
  understood:  "caregiver",
  entertained: "jester",
  transformed: "magician",
};

// Lookup table: 4 families × 4 variants = 16 distinct archetype keys.
// Defined inline instead of computed so each pairing has a hand-picked name.
const FAMILY_VARIANT: Record<Family, Record<Variant, ArchetypeKey>> = {
  sage:      { hero: "visionary",      caregiver: "mentor",       jester: "edutainer",     magician: "sage"          },
  ruler:     { hero: "champion",       caregiver: "guide",        jester: "maverick",      magician: "visionary_lead" },
  rebel:     { hero: "activist",       caregiver: "truth_teller", jester: "provocateur",   magician: "disruptor"     },
  caregiver: { hero: "encourager",     caregiver: "confidant",    jester: "best_friend",   magician: "healer"        },
};

export interface ArchetypeScore {
  primary: ArchetypeKey;
  secondary: ArchetypeKey;
  primaryFamily: Family;
  secondaryFamily: Family;
  variant: Variant;
}

/**
 * Score the three quiz answers and return the primary + secondary archetype keys.
 * - Q1 contributes +2 to its mapped family (it's the most direct identity question)
 * - Q3 contributes +1 to its mapped family
 * - Q2 picks the variant *within* the family
 * Ties broken by Q1 (its family wins) for primary; Q3 wins secondary.
 */
export function scoreArchetype(q1: ArchetypeQ1, q2: ArchetypeQ2, q3: ArchetypeQ3): ArchetypeScore {
  const families: Family[] = ["sage", "ruler", "rebel", "caregiver"];
  const score: Record<Family, number> = { sage: 0, ruler: 0, rebel: 0, caregiver: 0 };

  const q1Family = Q1_TO_FAMILY[q1];
  const q3Family = Q3_TO_FAMILY[q3];
  score[q1Family] += 2;
  score[q3Family] += 1;

  // Sort by score desc, then push Q1's family up on ties for primary, Q3's family
  // up on ties for secondary.
  const ranked = [...families].sort((a, b) => {
    if (score[b] !== score[a]) return score[b] - score[a];
    if (a === q1Family) return -1;
    if (b === q1Family) return 1;
    if (a === q3Family) return -1;
    if (b === q3Family) return 1;
    return 0;
  });

  const variant = Q2_TO_VARIANT[q2];
  const primaryFamily = ranked[0];
  const secondaryFamily = ranked[1];

  return {
    primary:   FAMILY_VARIANT[primaryFamily][variant],
    secondary: FAMILY_VARIANT[secondaryFamily][variant],
    primaryFamily,
    secondaryFamily,
    variant,
  };
}

// Re-export for convenience
export { ARCHETYPES };
export type { ArchetypeKey };
