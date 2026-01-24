import BlogPageClient from "@/components/blog/BlogPageClient";
import { blogPosts } from "@/lib/blog/data";
import { getMarkdownBlogPosts } from "@/lib/blog/markdown-loader";

export default function BlogPage() {
  // Combine hardcoded posts with markdown posts
  const markdownPosts = getMarkdownBlogPosts();
  const allPosts = [...blogPosts, ...markdownPosts];

  // Remove duplicates by slug (markdown takes precedence)
  const seenSlugs = new Set<string>();
  const uniquePosts = allPosts.filter((post) => {
    if (seenSlugs.has(post.slug)) return false;
    seenSlugs.add(post.slug);
    return true;
  });

  return <BlogPageClient posts={uniquePosts} />;
}
