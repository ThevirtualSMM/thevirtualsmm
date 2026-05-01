// Adapter: turn whatever the backend gives us (Supabase rows for now,
// NJA + Sandcastles later) into the typed AuditData the dashboard needs.

import type { AuditData, Competitor, HookType, ProfileSummary, RepeatOpportunityItem, Tier, VideoItem } from "./types";

interface SupaPost {
  id: string;
  instagram_post_id: string;
  caption: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  permalink: string | null;
  views: number | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  saves_count: number | null;
  save_rate: number | null;
  share_rate: number | null;
  like_rate: number | null;
  comment_rate: number | null;
  posted_at: string | null;
  post_type: string | null;
  performance_tiers: string[] | null;
}

interface SupaAccount {
  username: string;
  // these don't exist in our schema yet — we just synthesize for now
  bio?: string | null;
  niche?: string | null;
  profile_photo_url?: string | null;
}

interface BrandResponses {
  audience?: { niche?: string };
  competitors?: { handles?: string[] };
}

interface BuildOpts {
  posts: SupaPost[];
  account: SupaAccount;
  brand: BrandResponses | null;
  audit: { date_range_start: string; date_range_end: string };
}

const HOOKS: HookType[] = ["curiosity_gap", "data_led", "contrarian", "pain_point", "transformation", "authority"];

function pickHook(p: SupaPost, idx: number): HookType {
  // Heuristic guess — eventually replaced by an LLM classifier.
  // Until then, deterministic rotation so the UI shows variety.
  const text = (p.caption ?? "").toLowerCase();
  if (text.includes("?"))                                  return "curiosity_gap";
  if (text.match(/\b\d{2,}%|\b\d{4}\b/))                   return "data_led";
  if (text.includes("don't") || text.includes("stop"))     return "contrarian";
  if (text.includes("struggle") || text.includes("tired")) return "pain_point";
  if (text.includes("from") && text.includes("to"))        return "transformation";
  return HOOKS[idx % HOOKS.length];
}

function clipTitle(caption: string | null, fallback: string): string {
  if (!caption) return fallback;
  const trimmed = caption.replace(/\s+/g, " ").trim();
  const firstSentence = trimmed.split(/[.!?\n]/)[0];
  return (firstSentence || trimmed).slice(0, 110);
}

function syntheticScore(seed: number, base: number, jitter: number): number {
  // Stable pseudo-random on [base-jitter, base+jitter] from a seed.
  const r = Math.abs(Math.sin(seed) * 10000) % 1;
  return Math.round(base + (r * 2 - 1) * jitter);
}

function videoFrom(p: SupaPost, rank: number): VideoItem {
  const seed = (p.id || p.instagram_post_id).charCodeAt(0) + rank;
  const views    = p.views ?? 0;
  const likes    = p.likes_count    ?? Math.round(views * (p.like_rate    ?? 0));
  const comments = p.comments_count ?? Math.round(views * (p.comment_rate ?? 0));
  const shares   = p.shares_count   ?? Math.round(views * (p.share_rate   ?? 0));
  const saves    = p.saves_count    ?? Math.round(views * (p.save_rate    ?? 0));

  const hookType = pickHook(p, rank);
  const hookScore      = syntheticScore(seed,     78, 18);
  const captionScore   = syntheticScore(seed + 1, 65, 22);
  const ctaScore       = syntheticScore(seed + 2, 55, 28);
  const retentionScore = syntheticScore(seed + 3, 70, 20);

  const avgScore = (hookScore + captionScore + ctaScore + retentionScore) / 4;
  let tier: Tier = avgScore >= 75 ? "green" : avgScore >= 55 ? "amber" : "red";

  // Per-engagement-rate scores (used in right-column card)
  const engagementRate = views ? ((likes + comments) / views) * 100 : 0;
  const saveRate       = views ? (saves / views) * 100 : 0;
  const commentRate    = likes ? (comments / likes) * 100 : 0;

  let insight: string;
  if (tier === "green") {
    insight = hookScore > 80
      ? "Strong opening hook — followers stick around past 3s."
      : "Caption + cover combo are pulling weight here.";
  } else if (tier === "amber") {
    insight = ctaScore < 50
      ? "Hook lands but no clear CTA — viewers don't act."
      : "Solid post, but retention drops mid-video.";
  } else {
    insight = "Weak hook + thin caption — viewers scroll past.";
  }

  return {
    id:           p.instagram_post_id,
    title:        clipTitle(p.caption, "Untitled reel"),
    thumbnailUrl: p.thumbnail_url ?? p.media_url ?? null,
    permalink:    p.permalink,
    views, likes, comments, shares, saves,
    hookType,
    scores: {
      hook:           hookScore,
      caption:        captionScore,
      cta:            ctaScore,
      retention:      retentionScore,
      engagementRate, saveRate, commentRate,
    },
    insight,
    insightTier: tier,
  };
}

