import Link from "next/link";
import type { BlogPost } from "@/lib/blog/types";
import { formatDate, getCategoryLabel, getCategoryColor } from "@/lib/blog/utils";

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const categoryStyle = getCategoryColor(post.category);

  return (
    <article className="max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        {/* Category & Featured Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: categoryStyle.bg, color: categoryStyle.text }}
          >
            {getCategoryLabel(post.category)}
          </span>
          {post.featured && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}
            >
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          {post.title}
        </h1>

        {/* Excerpt */}
        <p
          className="text-lg mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {post.excerpt}
        </p>

        {/* Meta Info */}
        <div
          className="flex items-center gap-4 text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {post.author.name.charAt(0)}
            </div>
            <span style={{ color: "var(--text-secondary)" }}>{post.author.name}</span>
          </div>
          <span>|</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span>|</span>
          <span>{post.readingTime} min read</span>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-tertiary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="mb-8 rounded-xl overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-invert max-w-none"
        style={{
          color: "var(--text-primary)",
        }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Divider */}
      <hr
        className="my-12"
        style={{ borderColor: "var(--border-subtle)" }}
      />

      {/* Footer */}
      <footer className="flex items-center justify-between">
        <Link
          href="/blog"
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#f59e0b]"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>
      </footer>
    </article>
  );
}
