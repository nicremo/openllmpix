import { ProviderAdapter } from "./base";
import { GenerateRequest, GenerateResult, ProviderModel } from "../types";

interface OpenRouterMessage {
  role: string;
  content: Array<{
    type: string;
    text?: string;
    image_url?: { url: string };
  }>;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{
        type: string;
        data?: string;
        image_url?: { url: string };
      }>;
      images?: Array<{
        type?: string;
        url?: string;
        image_url?: { url: string };
      }>;
    };
  }>;
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

export class OpenRouterAdapter extends ProviderAdapter {
  readonly providerId = "openrouter" as const;
  readonly name = "OpenRouter";

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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nano-banana.app",
        "X-Title": "Nano Banana Pro",
      },
      body: JSON.stringify({
        model: request.model,
        modalities: ["text", "image"],
        messages: [{ role: "user", content }] as OpenRouterMessage[],
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

    // Check for images array in message
    if (message?.images && Array.isArray(message.images)) {
      for (const img of message.images) {
        if (img.image_url?.url) {
          images.push(img.image_url.url);
        } else if (img.url) {
          images.push(img.url);
        }
      }
    }

    // Check content array
    if (message?.content) {
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "image" && part.data) {
            images.push(part.data);
          } else if (part.type === "image_url" && part.image_url?.url) {
            images.push(part.image_url.url);
          }
        }
      } else if (typeof message.content === "string" && message.content.startsWith("data:image")) {
        images.push(message.content);
      }
    }

    return images;
  }

  supportsModelListing(): boolean {
    return true;
  }

  async listModels(_apiKey: string): Promise<ProviderModel[]> {
    // OpenRouter's models endpoint is public, no API key needed
    const response = await fetch("https://openrouter.ai/api/v1/models");

    if (!response.ok) {
      throw new Error("Failed to fetch models from OpenRouter");
    }

    const data: OpenRouterModelResponse = await response.json();

    // Filter for models that are specifically image GENERATION models
    // Note: pricing.image is for image INPUT (vision), not output, so we can't use it
    const imageModels = data.data.filter((model) => {
      const modelId = model.id.toLowerCase();
      const modelName = (model.name || "").toLowerCase();

      // Known image GENERATION model families/keywords
      const isImageGenModel =
        // Dedicated image generation models
        modelId.includes("imagen") ||
        modelId.includes("dall-e") ||
        modelId.includes("flux") ||
        modelId.includes("stable-diffusion") ||
        modelId.includes("sdxl") ||
        modelId.includes("midjourney") ||
        modelId.includes("playground-v") ||
        // Gemini image generation variants (have "image" in name, not just vision)
        (modelId.includes("gemini") && (
          modelName.includes("image") ||
          modelName.includes("nano banana")
        )) ||
        // GPT image generation models (not vision models)
        (modelId.includes("gpt") && modelName.includes("image")) ||
        // Explicit markers
        modelName.includes("image generation");

      return isImageGenModel;
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
