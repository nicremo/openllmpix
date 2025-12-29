import { ProviderId } from "../types";
import { ProviderAdapter } from "./base";
import { OpenRouterAdapter } from "./openrouter";
import { GoogleAIStudioAdapter } from "./google";
import { FalAdapter } from "./fal";

// Registry of all available adapters (only CORS-enabled providers)
// Note: These server-side adapters are kept for legacy/fallback purposes
// but the app primarily uses client-side adapters now
const adapters: Record<ProviderId, ProviderAdapter> = {
  openrouter: new OpenRouterAdapter(),
  "google-ai-studio": new GoogleAIStudioAdapter(),
  fal: new FalAdapter(),
};

/**
 * Get the adapter for a specific provider.
 * @throws Error if provider is not supported
 */
export function getAdapter(providerId: ProviderId): ProviderAdapter {
  const adapter = adapters[providerId];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }
  return adapter;
}

/**
 * Check if a provider has an adapter implementation.
 */
export function hasAdapter(providerId: ProviderId): boolean {
  return providerId in adapters;
}

/**
 * Get all available adapters.
 */
export function getAllAdapters(): ProviderAdapter[] {
  return Object.values(adapters);
}

// Re-export base class and types
export { ProviderAdapter } from "./base";
