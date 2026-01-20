"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import BlogSearch from "@/components/blog/BlogSearch";
import BlogFilter from "@/components/blog/BlogFilter";
import BlogGrid from "@/components/blog/BlogGrid";
import { getAllBlogPosts } from "@/lib/blog/data";
import type { BlogFilterState, BlogCategory } from "@/lib/blog/types";

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const [filters, setFilters] = useState<BlogFilterState>({
    search: "",
    category: "all",
    sortBy: "newest",
  });

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleCategoryChange = useCallback((category: BlogCategory | "all") => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const handleSortChange = useCallback((sortBy: "newest" | "oldest") => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-6 border-b sticky top-0 z-10"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-primary)" }}
          >
            OPENLLMPIX
          </Link>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            Blog
          </span>
        </div>

        <Link
          href="/"
          className="text-xs px-3 py-1.5 rounded-md border flex items-center gap-2 transition-colors hover:bg-[var(--bg-elevated)]"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-secondary)",
            background: "transparent",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to App
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Blog
          </h1>
          <p
            className="text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Tutorials, guides, and updates for AI image generation
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex-1 max-w-md">
            <BlogSearch
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search posts..."
            />
          </div>
          <BlogFilter
            category={filters.category}
            sortBy={filters.sortBy}
            onCategoryChange={handleCategoryChange}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Posts Grid */}
        <BlogGrid posts={posts} filters={filters} />
      </main>

      {/* Footer */}
      <footer
        className="border-t py-8 mt-12"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p
            className="text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            OPENLLMPIX - Open Source AI Image Generation
          </p>
        </div>
      </footer>
    </div>
  );
}
