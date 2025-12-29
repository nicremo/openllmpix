import { GenerateRequest, GenerateResult, ProviderModel, ProviderId } from "../types";

/**
 * Base class for all provider adapters.
 * Each provider must implement the generate method.
 * Model listing is optional and has a default implementation.
 */
export abstract class ProviderAdapter {
  abstract readonly providerId: ProviderId;
  abstract readonly name: string;

  /**
   * Generate images using this provider's API.
   * @param request - The generation request
   * @returns Generated images as base64 data URLs
   */
  abstract generate(request: GenerateRequest): Promise<GenerateResult>;

  /**
   * List available models from this provider.
   * Override in adapters that support dynamic model listing.
   * @param apiKey - The API key for authentication
   * @returns List of available models
   */
  async listModels(_apiKey: string): Promise<ProviderModel[]> {
    // Default implementation returns empty array
    // Providers that support listing should override this
    return [];
  }

  /**
   * Check if this adapter supports dynamic model listing.
   */
  supportsModelListing(): boolean {
    return false;
  }

  /**
   * Helper to build aspect ratio instruction for prompts.
   */
  protected buildAspectRatioInstruction(aspectRatio: string): string {
    if (aspectRatio === "1:1") return "";

    const orientation = aspectRatio === "9:16" || aspectRatio === "3:4"
      ? "portrait/vertical"
      : "landscape/horizontal";

    return ` Generate the image in ${aspectRatio} aspect ratio (${orientation} orientation).`;
  }

  /**
   * Helper to extract base64 from data URL.
   */
  protected extractBase64(dataUrl: string): { mimeType: string; base64: string } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mimeType: match[1], base64: match[2] };
  }

  /**
   * Helper to create data URL from base64.
   */
  protected createDataUrl(base64: string, mimeType: string = "image/png"): string {
    return `data:${mimeType};base64,${base64}`;
  }
}
