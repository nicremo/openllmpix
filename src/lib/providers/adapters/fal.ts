import { ProviderAdapter } from "./base";
import { GenerateRequest, GenerateResult } from "../types";

interface FalResponse {
  images?: Array<{
    url: string;
    content_type?: string;
  }>;
  error?: string;
  detail?: string;
}

interface FalQueueResponse {
  request_id: string;
  status: string;
}

interface FalResultResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  result?: FalResponse;
  error?: string;
}

export class FalAdapter extends ProviderAdapter {
  readonly providerId = "fal" as const;
  readonly name = "fal.ai";

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    // Determine the endpoint based on the model
    const modelPath = request.model.replace("fal-ai/", "");
    const endpoint = `https://fal.run/fal-ai/${modelPath}`;

    // Map aspect ratio to fal.ai format
    const imageSize = this.mapAspectRatio(request.aspectRatio);

    const body: Record<string, unknown> = {
      prompt: request.prompt,
      image_size: imageSize,
      num_images: 1,
      enable_safety_checker: true,
    };

    // Add reference image for img2img models
    if (request.mode === "image-to-image" && request.referenceImages?.[0]) {
      body.image_url = request.referenceImages[0];
      body.strength = 0.75;
    }

    // Add model-specific parameters
    if (modelPath.includes("schnell")) {
      body.num_inference_steps = 4;
    } else if (modelPath.includes("dev")) {
      body.num_inference_steps = 28;
    } else if (modelPath.includes("pro")) {
      body.num_inference_steps = 40;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `fal.ai error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.error || errorText;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: FalResponse = await response.json();

    if (data.error || data.detail) {
      throw new Error(data.error || data.detail);
    }

    const images = data.images?.map((img) => img.url) || [];

    if (images.length === 0) {
      throw new Error("No images were generated");
    }

    return {
      images,
      model: request.model,
      provider: "fal",
    };
  }

  private mapAspectRatio(aspectRatio: string): string {
    // fal.ai uses specific size strings
    switch (aspectRatio) {
      case "16:9":
        return "landscape_16_9";
      case "9:16":
        return "portrait_16_9";
      case "4:3":
        return "landscape_4_3";
      case "3:4":
        return "portrait_4_3";
      default:
        return "square";
    }
  }
}
