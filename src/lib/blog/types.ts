export type BlogCategory = "tutorial" | "news" | "release" | "guide" | "showcase" | "comparison";

export interface BlogAuthor {
  name: string;
  avatar?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML
  category: BlogCategory;
  tags: string[];
  author: BlogAuthor;
  coverImage?: string;
  publishedAt: string;
  readingTime: number;
  featured?: boolean;
}

export interface BlogFilterState {
  search: string;
  category: BlogCategory | "all";
  sortBy: "newest" | "oldest";
}

export interface BlogCategoryInfo {
  id: BlogCategory;
  name: string;
  icon: string;
}

export const BLOG_CATEGORIES: BlogCategoryInfo[] = [
  { id: "tutorial", name: "Tutorials", icon: "📚" },
  { id: "guide", name: "Guides", icon: "📖" },
  { id: "comparison", name: "Comparisons", icon: "⚖️" },
  { id: "news", name: "News", icon: "📰" },
  { id: "release", name: "Releases", icon: "🚀" },
  { id: "showcase", name: "Showcases", icon: "✨" },
];
