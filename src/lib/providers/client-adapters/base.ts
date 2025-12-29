/**
 * Base class for client-side provider adapters.
 * These adapters make direct API calls from the browser,
 * so API keys never pass through the application server.
 */

import { GenerateRequest, GenerateResult } from "../types";

export abstract class ClientProviderAdapter {
  abstract readonly providerId: string;
  abstract readonly name: string;
  abstract readonly supportsCORS: boolean;

  abstract generate(request: GenerateRequest): Promise<GenerateResult>;

  /**
   * Extract base64 data and mime type from a data URL
   */
  protected extractBase64(dataUrl: string): { base64: string; mimeType: string } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mimeType: match[1], base64: match[2] };
  }

  /**
   * Create a data URL from base64 data
   */
  protected createDataUrl(base64: string, mimeType: string): string {
    // Remove any existing data URL prefix
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
    return `data:${mimeType};base64,${cleanBase64}`;
  }

  /**
   * Build aspect ratio instruction for prompt
   */
  protected buildAspectRatioInstruction(aspectRatio: string): string {
    const ratioDescriptions: Record<string, string> = {
      "1:1": "square format",
      "16:9": "widescreen landscape format (16:9)",
      "9:16": "vertical portrait format (9:16)",
      "4:3": "standard landscape format (4:3)",
      "3:4": "portrait format (3:4)",
    };
    const description = ratioDescriptions[aspectRatio] || "standard format";
    return ` Generate the image in ${description}.`;
  }
}
