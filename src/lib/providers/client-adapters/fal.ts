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
    // Parse aspect ratio to dimensions
    const dimensions = this.getImageDimensions(request.aspectRatio);

    // fal.ai uses different endpoints for different models
    const modelPath = request.model.replace("fal-ai/", "");

    // Direct CORS call to fal.ai
    const response = await fetch(`https://fal.run/fal-ai/${modelPath}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: request.prompt,
        image_size: {
          width: dimensions.width,
          height: dimensions.height,
        },
        num_images: request.numberOfImages || 1,
        num_inference_steps: this.getSteps(request.model),
        enable_safety_checker: true,
      }),
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
    // Standard dimensions for different aspect ratios
    const dimensions: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1344, height: 768 },
      "9:16": { width: 768, height: 1344 },
      "4:3": { width: 1152, height: 896 },
      "3:4": { width: 896, height: 1152 },
    };
    return dimensions[aspectRatio] || dimensions["1:1"];
  }

  private getSteps(model: string): number {
    // Schnell is optimized for 4 steps, others use more
    if (model.includes("schnell")) {
      return 4;
    }
    return 28;
  }
}
