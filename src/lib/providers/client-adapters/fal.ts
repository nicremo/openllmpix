/**
 * Client-side fal.ai adapter.
 * Makes direct API calls from the browser - API key never touches the server.
 * fal.ai supports CORS for browser-based requests.
 */

import { ClientProviderAdapter } from "./base";
import { GenerateRequest, GenerateResult } from "../types";

interface FalResponse {
  images?: Array<{
    url: string;
    content_type?: string;
  }>;
  image?: {
    url: string;
    content_type?: string;
  };
  error?: string;
  detail?: string;
}

export class ClientFalAdapter extends ClientProviderAdapter {
  readonly providerId = "fal" as const;
  readonly name = "fal.ai";
  readonly supportsCORS = true;

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const dimensions = this.getImageDimensions(request.aspectRatio);
    const model = request.model;

    // fal.ai uses different endpoints for different models
    const modelPath = model.replace("fal-ai/", "");

    // Build adaptive request body - not all models accept the same params
    const body: Record<string, unknown> = {
      prompt: request.prompt,
      num_images: request.numberOfImages || 1,
    };

    if (model.includes("flux")) {
      body.image_size = { width: dimensions.width, height: dimensions.height };
      body.num_inference_steps = model.includes("schnell") ? 4 : 28;
      body.enable_safety_checker = true;
      if (request.mode === "image-to-image" && request.referenceImages?.[0]) {
        body.image_url = request.referenceImages[0];
      }
    } else if (model.includes("ideogram")) {
      body.aspect_ratio = this.toAspectRatioString(request.aspectRatio);
    } else if (model.includes("recraft") || model.includes("seedream")) {
      body.image_size = { width: dimensions.width, height: dimensions.height };
    }

    // Direct CORS call to fal.ai
    const response = await fetch(`https://fal.run/fal-ai/${modelPath}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `fal.ai API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.detail || errorData.message || errorText;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: FalResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Extract images from response
    const images: string[] = [];

    if (data.images) {
      for (const img of data.images) {
        images.push(img.url);
      }
    } else if (data.image) {
      images.push(data.image.url);
    }

    if (images.length === 0) {
      throw new Error("No images were generated.");
    }

    return {
      images,
      model: request.model,
      provider: "fal",
    };
  }

  private getImageDimensions(aspectRatio: string): { width: number; height: number } {
    const dimensions: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1344, height: 768 },
      "9:16": { width: 768, height: 1344 },
      "4:3": { width: 1152, height: 896 },
      "3:4": { width: 896, height: 1152 },
    };
    return dimensions[aspectRatio] || dimensions["1:1"];
  }

  private toAspectRatioString(aspectRatio: string): string {
    // Ideogram accepts aspect_ratio as a string like "1:1", "16:9"
    return aspectRatio || "1:1";
  }
}
