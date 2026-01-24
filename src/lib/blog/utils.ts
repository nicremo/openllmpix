import type { BlogPost, BlogFilterState, BlogCategory } from "./types";

export function filterBlogPosts(
  posts: BlogPost[],
  filters: BlogFilterState
): BlogPost[] {
  let filtered = [...posts];

  // Filter by search query
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Filter by category
  if (filters.category !== "all") {
    filtered = filtered.filter((post) => post.category === filters.category);
  }

  // Sort
  filtered.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return filters.sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  return filtered;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getCategoryLabel(category: BlogCategory): string {
  const labels: Record<BlogCategory, string> = {
    tutorial: "Tutorial",
    news: "News",
    release: "Release",
    guide: "Guide",
    showcase: "Showcase",
    comparison: "Comparison",
  };
  return labels[category];
}

export function getCategoryColor(category: BlogCategory): {
  bg: string;
  text: string;
} {
  const colors: Record<BlogCategory, { bg: string; text: string }> = {
    tutorial: { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
    news: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
    release: { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7" },
    guide: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
    showcase: { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899" },
    comparison: { bg: "rgba(99, 102, 241, 0.15)", text: "#6366f1" },
  };
  return colors[category];
}
