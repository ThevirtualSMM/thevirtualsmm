// Synthesizes a plausible AuditData for an unauthenticated visitor who
// just typed a handle on the landing page. Deterministic from the handle
// so a refresh doesn't reshuffle their numbers.
//
// Eventually this layer is swapped for a public-scrape pipeline (Apify /
// Puppeteer / RapidAPI). Until then it generates demo numbers that look
// real and honour the same shape the rest of the dashboard expects.

import type { AuditData, Competitor, HookType, RepeatOpportunityItem, Tier, VideoItem } from "./types";

// ── Stable PRNG seeded from the handle ─────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const HOOKS: HookType[] = ["curiosity_gap", "data_led", "contrarian", "pain_point", "transformation", "authority"];

const SAMPLE_TITLES = [
  "What I wish I knew before I started growing my account",
  "The one mistake everyone makes in their first 1000 followers",
  "I tested this for 30 days — here's what actually worked",
  "Stop doing this if you want consistent growth",
  "How I went from 200 to 20K followers in 90 days",
  "The hook formula every viral creator uses",
  "Why your reels stopped getting reach (and how to fix it)",
  "3 things I changed that doubled my engagement",
  "The truth about the algorithm in 2026",
  "Nobody talks about this part of growing online",
];

const INSIGHTS_GREEN = [
  "Strong opening hook — viewers stick around past 3s.",
  "Your CTA placement is doing the heavy lifting here.",
  "Caption + thumbnail combo are pulling weight.",
];
const INSIGHTS_AMBER = [
  "Hook lands but no clear CTA — viewers don't act.",
  "Solid post, but retention drops mid-video.",
  "Caption is too long — most people scroll past it.",
];
const INSIGHTS_RED = [
  "Weak hook + thin caption — viewers scroll past.",
  "Cover image isn't doing you any favours.",
  "No clear value-promise in the first 2 seconds.",
];

const PALETTE = ["#5B21B6", "#FB7185", "#F0A500", "#7C3AED", "#22C55E"];

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)];
}

