import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { getBlogPost, getAllBlogPosts } from "@/lib/blog/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getBlogPost(resolvedParams.slug);

  if (!post) {
    return {
      title: "Post Not Found | OPENLLMPIX Blog",
    };
  }

  return {
    title: `${post.title} | OPENLLMPIX Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = getBlogPost(resolvedParams.slug);

  if (!post) {
    notFound();
  }

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
          <Link
            href="/blog"
            className="text-xs px-2 py-0.5 rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
            style={{ background: "var(--bg-surface)", color: "var(--text-secondary)" }}
          >
            Blog
          </Link>
        </div>

        <Link
          href="/blog"
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
          All Posts
        </Link>
      </header>

      {/* Content */}
      <main className="px-6 py-12">
        <BlogPostContent post={post} />
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
