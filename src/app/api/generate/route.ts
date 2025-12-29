import { NextRequest, NextResponse } from "next/server";
import { getAdapter, hasAdapter } from "@/lib/providers/adapters";
import { GenerateRequest, ProviderId } from "@/lib/providers/types";

export const maxDuration = 60;

// Input validation constants
const MAX_PROMPT_LENGTH = 4000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
const MAX_REFERENCE_IMAGES = 4;
const VALID_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

// Simple in-memory rate limiting (per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/generate
 *
 * Generates images using the specified provider and model.
 * The request is delegated to the appropriate provider adapter.
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    const {
      prompt,
      aspectRatio = "1:1",
      model,
      apiKey,
      provider = "openrouter",
      mode = "text-to-image",
      referenceImages,
      numberOfImages = 1,
    } = body as Partial<GenerateRequest> & { numberOfImages?: number };

    // Validate required fields
    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 }
      );
    }

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    if (!model?.trim()) {
      return NextResponse.json(
        { error: "Model is required" },
        { status: 400 }
      );
    }

    // Validate aspect ratio
    if (!VALID_ASPECT_RATIOS.includes(aspectRatio)) {
      return NextResponse.json(
        { error: "Invalid aspect ratio" },
        { status: 400 }
      );
    }

    // Validate reference images
    if (referenceImages) {
      if (!Array.isArray(referenceImages)) {
        return NextResponse.json(
          { error: "Reference images must be an array" },
          { status: 400 }
        );
      }
      if (referenceImages.length > MAX_REFERENCE_IMAGES) {
        return NextResponse.json(
          { error: `Maximum ${MAX_REFERENCE_IMAGES} reference images allowed` },
          { status: 400 }
        );
      }
      // Check image sizes (base64 length * 0.75 ≈ bytes)
      for (const img of referenceImages) {
        if (typeof img === "string" && img.length * 0.75 > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: "Reference image too large. Maximum 10MB per image." },
            { status: 400 }
          );
        }
      }
    }

    // Validate provider
    const providerId = provider as ProviderId;
    if (!hasAdapter(providerId)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    // Get the adapter
    const adapter = getAdapter(providerId);

    // Build the request
    const generateRequest: GenerateRequest = {
      prompt: prompt.trim(),
      aspectRatio,
      model,
      apiKey,
      provider: providerId,
      mode,
      referenceImages,
      numberOfImages,
    };

    // Generate the image
    const result = await adapter.generate(generateRequest);

    if (!result.images || result.images.length === 0) {
      return NextResponse.json(
        { error: "No images were generated. The model may not support image generation or content was filtered." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      images: result.images,
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    // Don't log errors in production - use error tracking service instead
    const message = error instanceof Error ? error.message : "";
    const lowerMessage = message.toLowerCase();

    // Map common errors to user-friendly messages (sanitized - no internal details)
    if (message.includes("401") || (lowerMessage.includes("invalid") && lowerMessage.includes("key"))) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your API key configuration." },
        { status: 401 }
      );
    }

    if (message.includes("429") || lowerMessage.includes("rate")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    if (lowerMessage.includes("safety") || lowerMessage.includes("blocked") || lowerMessage.includes("moderat")) {
      return NextResponse.json(
        { error: "Content was blocked by safety filters. Please try a different prompt." },
        { status: 400 }
      );
    }

    if (lowerMessage.includes("timeout")) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    if (lowerMessage.includes("not found") || message.includes("404")) {
      return NextResponse.json(
        { error: "Model not found. Please select a different model." },
        { status: 404 }
      );
    }

    // Generic error - don't expose internal details
    return NextResponse.json(
      { error: "Image generation failed. Please try again." },
      { status: 500 }
    );
  }
}
