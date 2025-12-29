import { ProviderAdapter } from "./base";
import { GenerateRequest, GenerateResult } from "../types";

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

export class GoogleAIStudioAdapter extends ProviderAdapter {
  readonly providerId = "google-ai-studio" as const;
  readonly name = "Google AI Studio";

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const parts: GeminiPart[] = [];

    // Add reference images for image-to-image mode
    if (request.mode === "image-to-image" && request.referenceImages?.length) {
      for (const imageData of request.referenceImages) {
        const extracted = this.extractBase64(imageData);
        if (extracted) {
          parts.push({
            inline_data: {
              mime_type: extracted.mimeType,
              data: extracted.base64,
            },
          });
        }
      }
    }

    // Build the prompt
    const aspectInstruction = this.buildAspectRatioInstruction(request.aspectRatio);
    const promptText = request.mode === "image-to-image"
      ? `Using the provided image(s), ${request.prompt}. Maintain the original style and quality unless otherwise specified.${aspectInstruction}`
      : `${request.prompt}${aspectInstruction}`;

    parts.push({ text: promptText });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${request.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "image/jpeg",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Google AI Studio error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorText;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const images = this.extractImages(data);

    if (images.length === 0) {
      throw new Error("No images were generated.");
    }

    return {
      images,
      model: request.model,
      provider: "google-ai-studio",
    };
  }

  private extractImages(data: GeminiResponse): string[] {
    const images: string[] = [];

    if (data.candidates) {
      for (const candidate of data.candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inline_data?.data) {
            const mimeType = part.inline_data.mime_type || "image/jpeg";
            images.push(this.createDataUrl(part.inline_data.data, mimeType));
          }
        }
      }
    }

    return images;
  }
}
