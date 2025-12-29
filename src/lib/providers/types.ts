// Provider IDs - only CORS-enabled providers for client-side execution
export type ProviderId =
  | "openrouter"
  | "google-ai-studio"
  | "fal";

// Model capabilities
export interface ModelCapabilities {
  textToImage: boolean;
  imageToImage: boolean;
  aspectRatios?: string[];
  maxImages?: number;
}

// Model definition
export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
  capabilities: ModelCapabilities;
  pricing?: {
    perImage?: number;
    perRequest?: number;
  };
}

// Provider configuration
export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  category: "image" | "video" | "both";
  apiKeyPlaceholder: string;
  apiKeyPrefix?: string;
  helpUrl: string;
  helpText: string;
  baseUrl: string;
  supportsModelListing: boolean;
  defaultModel?: string;
  models: ProviderModel[];
  comingSoon?: boolean;
}

// API Key configuration stored in localStorage
export interface ApiKeyConfig {
  provider: ProviderId;
  apiKey: string;
  selectedModel?: string;
}

// Generation request
export interface GenerateRequest {
  prompt: string;
  aspectRatio: string;
  model: string;
  apiKey: string;
  provider: ProviderId;
  mode: "text-to-image" | "image-to-image";
  referenceImages?: string[];
  numberOfImages?: number;
}

// Generation result
export interface GenerateResult {
  images: string[];
  model: string;
  provider: ProviderId;
}

// Models API response
export interface ModelsResponse {
  models: ProviderModel[];
  source: "live" | "static";
}
