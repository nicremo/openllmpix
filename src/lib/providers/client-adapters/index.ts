/**
 * Client-side provider adapters for direct browser API calls.
 *
 * SECURITY: These adapters make direct CORS calls to provider APIs,
 * so API keys NEVER pass through the application server.
 * Keys are stored in localStorage and sent directly to providers.
 *
 * All providers in this app support CORS - no server proxy needed!
 */

import { ProviderId } from "../types";
import { ClientProviderAdapter } from "./base";
import { ClientOpenRouterAdapter } from "./openrouter";
import { ClientGoogleAIStudioAdapter } from "./google-ai-studio";
import { ClientFalAdapter } from "./fal";

// Registry of client-side adapters - ALL providers support CORS
const clientAdapters: Record<ProviderId, ClientProviderAdapter> = {
  openrouter: new ClientOpenRouterAdapter(),
  "google-ai-studio": new ClientGoogleAIStudioAdapter(),
  fal: new ClientFalAdapter(),
};

/**
 * Get the client-side adapter for a provider.
 * All providers support client-side calls.
 */
export function getClientAdapter(providerId: ProviderId): ClientProviderAdapter {
  const adapter = clientAdapters[providerId];
  if (!adapter) {
    throw new Error(`No client adapter for provider: ${providerId}`);
  }
  return adapter;
}

/**
 * Check if a provider supports direct client-side calls.
 * All providers in this app support CORS.
 */
export function supportsClientSide(providerId: ProviderId): boolean {
  return providerId in clientAdapters;
}

/**
 * Get all providers that support client-side calls.
 */
export function getClientSupportedProviders(): ProviderId[] {
  return Object.keys(clientAdapters) as ProviderId[];
}

// Re-export types and adapters
export { ClientProviderAdapter } from "./base";
export { ClientOpenRouterAdapter } from "./openrouter";
export { ClientGoogleAIStudioAdapter } from "./google-ai-studio";
export { ClientFalAdapter } from "./fal";
