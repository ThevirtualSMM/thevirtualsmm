"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Post } from "@/types";
import PostDetailModal from "./PostDetailModal";

interface Props {
  posts: Post[];
  auditId: string;
}

const typeColors: Record<string, string> = {
  reel: "bg-purple-500/20 text-purple-300",
  video: "bg-blue-500/20 text-blue-300",
  carousel: "bg-orange-500/20 text-orange-300",
  image: "bg-neutral-800 text-neutral-400",
};

export default function PostGallery({ posts, auditId }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  }

  if (posts.length === 0) return null;

  return (
    <>
      <div className="relative">
        {/* Arrow left */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-neutral-900 border border-neutral-700 rounded-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="flex-shrink-0 w-40 group relative cursor-pointer focus:outline-none"
            >
              {/* Thumbnail */}
              <div className="w-40 h-52 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 group-hover:border-neutral-600 transition-colors relative">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-700">
                    <Play size={32} />
                  </div>
                )}

                {/* Video play icon */}
                {(post.post_type === "reel" || post.post_type === "video") && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                    <Play size={10} fill="white" className="text-white" />
                  </div>
                )}

                {/* Views badge — always visible */}
                {post.views > 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/70 rounded-md px-1.5 py-0.5 text-xs text-white font-medium">
                    {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}k` : post.views} views
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-left">
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium">
                      {post.views > 0 ? post.views.toLocaleString() : "—"} <span className="text-neutral-400 font-normal">views</span>
                    </p>
                    {post.accounts_reached > 0 && (
                      <p className="text-xs text-neutral-300">
                        {post.accounts_reached.toLocaleString()} reached
                      </p>
                    )}
                    {post.follows_from_post > 0 && (
                      <p className="text-xs text-purple-300">
                        +{post.follows_from_post.toLocaleString()} follows
                      </p>
                    )}
                    {post.likes_count > 0 && (
                      <p className="text-xs text-neutral-300">
                        {post.likes_count.toLocaleString()} likes{post.like_rate != null ? ` · ${(post.like_rate * 100).toFixed(1)}%` : ""}
                      </p>
                    )}
                    {post.shares_count > 0 && (
                      <p className="text-xs text-neutral-300">
                        {post.shares_count.toLocaleString()} shares{post.share_rate != null ? ` · ${(post.share_rate * 100).toFixed(1)}%` : ""}
                      </p>
                    )}
                    {post.saves_count > 0 && (
                      <p className="text-xs text-neutral-300">
                        {post.saves_count.toLocaleString()} saves{post.save_rate != null ? ` · ${(post.save_rate * 100).toFixed(1)}%` : ""}
                      </p>
                    )}
                    {post.avg_watch_time_seconds != null && (
                      <p className="text-xs text-neutral-300">
                        {post.avg_watch_time_seconds.toFixed(1)}s avg watch
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="mt-2 px-0.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${typeColors[post.post_type || ""] || typeColors.image}`}
                  >
                    {post.post_type || "post"}
                  </span>
                  {post.posted_at && (
                    <span className="text-xs text-neutral-600">
                      {new Date(post.posted_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Arrow right */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-neutral-900 border border-neutral-700 rounded-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          allPosts={posts}
          auditId={auditId}
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
