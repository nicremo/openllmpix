/**
 * Client-side OpenRouter adapter.
 * Makes direct API calls from the browser - API key never touches the server.
 * OpenRouter fully supports CORS for browser-based requests.
 */

import { ClientProviderAdapter } from "./base";
import { GenerateRequest, GenerateResult, ProviderModel } from "../types";

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{
        type: string;
        data?: string;
        image_url?: { url: string };
      }>;
      // OpenRouter image generation response format
      images?: Array<{
        image_url?: { url: string };
        b64_json?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

interface OpenRouterModelResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    architecture?: {
      modality?: string;
      input_modalities?: string[];
      output_modalities?: string[];
    };
    pricing?: {
      prompt?: string;
      completion?: string;
      image?: string;
    };
  }>;
}

export class ClientOpenRouterAdapter extends ClientProviderAdapter {
  readonly providerId = "openrouter" as const;
  readonly name = "OpenRouter";
  readonly supportsCORS = true;

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Add reference images for image-to-image mode
    if (request.mode === "image-to-image" && request.referenceImages?.length) {
      for (const imageData of request.referenceImages) {
        content.push({
          type: "image_url",
          image_url: { url: imageData },
        });
      }
    }

    // Build the prompt with aspect ratio instruction
    const aspectInstruction = this.buildAspectRatioInstruction(request.aspectRatio);
    const promptText = request.mode === "image-to-image"
      ? `Using the provided image(s), ${request.prompt}. Maintain the original style and quality unless otherwise specified.${aspectInstruction}`
      : `${request.prompt}${aspectInstruction}`;

    content.push({ type: "text", text: promptText });

    // Direct CORS call to OpenRouter - no server proxy needed!
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Nano Banana Pro",
      },
      body: JSON.stringify({
        model: request.model,
        modalities: ["text", "image"],
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `OpenRouter API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorText;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const images = this.extractImages(data);

    if (images.length === 0) {
      throw new Error("No images were generated. The model may not support image generation.");
    }

    return {
      images,
      model: request.model,
      provider: "openrouter",
    };
  }

  private extractImages(data: OpenRouterResponse): string[] {
    const images: string[] = [];
    const choice = data.choices?.[0];
    const message = choice?.message;

    // Format 1: OpenRouter's images array (preferred for image generation)
    if (message?.images && Array.isArray(message.images)) {
      for (const img of message.images) {
        if (img.image_url?.url) {
          images.push(img.image_url.url);
        } else if (img.b64_json) {
          images.push(`data:image/png;base64,${img.b64_json}`);
        }
      }
    }

    // Format 2: Content array with image parts
    if (message?.content && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "image" && part.data) {
          images.push(part.data);
        } else if (part.type === "image_url" && part.image_url?.url) {
          images.push(part.image_url.url);
        }
      }
    }

    // Format 3: Direct base64 string in content
    if (typeof message?.content === "string" && message.content.startsWith("data:image")) {
      images.push(message.content);
    }

    return images;
  }

  /**
   * Fetch available models directly from OpenRouter.
   * This is a public endpoint - no API key needed.
   */
  async listModels(): Promise<ProviderModel[]> {
    const response = await fetch("https://openrouter.ai/api/v1/models");

    if (!response.ok) {
      throw new Error("Failed to fetch models from OpenRouter");
    }

    const data: OpenRouterModelResponse = await response.json();

    // Filter for models that are specifically image GENERATION models
    const imageModels = data.data.filter((model) => {
      const modelId = model.id.toLowerCase();
      const modelName = (model.name || "").toLowerCase();

      // Models with "image" in the ID are image generation models
      const hasImageInId = modelId.includes("-image") || modelId.includes("/image");

      // Known image generation model patterns
      const isKnownImageModel =
        modelId.includes("imagen") ||
        modelId.includes("dall-e") ||
        modelId.includes("flux") ||
        modelId.includes("stable-diffusion") ||
        modelId.includes("sdxl") ||
        modelId.includes("midjourney") ||
        modelId.includes("playground-v");

      // Gemini/GPT models that specifically mention image generation
      const isGeminiImageModel = modelId.includes("gemini") && (
        modelName.includes("image") ||
        modelName.includes("nano banana")
      );
      const isGptImageModel = modelId.includes("gpt") && modelName.includes("image");

      return hasImageInId || isKnownImageModel || isGeminiImageModel || isGptImageModel;
    });

    return imageModels.map((model) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description,
      capabilities: {
        textToImage: true,
        imageToImage: !model.architecture?.modality?.includes("image-only"),
      },
      pricing: model.pricing?.image
        ? { perImage: parseFloat(model.pricing.image) }
        : undefined,
    }));
  }
}
