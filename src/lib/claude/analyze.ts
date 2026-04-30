import OpenAI from "openai";
import { Post, ClaudeAnalysis } from "@/types";
import { ARCHETYPES, type ArchetypeKey } from "@/app/onboarding/archetypes";
import type { OnboardingState } from "@/app/onboarding/state";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-5";

export interface BrandContext {
  responses: OnboardingState;
  archetype_primary: ArchetypeKey | null;
  archetype_secondary: ArchetypeKey | null;
}

function buildBrandPreamble(ctx: BrandContext | null): string {
  if (!ctx) return "";

  const r = ctx.responses;
  const primary   = ctx.archetype_primary   ? ARCHETYPES[ctx.archetype_primary]   : null;
  const secondary = ctx.archetype_secondary ? ARCHETYPES[ctx.archetype_secondary] : null;

  const lines: string[] = ["BRAND CONTEXT (use this to tailor the summary, patterns, and observations):"];

  if (r.goal?.primary)          lines.push(`- Main goal: ${labelGoal(r.goal.primary)}`);
  if (r.goal?.followers_target) lines.push(`- 90-day target: ${labelTarget(r.goal.followers_target)}`);
  if (r.goal?.selling === "yes" && r.goal.offer) {
    lines.push(`- Currently selling: ${r.goal.offer}${r.goal.price ? ` (${r.goal.price})` : ""}`);
  }
  if (r.audience?.niche)        lines.push(`- Niche: ${r.audience.niche}`);
  if (r.audience?.locations?.length) lines.push(`- Audience locations: ${r.audience.locations.join(", ")}`);
  if (r.audience?.problem)      lines.push(`- Audience problem they help solve: ${r.audience.problem}`);
  if (r.branding?.topics?.length)     lines.push(`- Content pillars: ${r.branding.topics.join(", ")}`);
  if (r.branding?.voice?.length)      lines.push(`- Voice: ${r.branding.voice.join(", ")}`);
  if (r.branding?.differentiator)     lines.push(`- Differentiator: ${r.branding.differentiator}`);
  if (r.branding?.brand_kind)         lines.push(`- Brand type: ${r.branding.brand_kind === "personal" ? "personal brand" : "business brand"}`);
  if (primary)   lines.push(`- Brand archetype (primary): ${primary.name} — ${primary.tagline}`);
  if (secondary) lines.push(`- Brand archetype (secondary): ${secondary.name} — ${secondary.tagline}`);

  lines.push(
    "",
    "Tailor the analysis to this creator's specific niche, voice, and goal — don't write generic advice.",
    "When you suggest patterns or observations, frame them in terms of what would help this creator hit their stated goal."
  );
  return lines.join("\n");
}

function labelGoal(g: string): string {
  return ({ grow: "grow audience", sell: "sell offer", authority: "build authority", traffic: "drive traffic" } as Record<string, string>)[g] ?? g;
}

function labelTarget(t: string): string {
  return ({ "1k": "to 1K", "1k_5k": "1K → 5K", "5k_10k": "5K → 10K", "10k_50k": "10K → 50K", "50k_plus": "50K+" } as Record<string, string>)[t] ?? t;
}

function buildPrompt(postsData: Record<string, unknown>[], brand: BrandContext | null): string {
  const preamble = buildBrandPreamble(brand);
  return `You are an expert social media analyst. Analyze this Instagram account's 90-day performance data and return a JSON object.

${preamble ? preamble + "\n\n" : ""}POSTS DATA:
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

export async function analyzeAudit(
  posts: Post[],
  brand: BrandContext | null = null,
): Promise<{ summary: string; analysis: ClaudeAnalysis }> {
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

  const prompt = buildPrompt(postsData, brand);

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
