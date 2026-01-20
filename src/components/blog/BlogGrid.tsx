"use client";

import { useMemo } from "react";
import BlogCard from "./BlogCard";
import type { BlogPost, BlogFilterState } from "@/lib/blog/types";
import { filterBlogPosts } from "@/lib/blog/utils";

interface BlogGridProps {
  posts: BlogPost[];
  filters: BlogFilterState;
}

export default function BlogGrid({ posts, filters }: BlogGridProps) {
  const filteredPosts = useMemo(() => {
    return filterBlogPosts(posts, filters);
  }, [posts, filters]);

  if (filteredPosts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4"
        style={{ color: "var(--text-secondary)" }}
      >
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "var(--bg-surface)" }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--text-tertiary)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          No posts found
        </p>
        <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredPosts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
