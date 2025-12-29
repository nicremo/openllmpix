/**
 * Client-side Google AI Studio adapter.
 * Makes direct API calls from the browser - API key never touches the server.
 * Uses the Gemini API for image generation.
 */

import { ClientProviderAdapter } from "./base";
import { GenerateRequest, GenerateResult } from "../types";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

interface ImagenResponse {
  predictions?: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

export class ClientGoogleAIStudioAdapter extends ClientProviderAdapter {
  readonly providerId = "google-ai-studio" as const;
  readonly name = "Google AI Studio";
  readonly supportsCORS = true;

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    // Check if using Imagen or Gemini
    if (request.model.startsWith("imagen")) {
      return this.generateWithImagen(request);
    }
    return this.generateWithGemini(request);
  }

  private async generateWithGemini(request: GenerateRequest): Promise<GenerateResult> {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Add reference images for image-to-image mode
    if (request.mode === "image-to-image" && request.referenceImages?.length) {
      for (const imageData of request.referenceImages) {
        const extracted = this.extractBase64(imageData);
        if (extracted) {
          parts.push({
            inlineData: {
              mimeType: extracted.mimeType,
              data: extracted.base64,
            },
          });
        }
      }
    }

    // Build the prompt with aspect ratio instruction
    const aspectInstruction = this.buildAspectRatioInstruction(request.aspectRatio);
    const promptText = request.mode === "image-to-image"
      ? `Using the provided image(s), ${request.prompt}. Maintain the original style and quality unless otherwise specified.${aspectInstruction}`
      : `${request.prompt}${aspectInstruction}`;

    parts.push({ text: promptText });

    // Direct CORS call to Google AI Studio
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${request.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Google AI Studio API error: ${response.status}`;
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

    const images = this.extractImagesFromGemini(data);

    if (images.length === 0) {
      throw new Error("No images were generated. The model may not support image generation.");
    }

    return {
      images,
      model: request.model,
      provider: "google-ai-studio",
    };
  }

  private async generateWithImagen(request: GenerateRequest): Promise<GenerateResult> {
    // Imagen uses a different API structure
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:predict?key=${request.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: request.prompt + this.buildAspectRatioInstruction(request.aspectRatio),
            },
          ],
          parameters: {
            sampleCount: request.numberOfImages || 1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Google Imagen API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorText;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: ImagenResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const images = data.predictions?.map((pred) =>
      this.createDataUrl(pred.bytesBase64Encoded, pred.mimeType)
    ) || [];

    if (images.length === 0) {
      throw new Error("No images were generated.");
    }

    return {
      images,
      model: request.model,
      provider: "google-ai-studio",
    };
  }

  private extractImagesFromGemini(data: GeminiResponse): string[] {
    const images: string[] = [];

    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          images.push(
            this.createDataUrl(part.inlineData.data, part.inlineData.mimeType)
          );
        }
      }
    }

    return images;
  }
}