function makeVideo(rand: () => number, baseViews: number, rank: number): VideoItem {
  const views    = Math.round(baseViews * (0.6 + rand() * 0.7));
  const likes    = Math.round(views * (0.025 + rand() * 0.04));
  const comments = Math.round(likes * (0.04 + rand() * 0.05));
  const shares   = Math.round(views * (0.005 + rand() * 0.012));
  const saves    = Math.round(views * (0.018 + rand() * 0.04));

  const hook = pick(rand, HOOKS);

  // Score distribution: rank 1 gets best scores, rank 3 gets weakest
  const tilt = (1 - rank * 0.18) * 100; // 100 → 64
  const jitter = () => Math.round(tilt * (0.55 + rand() * 0.45));

  const hookScore     = clamp(jitter(), 35, 95);
  const captionScore  = clamp(jitter(), 30, 90);
  const ctaScore      = clamp(jitter(), 25, 88);
  const retentionScore = clamp(jitter(), 40, 92);

  const avg = (hookScore + captionScore + ctaScore + retentionScore) / 4;
  const tier: Tier = avg >= 75 ? "green" : avg >= 55 ? "amber" : "red";
  const insight = pick(rand, tier === "green" ? INSIGHTS_GREEN : tier === "amber" ? INSIGHTS_AMBER : INSIGHTS_RED);

  const er = views ? ((likes + comments) / views) * 100 : 0;
  const saveRate = views ? (saves / views) * 100 : 0;
  const commentRate = likes ? (comments / likes) * 100 : 0;

  return {
    id:    `demo-${rank}-${Math.floor(rand() * 1e9)}`,
    title: pick(rand, SAMPLE_TITLES),
    thumbnailUrl: null, // gradient placeholder kicks in
    permalink: null,
    views, likes, comments, shares, saves,
    hookType: hook,
    scores: {
      hook: hookScore, caption: captionScore, cta: ctaScore, retention: retentionScore,
      engagementRate: er, saveRate, commentRate,
    },
    insight,
    insightTier: tier,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const DEMO_COMPETITORS: Competitor[] = [
  { handle: "@hormozibites", niche: "Business",  followers: 1_200_000, engagementRate: 4.8, studyTag: "study their hooks",   avatarColor: "#5B21B6" },
  { handle: "@codie.demo",   niche: "Investing", followers:   540_000, engagementRate: 3.6, studyTag: "study their cadence", avatarColor: "#FB7185" },
  { handle: "@thirdoption",  niche: "Marketing", followers:   280_000, engagementRate: 2.4, studyTag: "study their CTAs",    avatarColor: "#F0A500" },
];

export function buildDemoAuditData(rawHandle: string): AuditData {
  const handle = rawHandle.replace(/^@/, "").trim() || "your_account";
  const seed = hash(handle.toLowerCase());
  const rand = rng(seed);

  // Synthesize plausible profile aggregates (deterministic from handle).
  const followers = Math.round(2000 + rand() * 28000);  // 2k–30k
  const followerGrowthMonth = Math.round((rand() * 5 - 1) * 10) / 10; // -1% to +4%
  const baseViews = Math.round(followers * (0.6 + rand() * 1.4));
  const avgLikes  = Math.round(followers * (0.015 + rand() * 0.04));
  const avgComments = Math.round(avgLikes * (0.04 + rand() * 0.06));
  const avgShares = Math.round(baseViews * (0.004 + rand() * 0.012));
  const postsPerWeek = Math.round((1 + rand() * 5) * 10) / 10; // 1.0–6.0

  const topByViews = [
    makeVideo(rand, baseViews * 1.8, 0),
    makeVideo(rand, baseViews * 1.3, 1),
    makeVideo(rand, baseViews * 0.9, 2),
  ];

  // Re-seed for engagement set so they feel different
  const rand2 = rng(seed ^ 0x9e3779b9);
  const topByEngagement = [
    makeVideo(rand2, baseViews * 0.7, 0),
    makeVideo(rand2, baseViews * 0.5, 1),
    makeVideo(rand2, baseViews * 0.4, 2),
  ];

  const topHook = topByViews[0].hookType;
  const repeatOpportunity: RepeatOpportunityItem[] = [
    { kind: "repeat",      text: `${labelHook(topHook)} hooks consistently outperform`,                stat: `${formatViews(topByViews[0].views)} views` },
    { kind: "repeat",      text: "Reels outperform carousels by a wide margin",                       stat: "3× views" },
    { kind: "opportunity", text: "No stories in the audit window — leaving daily reach on the table", stat: "Add 3/week" },
    { kind: "opportunity", text: "Test posting at different hours — you've stayed in one window",     stat: "A/B 7pm" },
    { kind: "opportunity", text: "Try shorter, punchier captions — long ones aren't paying off",      stat: "Test 1 line" },
  ];

  return {
    profile: {
      username: handle,
      bio: "Tap unlock to see your full bio analysis · audience composition · trends",
      niche: "Detected from your last posts",
      profilePhotoUrl: null,
      followers,
      followerGrowthMonth,
      avgLikes,
      avgComments,
      avgShares,
      avgViews: baseViews,
      postsPerWeek,
      followActivity: "Demo data · sign up to run on your real account",
    },
    topByViews,
    topByEngagement,
    repeatOpportunity,
    competitors: DEMO_COMPETITORS,
  };
}

function labelHook(h: HookType): string {
  return ({
    curiosity_gap: "Curiosity-gap", data_led: "Data-led", contrarian: "Contrarian",
    pain_point: "Pain-point", transformation: "Transformation", authority: "Authority",
  } as Record<HookType, string>)[h];
}
function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// ── Export to silence unused-import warning if any ─────────────────────────
export const _PALETTE = PALETTE;
