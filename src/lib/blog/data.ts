import type { BlogPost } from "./types";
import { getMarkdownBlogPosts } from "./markdown-loader";

export const blogPosts: BlogPost[] = [
  {
    slug: "getting-started-with-openllmpix",
    title: "Getting Started with OPENLLMPIX",
    excerpt:
      "Learn how to set up OPENLLMPIX and generate your first AI image in minutes. A complete beginner's guide to getting started.",
    content: `
      <h2>Introduction</h2>
      <p>OPENLLMPIX is an open-source AI image generation platform that allows you to create stunning images using various AI models through a unified interface. In this tutorial, you'll learn how to set up your environment and generate your first image.</p>

      <h2>Prerequisites</h2>
      <ul>
        <li>An API key from a supported provider (OpenRouter, Replicate, or Together AI)</li>
        <li>A modern web browser</li>
      </ul>

      <h2>Step 1: Configure Your API Key</h2>
      <p>When you first open OPENLLMPIX, you'll be prompted to enter your API key. Click the "Settings" button in the header and enter your API key for your preferred provider.</p>
      <p>We recommend starting with <strong>OpenRouter</strong> as it provides access to multiple models with a single API key.</p>

      <h2>Step 2: Select a Model</h2>
      <p>OPENLLMPIX supports various AI models for image generation:</p>
      <ul>
        <li><strong>FLUX models</strong> - High quality, fast generation</li>
        <li><strong>Stable Diffusion</strong> - Versatile and customizable</li>
        <li><strong>DALL-E</strong> - Great for creative and artistic images</li>
      </ul>
      <p>Choose a model from the dropdown in the left panel. Free models are marked with a green "FREE" badge.</p>

      <h2>Step 3: Write Your First Prompt</h2>
      <p>Enter a description of the image you want to create. Be specific and descriptive:</p>
      <blockquote>
        "A minimalist desk setup with warm lighting, featuring a modern laptop, a cup of coffee, and a small succulent plant, soft shadows, professional photography"
      </blockquote>

      <h2>Step 4: Configure Options</h2>
      <p>Before generating, you can adjust:</p>
      <ul>
        <li><strong>Aspect Ratio</strong> - Choose from 1:1, 16:9, 9:16, 4:3, or 3:4</li>
        <li><strong>Number of Images</strong> - Generate 1-4 images at once</li>
      </ul>

      <h2>Step 5: Generate!</h2>
      <p>Click the "Generate" button and watch as your images are created. Generated images appear in the Gallery tab on the right.</p>

      <h2>Using Chat Studio</h2>
      <p>Once you have a generated image, you can refine it using Chat Studio:</p>
      <ol>
        <li>Click the chat icon on any image in the gallery</li>
        <li>The image opens in Chat Studio mode</li>
        <li>Describe the changes you want: "Make the lighting warmer" or "Add a sunset in the background"</li>
        <li>The AI will generate a modified version based on your instructions</li>
      </ol>

      <h2>Tips for Better Results</h2>
      <ul>
        <li>Be specific about style, lighting, and composition</li>
        <li>Include artistic references like "in the style of..." or "professional photography"</li>
        <li>Use negative prompts to exclude unwanted elements</li>
        <li>Experiment with different models - each has unique strengths</li>
      </ul>

      <h2>Next Steps</h2>
      <p>Now that you've generated your first image, explore more features:</p>
      <ul>
        <li>Try Image-to-Image mode with reference images</li>
        <li>Use Chat Studio for iterative refinement</li>
        <li>Download and share your creations</li>
      </ul>
    `,
    category: "tutorial",
    tags: ["getting-started", "tutorial", "beginner", "setup"],
    author: {
      name: "OPENLLMPIX Team",
    },
    publishedAt: "2025-01-15",
    readingTime: 5,
    featured: true,
  },
  {
    slug: "understanding-ai-image-models",
    title: "Understanding AI Image Models",
    excerpt:
      "A deep dive into the different AI models available in OPENLLMPIX and when to use each one.",
    content: `
      <h2>Overview</h2>
      <p>OPENLLMPIX provides access to multiple AI image generation models, each with unique characteristics and strengths. Understanding these differences will help you choose the right model for your project.</p>

      <h2>FLUX Models</h2>
      <p>FLUX models from Black Forest Labs are known for their exceptional quality and speed:</p>
      <ul>
        <li><strong>FLUX Pro</strong> - Premium quality, best for professional work</li>
        <li><strong>FLUX Dev</strong> - Great balance of quality and cost</li>
        <li><strong>FLUX Schnell</strong> - Fastest generation, perfect for iterations</li>
      </ul>

      <h2>Stable Diffusion</h2>
      <p>The open-source powerhouse with extensive customization options:</p>
      <ul>
        <li>Wide community support and resources</li>
        <li>Highly customizable through fine-tuning</li>
        <li>Various versions available (SD 1.5, SDXL, SD3)</li>
      </ul>

      <h2>Choosing the Right Model</h2>
      <table>
        <tr>
          <th>Use Case</th>
          <th>Recommended Model</th>
        </tr>
        <tr>
          <td>Quick iterations</td>
          <td>FLUX Schnell</td>
        </tr>
        <tr>
          <td>Professional work</td>
          <td>FLUX Pro, DALL-E 3</td>
        </tr>
        <tr>
          <td>Artistic styles</td>
          <td>Stable Diffusion</td>
        </tr>
        <tr>
          <td>Image editing</td>
          <td>FLUX models with img2img</td>
        </tr>
      </table>
    `,
    category: "guide",
    tags: ["models", "ai", "comparison", "flux", "stable-diffusion"],
    author: {
      name: "OPENLLMPIX Team",
    },
    publishedAt: "2025-01-10",
    readingTime: 8,
  },
  {
    slug: "chat-studio-advanced-techniques",
    title: "Chat Studio: Advanced Editing Techniques",
    excerpt:
      "Master the Chat Studio feature with advanced prompting techniques for precise image editing.",
    content: `
      <h2>Introduction to Chat Studio</h2>
      <p>Chat Studio is OPENLLMPIX's conversational image editing feature. It allows you to iteratively refine images through natural language instructions.</p>

      <h2>Context Images</h2>
      <p>Chat Studio supports up to 4 context images simultaneously. This enables:</p>
      <ul>
        <li>Style transfer from reference images</li>
        <li>Combining elements from multiple sources</li>
        <li>Maintaining consistency across variations</li>
      </ul>

      <h2>Effective Prompts for Editing</h2>
      <p>Be specific about what you want to change:</p>
      <blockquote>"Change the background to a sunset beach while keeping the subject unchanged"</blockquote>
      <blockquote>"Apply a vintage film grain effect with warm color tones"</blockquote>
      <blockquote>"Transform the style to look like a Van Gogh painting"</blockquote>

      <h2>Iterative Refinement Workflow</h2>
      <ol>
        <li>Start with a generated or uploaded image</li>
        <li>Make broad changes first (background, style)</li>
        <li>Then refine details (lighting, colors, specific elements)</li>
        <li>Each edit adds to your context for better consistency</li>
      </ol>

      <h2>Pro Tips</h2>
      <ul>
        <li>Use multiple context images to guide style and composition</li>
        <li>Be explicit about what should stay the same</li>
        <li>Smaller, incremental changes often yield better results</li>
        <li>Download intermediate results to preserve your favorites</li>
      </ul>
    `,
    category: "tutorial",
    tags: ["chat-studio", "editing", "advanced", "prompting"],
    author: {
      name: "OPENLLMPIX Team",
    },
    publishedAt: "2025-01-05",
    readingTime: 6,
  },
];

// Cached combined posts
let cachedPosts: BlogPost[] | null = null;

function getCombinedPosts(): BlogPost[] {
  if (cachedPosts) return cachedPosts;

  const markdownPosts = getMarkdownBlogPosts();
  const allPosts = [...markdownPosts, ...blogPosts];

  // Remove duplicates by slug (markdown takes precedence)
  const seenSlugs = new Set<string>();
  cachedPosts = allPosts.filter((post) => {
    if (seenSlugs.has(post.slug)) return false;
    seenSlugs.add(post.slug);
    return true;
  });

  // Sort by date (newest first)
  cachedPosts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return cachedPosts;
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getCombinedPosts().find((post) => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return getCombinedPosts();
}

export function getFeaturedPosts(): BlogPost[] {
  return getCombinedPosts().filter((post) => post.featured);
}
