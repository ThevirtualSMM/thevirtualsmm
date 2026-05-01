// Shape of the data passed into the SageDashboard. Lives at this layer so the
// scoring engine + components can be tested without dragging in Supabase.

export interface ProfileSummary {
  username: string;
  bio: string;
  niche: string;
  profilePhotoUrl: string | null;
  followers: number;
  followerGrowthMonth: number; // % change last 30 days
  avgLikes: number;
  avgComments: number;
  avgShares: number;       // raw count
  avgViews: number;        // for share-rate denominator
  postsPerWeek: number;
  followActivity: string;  // e.g. "No follow/unfollow activity"
}

export interface VideoItem {
  id: string;              // instagram_post_id
  title: string;           // first sentence of caption (or fallback)
  thumbnailUrl: string | null;
  permalink: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  hookType: HookType;
  scores: {
    hook: number;          // 0-100
    caption: number;
    cta: number;
    retention: number;
    engagementRate?: number;
    saveRate?: number;
    commentRate?: number;
  };
  insight: string;         // one-line human interpretation
  insightTier: Tier;
}

export type HookType =
  | "curiosity_gap" | "data_led"          // green
  | "contrarian"    | "pain_point"        // pink
  | "transformation" | "authority";       // amber

export type Tier = "green" | "amber" | "red";

export interface RepeatOpportunityItem {
  kind: "repeat" | "opportunity";
  text: string;
  stat: string;
}

export interface Competitor {
  handle: string;
  niche: string;
  followers: number;
  engagementRate: number;
  studyTag: string;        // "study their hooks" / "study their cadence"
  avatarColor: string;
}

export interface AuditData {
  profile: ProfileSummary;
  topByViews: VideoItem[];      // 3 items
  topByEngagement: VideoItem[]; // 3 items
  repeatOpportunity: RepeatOpportunityItem[]; // 4-6
  competitors: Competitor[];     // up to 3
}

// ── Score interpretation helpers ────────────────────────────────────────────
export interface BenchmarkTag {
  tier: Tier;
  label: string;
}