// ── Repeat-vs-opportunity: derive from posts data ──────────────────────────
function deriveRepeatOpportunity(posts: SupaPost[], topByViews: VideoItem[]): RepeatOpportunityItem[] {
  const items: RepeatOpportunityItem[] = [];
  if (topByViews[0]) {
    items.push({ kind: "repeat", text: `${labelHook(topByViews[0].hookType)} hooks consistently outperform`, stat: `${formatViews(topByViews[0].views)} views` });
  }
  const reels = posts.filter((p) => p.post_type === "reel" || p.post_type === "video");
  const carousels = posts.filter((p) => p.post_type === "carousel" || p.post_type === "feed");
  if (reels.length && carousels.length) {
    const reelAvg = avg(reels.map((r) => r.views ?? 0));
    const carAvg  = avg(carousels.map((c) => c.views ?? 0));
    if (reelAvg > carAvg * 1.3) {
      items.push({ kind: "repeat", text: "Reels outperform carousels by a wide margin", stat: `${Math.round(reelAvg / Math.max(carAvg, 1))}× views` });
    } else if (carAvg > reelAvg * 1.3) {
      items.push({ kind: "opportunity", text: "Carousels are quietly out-saving your reels", stat: `${Math.round(carAvg / Math.max(reelAvg, 1))}× views` });
    }
  }
  const longCaptions = posts.filter((p) => (p.caption?.length ?? 0) > 200);
  if (longCaptions.length >= 3) {
    const lcAvg = avg(longCaptions.map((p) => p.views ?? 0));
    const allAvg = avg(posts.map((p) => p.views ?? 0));
    if (lcAvg > allAvg * 1.2) {
      items.push({ kind: "repeat", text: "Long captions correlate with stronger reach", stat: `+${Math.round(((lcAvg / Math.max(allAvg, 1)) - 1) * 100)}%` });
    } else {
      items.push({ kind: "opportunity", text: "Try shorter, punchier captions — long ones aren't paying off", stat: "Test 1 line" });
    }
  }
  if (posts.some((p) => p.post_type === "story") === false) {
    items.push({ kind: "opportunity", text: "No stories in the audit window — leaving daily reach on the table", stat: "Add 3/week" });
  }
  if (items.length < 4) {
    items.push({ kind: "opportunity", text: "Test posting at different hours — you've stayed in one window", stat: "A/B 7pm" });
  }
  return items.slice(0, 5);
}

function labelHook(h: HookType): string {
  return ({
    curiosity_gap: "Curiosity-gap", data_led: "Data-led", contrarian: "Contrarian",
    pain_point: "Pain-point", transformation: "Transformation", authority: "Authority",
  } as Record<HookType, string>)[h];
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function avg(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ── Default mock competitors (used when onboarding hasn't been completed) ───
const DEFAULT_COMPETITORS: Competitor[] = [
  { handle: "@hormozibites", niche: "Business",  followers: 1_200_000, engagementRate: 4.8, studyTag: "study their hooks",   avatarColor: "#5B21B6" },
  { handle: "@codie.demo",   niche: "Investing", followers:   540_000, engagementRate: 3.6, studyTag: "study their cadence", avatarColor: "#FB7185" },
  { handle: "@thirdoption",  niche: "Marketing", followers:   280_000, engagementRate: 2.4, studyTag: "study their CTAs",    avatarColor: "#F0A500" },
];

const PALETTE = ["#5B21B6", "#FB7185", "#F0A500", "#7C3AED", "#22C55E"];

export function buildAuditData(opts: BuildOpts): AuditData {
  const { posts, account, brand, audit } = opts;

  // Synthesize realistic profile aggregates.
  const validPosts = posts.length ? posts : [];
  const totalLikes    = sum(validPosts.map((p) => p.likes_count    ?? 0));
  const totalComments = sum(validPosts.map((p) => p.comments_count ?? 0));
  const totalShares   = sum(validPosts.map((p) => p.shares_count   ?? 0));
  const totalViews    = sum(validPosts.map((p) => p.views          ?? 0));
  const n = Math.max(validPosts.length, 1);

  const start = new Date(audit.date_range_start);
  const end   = new Date(audit.date_range_end);
  const weeks = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const postsPerWeek = validPosts.length / weeks;

  // Followers + growth: not in our DB yet — use sensible mock.
  const followers = 21_489;
  const followerGrowthMonth = 1.3;

  const profile: ProfileSummary = {
    username:            account.username,
    bio:                 account.bio ?? brand?.audience?.niche ?? "Astrology · birth charts · cosmic relationships",
    niche:               account.niche ?? brand?.audience?.niche ?? "Astrology",
    profilePhotoUrl:     account.profile_photo_url ?? null,
    followers,
    followerGrowthMonth,
    avgLikes:    Math.round(totalLikes    / n),
    avgComments: Math.round(totalComments / n),
    avgShares:   Math.round(totalShares   / n),
    avgViews:    Math.round(totalViews    / n),
    postsPerWeek,
    followActivity: "No follow/unfollow activity",
  };

  // ── Top-by-views: real ranking from posts data ───────────────────────────
  const sortedByViews = [...validPosts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  const topByViews = sortedByViews.slice(0, 3).map((p, i) => videoFrom(p, i));

  // ── Top-by-engagement: rank by (likes+comments)/views, fall back if no data
  const sortedByER = [...validPosts].sort((a, b) => {
    const er = (x: SupaPost) => x.views ? ((x.likes_count ?? 0) + (x.comments_count ?? 0)) / x.views : 0;
    return er(b) - er(a);
  });
  const topByEngagement = sortedByER.slice(0, 3).map((p, i) => videoFrom(p, i + 10));

  // ── Repeat / opportunity ─────────────────────────────────────────────────
  const repeatOpportunity = deriveRepeatOpportunity(validPosts, topByViews);

  // ── Competitors: from onboarding handles, else defaults ──────────────────
  const handles = brand?.competitors?.handles ?? [];
  const competitors: Competitor[] = handles.length >= 1
    ? handles.slice(0, 3).map((h, i) => ({
        handle: `@${h.replace(/^@/, "")}`,
        niche: profile.niche,
        followers: 0,
        engagementRate: 3.4 - i * 0.6,
        studyTag: ["study their hooks", "study their cadence", "study their CTAs"][i] ?? "study their patterns",
        avatarColor: PALETTE[i % PALETTE.length],
      }))
    : DEFAULT_COMPETITORS;

  return { profile, topByViews, topByEngagement, repeatOpportunity, competitors };
}

function sum(xs: number[]): number { return xs.reduce((a, b) => a + b, 0); }
