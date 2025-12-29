import { ProviderConfig, ProviderId, ApiKeyConfig } from "./types";

// Only CORS-enabled providers - all execution happens in the browser
export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access multiple AI models through a single API",
    category: "image",
    apiKeyPlaceholder: "sk-or-v1-...",
    apiKeyPrefix: "sk-or-",
    helpUrl: "https://openrouter.ai/keys",
    helpText: "Get your API key from OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    supportsModelListing: true,
    defaultModel: "google/gemini-2.0-flash-exp:free",
    models: [
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash (Free)",
        description: "Google's latest multimodal model with image generation",
        capabilities: { textToImage: true, imageToImage: true },
      },
      {
        id: "google/gemini-2.5-flash-preview-05-20",
        name: "Gemini 2.5 Flash Preview",
        capabilities: { textToImage: true, imageToImage: true },
      },
    ],
  },

  "google-ai-studio": {
    id: "google-ai-studio",
    name: "Google AI Studio",
    description: "Direct access to Gemini, Imagen and Nano Banana models",
    category: "image",
    apiKeyPlaceholder: "AIza...",
    apiKeyPrefix: "AIza",
    helpUrl: "https://aistudio.google.com/app/apikey",
    helpText: "Get your API key from Google AI Studio",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    supportsModelListing: false,
    defaultModel: "nano-banana-pro",
    models: [
      {
        id: "nano-banana-pro",
        name: "Nano Banana Pro",
        description: "Google's most advanced image model built on Gemini 3 Pro",
        capabilities: { textToImage: true, imageToImage: true },
      },
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash Experimental",
        description: "Fast multimodal model with native image generation",
        capabilities: { textToImage: true, imageToImage: true },
      },
      {
        id: "imagen-3.0-generate-002",
        name: "Imagen 3",
        description: "Google's dedicated image generation model",
        capabilities: { textToImage: true, imageToImage: false },
      },
    ],
  },

  fal: {
    id: "fal",
    name: "fal.ai",
    description: "Serverless AI with FLUX and fast inference",
    category: "image",
    apiKeyPlaceholder: "...",
    helpUrl: "https://fal.ai/dashboard/keys",
    helpText: "Get your API key from fal.ai",
    baseUrl: "https://fal.run",
    supportsModelListing: false,
    defaultModel: "fal-ai/flux/schnell",
    models: [
      {
        id: "fal-ai/flux-pro/v1.1",
        name: "FLUX Pro 1.1",
        description: "Latest FLUX Pro model",
        capabilities: { textToImage: true, imageToImage: false },
      },
      {
        id: "fal-ai/flux/schnell",
        name: "FLUX Schnell",
        description: "Fast 4-step FLUX",
        capabilities: { textToImage: true, imageToImage: false },
      },
      {
        id: "fal-ai/flux/dev",
        name: "FLUX Dev",
        description: "Development FLUX model",
        capabilities: { textToImage: true, imageToImage: false },
      },
      {
        id: "fal-ai/flux-lora",
        name: "FLUX LoRA",
        description: "FLUX with LoRA support",
        capabilities: { textToImage: true, imageToImage: false },
      },
    ],
  },
};

// Get a specific provider config
export function getProvider(id: ProviderId): ProviderConfig {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return provider;
}

// Get all providers as array
export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}

// Get providers by category
export function getProvidersByCategory(
  category: "image" | "video" | "both"
): ProviderConfig[] {
  return getAllProviders().filter(
    (p) => p.category === category || p.category === "both"
  );
}

// Validate API key format
export function validateApiKey(provider: ProviderId, apiKey: string): boolean {
  if (!apiKey?.trim()) return false;

  const config = PROVIDERS[provider];
  if (!config) return false;

  if (config.apiKeyPrefix) {
    return apiKey.startsWith(config.apiKeyPrefix);
  }

  return apiKey.length >= 10;
}

// Storage keys
const STORAGE_KEY = "api_config_v2"; // v2 = encrypted
const LEGACY_STORAGE_KEY = "api_config"; // v1 = unencrypted (for migration)

// Get stored API config from localStorage (sync version for initial load)
// Note: For encrypted storage, use getStoredApiConfigAsync
export function getStoredApiConfig(): ApiKeyConfig | null {
  if (typeof window === "undefined") return null;

  try {
    // Try v2 (encrypted) first - we'll decrypt async separately
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Return placeholder - real decryption happens async
      const parsed = JSON.parse(stored);
      if (parsed.encrypted) {
        // Return the encrypted data marker - caller should use async version
        return null;
      }
      return parsed as ApiKeyConfig;
    }

    // Fall back to legacy unencrypted storage
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      return JSON.parse(legacy) as ApiKeyConfig;
    }

    return null;
  } catch {
    return null;
  }
}

// Get stored API config with decryption (async)
export async function getStoredApiConfigAsync(): Promise<ApiKeyConfig | null> {
  if (typeof window === "undefined") return null;

  try {
    // Check for encrypted storage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.encrypted && parsed.data) {
        // Dynamic import to avoid SSR issues
        const { decrypt, isCryptoAvailable } = await import("../crypto");
        if (isCryptoAvailable()) {
          const decrypted = await decrypt(parsed.data);
          return JSON.parse(decrypted) as ApiKeyConfig;
        }
      }
      // Not encrypted, return directly
      return parsed as ApiKeyConfig;
    }

    // Fall back to legacy unencrypted storage and migrate
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const config = JSON.parse(legacy) as ApiKeyConfig;
      // Migrate to encrypted storage
      await saveApiConfigAsync(config);
      // Remove legacy storage
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return config;
    }

    return null;
  } catch {
    return null;
  }
}

// Save API config to localStorage (sync version - no encryption)
export function saveApiConfig(config: ApiKeyConfig): void {
  if (typeof window === "undefined") return;
  // For sync save, store unencrypted (will be migrated on next async load)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// Save API config with encryption (async)
export async function saveApiConfigAsync(config: ApiKeyConfig): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const { encrypt, isCryptoAvailable } = await import("../crypto");

    if (isCryptoAvailable()) {
      const encrypted = await encrypt(JSON.stringify(config));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        encrypted: true,
        data: encrypted,
      }));
    } else {
      // Fallback to unencrypted if crypto not available
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  } catch {
    // Fallback to unencrypted
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

// Check if API key is configured
export function isApiKeyConfigured(): boolean {
  const config = getStoredApiConfig();
  return !!(config?.apiKey && config?.provider);
}

// Async version
export async function isApiKeyConfiguredAsync(): Promise<boolean> {
  const config = await getStoredApiConfigAsync();
  return !!(config?.apiKey && config?.provider);
}

// Re-export ApiKeyConfig type for convenience
export type { ApiKeyConfig } from "./types";
