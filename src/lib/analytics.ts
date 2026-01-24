import posthog from "posthog-js";

// Check if PostHog is initialized
function isPostHogReady(): boolean {
  return typeof window !== "undefined" && posthog.__loaded;
}

// Image generation events
export function trackImageGenerated(props: {
  model: string;
  provider: string;
  mode: "text-to-image" | "image-to-image";
  aspectRatio: string;
  numberOfImages: number;
  success: boolean;
  error?: string;
}) {
  if (!isPostHogReady()) return;
  posthog.capture("image_generated", props);
}

// Model selection
export function trackModelSelected(props: {
  model: string;
  provider: string;
  previousModel?: string;
}) {
  if (!isPostHogReady()) return;
  posthog.capture("model_selected", props);
}

// Provider/API key configured
export function trackProviderConfigured(props: {
  provider: string;
}) {
  if (!isPostHogReady()) return;
  posthog.capture("provider_configured", props);
}

// Mode changed (text-to-image / image-to-image)
export function trackModeChanged(props: {
  mode: "text-to-image" | "image-to-image";
  previousMode: "text-to-image" | "image-to-image";
}) {
  if (!isPostHogReady()) return;
  posthog.capture("mode_changed", props);
}

// Image uploaded (for img2img)
export function trackImageUploaded(props: {
  count: number;
  source: "file" | "paste" | "drag-drop";
}) {
  if (!isPostHogReady()) return;
  posthog.capture("image_uploaded", props);
}

// Chat Studio events
export function trackChatStudioUsed(props: {
  model: string;
  provider: string;
  messageCount: number;
}) {
  if (!isPostHogReady()) return;
  posthog.capture("chat_studio_used", props);
}

// Image downloaded
export function trackImageDownloaded(props: {
  model: string;
  mode: "text-to-image" | "image-to-image";
}) {
  if (!isPostHogReady()) return;
  posthog.capture("image_downloaded", props);
}

// Lightbox opened
export function trackLightboxOpened() {
  if (!isPostHogReady()) return;
  posthog.capture("lightbox_opened");
}

// Settings opened
export function trackSettingsOpened() {
  if (!isPostHogReady()) return;
  posthog.capture("settings_opened");
}

// Aspect ratio changed
export function trackAspectRatioChanged(props: {
  aspectRatio: string;
  previousAspectRatio: string;
}) {
  if (!isPostHogReady()) return;
  posthog.capture("aspect_ratio_changed", props);
}
