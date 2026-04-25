export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface InstagramAccount {
  id: string;
  user_id: string;
  instagram_user_id: string;
  username: string;
  access_token: string;
  token_expires_at: string | null;
  connected_at: string;
}

export interface Audit {
  id: string;
  user_id: string;
  instagram_account_id: string;
  status: "pending" | "scraping" | "analyzing" | "complete" | "failed";
  triggered_at: string;
  completed_at: string | null;
  date_range_start: string;
  date_range_end: string;
  total_posts_scraped: number;
  claude_summary: string | null;
  claude_json: ClaudeAnalysis | null;
  error_message: string | null;
}

export interface Post {
  id: string;
  audit_id: string;
  user_id: string;
  instagram_post_id: string;
  post_type: "image" | "carousel" | "reel" | "video" | null;
  posted_at: string | null;
  caption: string | null;
  hashtags: string[] | null;
  is_collab: boolean;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  views: number;
  accounts_reached: number;
  avg_watch_time_seconds: number | null;
  follows_from_post: number;
  skip_rate: number | null;
  share_rate: number | null;
  like_rate: number | null;
  save_rate: number | null;
  repost_rate: number | null;
  comment_rate: number | null;
  source_home: number | null;
  source_explore: number | null;
  source_profile: number | null;
  source_hashtags: number | null;
  source_other: number | null;
  top_comments: { text: string; likes: number }[] | null;
  questions_in_comments: string[] | null;
  performance_tiers: string[] | null;
}

export interface ClaudeAnalysis {
  best_by_views: PostSummary[];
  best_by_engagement: PostSummary[];
  best_by_followers: PostSummary[];
  worst_by_views: PostSummary[];
  worst_by_engagement: PostSummary[];
  worst_by_followers: PostSummary[];
  top_sources: { source: string; avg_percentage: number }[];
  patterns: string[];
  best_posting_times: string[];
  top_hashtags: string[];
  notable_observations: string[];
}

export interface PostSummary {
  instagram_post_id: string;
  post_type: string;
  posted_at: string;
  caption_preview: string;
  metric_value: number;
  metric_label: string;
}
