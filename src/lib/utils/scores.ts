import { Post } from "@/types";

export interface PostScores {
  overall: number;
  engagementScore: number;
  reachScore: number;
  followsScore: number;
  hookScore: number | null;
  retention: number | null;
}

function avg(posts: Post[], key: keyof Post): number {
  const vals = posts.map((p) => Number(p[key] || 0)).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function computePostScores(post: Post, allPosts: Post[]): PostScores {
  const avgViews = avg(allPosts, "views");
  const avgFollows = avg(allPosts, "follows_from_post");

  // Engagement: sum of rates, 10% total = 100 score
  const totalEng =
    (post.like_rate || 0) +
    (post.comment_rate || 0) +
    (post.share_rate || 0) +
    (post.save_rate || 0);
  const engagementScore = Math.min(100, (totalEng / 0.1) * 100);

  // Reach: this post vs account average (2x avg = 100)
  const reachScore = Math.min(100, ((post.views || 0) / Math.max(avgViews, 1)) * 50);

  // Follows: compared to account average (2x avg = 100)
  const followsScore = Math.min(
    100,
    ((post.follows_from_post || 0) / Math.max(avgFollows, 1)) * 50
  );

  // Hook: skip_rate based, or retention based
  let hookScore: number | null = null;
  if (post.skip_rate != null) {
    hookScore = Math.max(0, 100 - post.skip_rate * 200);
  } else if (post.avg_watch_time_seconds && post.duration_seconds) {
    hookScore = Math.min(100, (post.avg_watch_time_seconds / post.duration_seconds) * 100);
  }

  // Retention %
  const retention =
    post.avg_watch_time_seconds && post.duration_seconds
      ? (post.avg_watch_time_seconds / post.duration_seconds) * 100
      : null;

  const scores = [engagementScore, reachScore, followsScore];
  if (hookScore != null) scores.push(hookScore);
  const overall = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    overall: Math.round(overall),
    engagementScore: Math.round(engagementScore),
    reachScore: Math.round(reachScore),
    followsScore: Math.round(followsScore),
    hookScore: hookScore != null ? Math.round(hookScore) : null,
    retention,
  };
}
