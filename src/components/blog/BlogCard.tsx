import Link from "next/link";
import type { BlogPost } from "@/lib/blog/types";
import { formatDate, getCategoryLabel, getCategoryColor } from "@/lib/blog/utils";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const categoryStyle = getCategoryColor(post.category);

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article
        className="h-full rounded-xl border overflow-hidden transition-all hover:border-[var(--border-default)]"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Cover Image */}
        {post.coverImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Category & Meta */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: categoryStyle.bg, color: categoryStyle.text }}
            >
              {getCategoryLabel(post.category)}
            </span>
            {post.featured && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}
              >
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-[#f59e0b] transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {post.title}
          </h2>

          {/* Excerpt */}
          <p
            className="text-sm mb-4 line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {post.excerpt}
          </p>

          {/* Footer */}
          <div
            className="flex items-center justify-between text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span>{formatDate(post.publishedAt)}</span>
            <span>{post.readingTime} min read</span>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--bg-base)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
