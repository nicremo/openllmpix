import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost, BlogCategory } from "./types";

const articlesDirectory = path.join(process.cwd(), "src/lib/blog/articles");

export function getMarkdownBlogPosts(): BlogPost[] {
  // Check if articles directory exists
  if (!fs.existsSync(articlesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(articlesDirectory);
  const posts: BlogPost[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".md")) continue;

    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Validate required fields
    if (!data.slug || !data.title || !data.excerpt) {
      console.warn(`Skipping ${fileName}: missing required frontmatter fields`);
      continue;
    }

    posts.push({
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      content: content.trim(),
      category: (data.category as BlogCategory) || "guide",
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: {
        name: typeof data.author === "string" ? data.author : data.author?.name || "OPENLLMPIX Team",
        avatar: typeof data.author === "object" ? data.author?.avatar : undefined,
      },
      publishedAt: data.publishedAt || new Date().toISOString().split("T")[0],
      readingTime: data.readingTime || Math.ceil(content.split(/\s+/).length / 200),
      featured: data.featured || false,
      coverImage: data.coverImage,
    });
  }

  // Sort by date (newest first)
  return posts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
