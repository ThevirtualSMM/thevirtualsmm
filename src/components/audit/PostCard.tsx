import { Post } from "@/types";

const typeLabels: Record<string, string> = {
  reel: "Reel",
  carousel: "Carousel",
  image: "Image",
  video: "Video",
};

function metricDisplay(post: Post, metric: string) {
  if (metric === "views") return { label: "Views", value: (post.views || 0).toLocaleString() };
  if (metric === "followers") return { label: "Follows", value: (post.follows_from_post || 0).toLocaleString() };
  if (metric === "engagement") {
    const eng = ((post.like_rate || 0) + (post.comment_rate || 0) + (post.share_rate || 0) + (post.save_rate || 0)) * 100;
    return { label: "Engagement", value: `${eng.toFixed(1)}%` };
  }
  return { label: "", value: "" };
}

export default function PostCard({ post, metric }: { post: Post; metric: string }) {
  const { label, value } = metricDisplay(post, metric);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex gap-4">
      {post.thumbnail_url && (
        <img
          src={post.thumbnail_url}
          alt=""
          className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-neutral-800"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
            {typeLabels[post.post_type || ""] || post.post_type}
          </span>
          {post.posted_at && (
            <span className="text-xs text-neutral-600">
              {new Date(post.posted_at).toLocaleDateString()}
            </span>
          )}
        </div>
        {post.caption && (
          <p className="text-sm text-neutral-300 line-clamp-2 mb-2">{post.caption}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
          <span className="text-white font-semibold">
            {post.views > 0 ? post.views.toLocaleString() : "—"}
            <span className="text-neutral-500 font-normal"> views</span>
          </span>
          {post.accounts_reached > 0 && <span>{post.accounts_reached.toLocaleString()} reached</span>}
          {post.like_rate != null && <span>{(post.like_rate * 100).toFixed(1)}% likes</span>}
          {post.share_rate != null && <span>{(post.share_rate * 100).toFixed(1)}% shares</span>}
          {post.avg_watch_time_seconds != null && (
            <span>{post.avg_watch_time_seconds.toFixed(1)}s watch</span>
          )}
        </div>
        {post.questions_in_comments && post.questions_in_comments.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-neutral-600">Top question: <span className="text-neutral-400">{post.questions_in_comments[0]}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
