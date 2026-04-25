import OpenAI from "openai";
import { Post, ClaudeAnalysis } from "@/types";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-5";

function buildPrompt(postsData: Record<string, unknown>[]): string {
  return `You are an expert social media analyst. Analyze this Instagram account's 90-day performance data and return a JSON object.

POSTS DATA:
${JSON.stringify(postsData, null, 2)}

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "summary": "3-5 sentence plain language summary of the account's overall 90-day performance, key strengths, and main opportunities",
  "best_by_views": [top 3 post objects with highest views],
  "best_by_engagement": [top 3 post objects with highest combined like+comment+share+save rate],
  "best_by_followers": [top 3 post objects with most follows_from_post],
  "worst_by_views": [bottom 3 post objects with lowest views],
  "worst_by_engagement": [bottom 3 post objects with lowest engagement],
  "worst_by_followers": [bottom 3 post objects with least follows],
  "top_sources": [{ "source": "Home|Explore|Profile|Hashtags|Other", "avg_percentage": number }],
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "best_posting_times": ["observation about best days/times based on the data"],
  "top_hashtags": ["any recurring hashtags found in top performing posts"],
  "notable_observations": ["observation 1", "observation 2", "observation 3"]
}

Each post object in the arrays should have:
{ "instagram_post_id": string, "post_type": string, "posted_at": string, "caption_preview": string, "metric_value": number, "metric_label": string }`;
}

export async function analyzeAudit(posts: Post[]): Promise<{ summary: string; analysis: ClaudeAnalysis }> {
  const postsData = posts.map((p) => ({
    id: p.instagram_post_id,
    type: p.post_type,
    posted_at: p.posted_at,
    caption_preview: p.caption?.slice(0, 150),
    views: p.views,
    accounts_reached: p.accounts_reached,
    avg_watch_time_seconds: p.avg_watch_time_seconds,
    follows_from_post: p.follows_from_post,
    skip_rate: p.skip_rate,
    share_rate: p.share_rate,
    like_rate: p.like_rate,
    save_rate: p.save_rate,
    repost_rate: p.repost_rate,
    comment_rate: p.comment_rate,
    source_home: p.source_home,
    source_explore: p.source_explore,
    source_profile: p.source_profile,
    source_hashtags: p.source_hashtags,
    source_other: p.source_other,
    questions_in_comments: p.questions_in_comments,
    duration_seconds: p.duration_seconds,
  }));

  const prompt = buildPrompt(postsData);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const text = response.choices[0].message.content || "{}";

  let parsed: { summary: string } & ClaudeAnalysis;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Model returned invalid JSON");
    parsed = JSON.parse(jsonMatch[0]);
  }

  const { summary, ...analysis } = parsed;
  return { summary, analysis: analysis as ClaudeAnalysis };
}

export function extractQuestions(comments: { text: string; likes: number }[]): string[] {
  return comments
    .map((c) => c.text)
    .filter((text) => text.includes("?"))
    .slice(0, 10);
}
