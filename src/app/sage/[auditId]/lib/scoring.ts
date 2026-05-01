// Pure scoring + benchmark engine. No I/O. Will eventually be swapped for
// the NJA + Sandcastles call-outs; today it computes everything from the
// raw audit data we already have.

import type { BenchmarkTag, ProfileSummary, Tier, VideoItem } from "./types";

// ── Benchmark thresholds (can be tuned per follower tier later) ─────────────
const T = {
  followerGrowthGreen: 2,    // %/month
  followerGrowthRed:   0,
  likesRatioGreen:     0.025, // likes / followers
  likesRatioRed:       0.01,
  commentsRatioGreen:  0.01, // comments / likes
  commentsRatioRed:    0.005,
  sharesRateGreen:     0.01, // shares / views
  sharesRateRed:       0.005,
  postsPerWeekGreen:   4,
  postsPerWeekRed:     2,
} as const;

// ── Helpers ─────────────────────────────────────────────────────────────────
function tierFrom(value: number, greenAt: number, redAt: number): Tier {
  if (value >= greenAt) return "green";
  if (value <= redAt)   return "red";
  return "amber";
}

// ── Engagement rate ─────────────────────────────────────────────────────────
export function engagementRate(p: Pick<ProfileSummary, "avgLikes" | "avgComments" | "followers">): number {
  if (!p.followers) return 0;
  return ((p.avgLikes + p.avgComments) / p.followers) * 100;
}

export interface ERTier {
  label: string;
  copy: string;
  bigLabel: string;
}

export function classifyER(rate: number): ERTier {
  if (rate < 1)  return { label: "underperforming", copy: "Focus on hook quality and posting consistency", bigLabel: "Underperforming · below 1%" };
  if (rate < 3)  return { label: "average",         copy: "Room to improve — see what's working below",   bigLabel: "Average tier · 1–3% range" };
  if (rate < 6)  return { label: "strong",          copy: "Top 25% of accounts your size",                 bigLabel: "Strong tier · 3–6% range" };
  return         { label: "exceptional",            copy: "Top 5% — your audience is highly engaged",     bigLabel: "Exceptional tier · 6%+" };
}

// ── Profile-stat benchmark tags ─────────────────────────────────────────────
export function followerGrowthTag(growthPct: number): BenchmarkTag {
  const tier = tierFrom(growthPct, T.followerGrowthGreen, T.followerGrowthRed);
  if (tier === "green") return { tier, label: `+${growthPct.toFixed(1)}% this month` };
  if (tier === "amber") return { tier, label: `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}% — slow growth` };
  return                       { tier, label: `${growthPct.toFixed(1)}% this month` };
}

export function avgLikesTag(p: Pick<ProfileSummary, "avgLikes" | "followers">): BenchmarkTag {
  if (!p.followers) return { tier: "amber", label: "Need more data" };
  const ratio = p.avgLikes / p.followers;
  const tier = tierFrom(ratio, T.likesRatioGreen, T.likesRatioRed);
  return {
    tier,
    label: tier === "green" ? "Above benchmark" : tier === "amber" ? "Near benchmark" : "Below benchmark",
  };
}

export function avgCommentsTag(p: Pick<ProfileSummary, "avgComments" | "avgLikes">): BenchmarkTag {
  if (!p.avgLikes) return { tier: "amber", label: "Need more data" };
  const ratio = p.avgComments / p.avgLikes;
  const tier = tierFrom(ratio, T.commentsRatioGreen, T.commentsRatioRed);
  if (tier === "green") return { tier, label: "Healthy conversation" };
  if (tier === "amber") return { tier, label: "Quiet replies" };
  return                       { tier, label: "Too few comments" };
}

export function avgSharesTag(p: Pick<ProfileSummary, "avgShares" | "avgViews">): BenchmarkTag {
  if (!p.avgViews) return { tier: "amber", label: "Need more data" };
  const ratio = p.avgShares / p.avgViews;
  const tier = tierFrom(ratio, T.sharesRateGreen, T.sharesRateRed);
  if (tier === "green") return { tier, label: `Excellent · ${(ratio * 100).toFixed(1)}%` };
  if (tier === "amber") return { tier, label: `Average · ${(ratio * 100).toFixed(1)}%` };
  return                       { tier, label: `Low · ${(ratio * 100).toFixed(1)}%` };
}

export function postsPerWeekTag(ppw: number): BenchmarkTag {
  const tier = tierFrom(ppw, T.postsPerWeekGreen, T.postsPerWeekRed);
  if (tier === "green") return { tier, label: "Consistent cadence" };
  if (tier === "amber") return { tier, label: "Mixed cadence" };
  return                       { tier, label: "Inconsistent cadence" };
}

// ── Hook chip color (drives chip background + dot) ──────────────────────────
export function hookTier(hook: VideoItem["hookType"]): Tier {
  if (hook === "curiosity_gap" || hook === "data_led")        return "green";
  if (hook === "contrarian"    || hook === "pain_point")      return "red";
  return "amber"; // transformation, authority
}

export function hookLabel(hook: VideoItem["hookType"]): string {
  return ({
    curiosity_gap:  "Curiosity gap",
    data_led:       "Data-led",
    contrarian:     "Contrarian",
    pain_point:     "Pain point",
    transformation: "Transformation",
    authority:      "Authority",
  } as Record<VideoItem["hookType"], string>)[hook];
}

// ── Score-bar fill tier (drives gradient + percent color) ───────────────────
export function scoreTier(score: number): Tier {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

// ── Overall account health (0-100) — computed but not displayed on the free page
export function accountHealthScore(p: ProfileSummary): number {
  const er = engagementRate(p);
  const erComponent      = clamp01(er / 6) * 35;            // up to 35 pts
  const growthComponent  = clamp01(p.followerGrowthMonth / 5) * 25;
  const cadenceComponent = clamp01(p.postsPerWeek / 5) * 20;
  const sharesRatio      = p.avgViews ? p.avgShares / p.avgViews : 0;
  const sharesComponent  = clamp01(sharesRatio / 0.02) * 20;
  return Math.round(erComponent + growthComponent + cadenceComponent + sharesComponent);
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

// ── Bundle: one call to compute everything the dashboard renders ────────────
export interface ProfileScores {
  engagementRate: number;
  erTier: ERTier;
  followers:    BenchmarkTag;
  likes:        BenchmarkTag;
  comments:     BenchmarkTag;
  shares:       BenchmarkTag;
  postsPerWeek: BenchmarkTag;
  health: number;
}

export function calculateScores(profile: ProfileSummary): ProfileScores {
  const er = engagementRate(profile);
  return {
    engagementRate: er,
    erTier:       classifyER(er),
    followers:    followerGrowthTag(profile.followerGrowthMonth),
    likes:        avgLikesTag(profile),
    comments:     avgCommentsTag(profile),
    shares:       avgSharesTag(profile),
    postsPerWeek: postsPerWeekTag(profile.postsPerWeek),
    health:       accountHealthScore(profile),
  };
}
