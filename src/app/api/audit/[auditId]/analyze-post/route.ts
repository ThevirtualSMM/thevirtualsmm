import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { auditId } = await params;
  const { postId } = await req.json();

  const { data: audit } = await supabase
    .from("audits")
    .select("id")
    .eq("id", auditId)
    .eq("user_id", session.user.id)
    .single();
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("instagram_post_id", postId)
    .eq("audit_id", auditId)
    .single();

  const { data: allPosts } = await supabase
    .from("posts")
    .select("views, like_rate, share_rate, save_rate, comment_rate, follows_from_post")
    .eq("audit_id", auditId);

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const avgViews =
    (allPosts || []).reduce((a: number, p: { views: number }) => a + (p.views || 0), 0) /
    Math.max((allPosts || []).length, 1);

  const retention =
    post.avg_watch_time_seconds && post.duration_seconds
      ? ((post.avg_watch_time_seconds / post.duration_seconds) * 100).toFixed(1)
      : null;

  const firstLine = post.caption?.split("\n")[0]?.slice(0, 120) || "No caption";

  const prompt = `Analyze this Instagram ${post.post_type} post performance. Be concise and specific.

POST DATA:
- Caption hook (first line): "${firstLine}"
- Views: ${post.views || 0} (account avg: ${Math.round(avgViews)})
- Accounts reached: ${post.accounts_reached || 0}
- Follows from post: ${post.follows_from_post || 0}
- Like rate: ${post.like_rate ? (post.like_rate * 100).toFixed(1) + "%" : "N/A"}
- Share rate: ${post.share_rate ? (post.share_rate * 100).toFixed(1) + "%" : "N/A"}
- Save rate: ${post.save_rate ? (post.save_rate * 100).toFixed(1) + "%" : "N/A"}
- Skip rate: ${post.skip_rate ? (post.skip_rate * 100).toFixed(1) + "%" : "N/A"}
- Avg watch time: ${post.avg_watch_time_seconds ? post.avg_watch_time_seconds.toFixed(1) + "s" : "N/A"}
- Duration: ${post.duration_seconds ? post.duration_seconds + "s" : "N/A"}
- Retention: ${retention ? retention + "%" : "N/A"}

Return ONLY valid JSON (no markdown, no explanation):
{
  "hook_analysis": "2 sentences analyzing the hook quality based on caption first line and skip/retention metrics",
  "hook_verdict": "good",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific thing to improve 1", "specific thing to improve 2"],
  "overall_verdict": "1-2 sentences on this post's overall performance"
}

hook_verdict must be one of: "good", "average", "poor"`;

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-5",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const text = response.choices[0].message.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { error: "Could not parse" };
    }
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
