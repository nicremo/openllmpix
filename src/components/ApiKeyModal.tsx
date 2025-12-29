"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getAllProviders,
  getStoredApiConfig,
  getStoredApiConfigAsync,
  saveApiConfig,
  saveApiConfigAsync,
} from "@/lib/providers/registry";
import { ProviderId, ApiKeyConfig, ProviderConfig } from "@/lib/providers/types";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: ApiKeyConfig) => void;
}

// Re-export for backward compatibility
export type { ApiKeyConfig };
export type ApiProvider = ProviderId;
export { getStoredApiConfig, getStoredApiConfigAsync, saveApiConfig, saveApiConfigAsync };
export function isApiKeyConfigured(): boolean {
  const config = getStoredApiConfig();
  return !!(config?.apiKey && config?.provider);
}

export default function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = getAllProviders();

  // Load existing config on mount
  useEffect(() => {
    if (isOpen) {
      const config = getStoredApiConfig();
      if (config) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial config load, intentional
        setSelectedProvider(config.provider);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial config load, intentional
        setApiKey(config.apiKey);
      }
    }
  }, [isOpen]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setError(null);
    setLoading(false);
    setShowKey(false);
    onClose();
  }, [onClose]);

  // Handle save (async for encrypted storage)
  const handleSave = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: ApiKeyConfig = {
        provider: selectedProvider,
        apiKey: apiKey.trim(),
      };

      // Use async encrypted save
      await saveApiConfigAsync(config);

      if (onSave) {
        onSave(config);
      }

      setTimeout(() => {
        handleClose();
      }, 300);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save API key";
      setError(errorMessage);
      setLoading(false);
    }
  }, [apiKey, selectedProvider, onSave, handleClose]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !loading) {
        handleSave();
      }
    },
    [handleSave, loading]
  );

  if (!isOpen) return null;

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "fadeIn 150ms ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          animation: "slideUp 200ms ease-out",
        }}
      >
        {/* Header */}
        <div className="px-10 py-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="#000"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                API Provider Setup
              </h2>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Choose your image generation provider
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-10 py-8 max-h-[65vh] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg text-sm flex items-start gap-3"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--error)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
              Select Provider
            </label>
            <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
              {providers.map((provider: ProviderConfig) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className="w-full p-4 rounded-lg border text-left transition-all hover:opacity-90"
                  style={{
                    background: selectedProvider === provider.id ? "var(--bg-elevated)" : "var(--bg-base)",
                    borderColor: selectedProvider === provider.id ? "var(--accent-secondary)" : "var(--border-default)",
                    borderWidth: selectedProvider === provider.id ? "2px" : "1px",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                          {provider.name}
                        </span>
                        {selectedProvider === provider.id && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "var(--accent-secondary)" }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="#fff" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {provider.supportsModelListing && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "var(--bg-surface)", color: "var(--success)" }}
                          >
                            Live Models
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {provider.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                API Key
              </label>
              {currentProvider && (
                <a
                  href={currentProvider.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:opacity-80"
                  style={{ color: "var(--accent-secondary)" }}
                >
                  {currentProvider.helpText}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentProvider?.apiKeyPlaceholder || "Enter your API key"}
                disabled={loading}
                className="w-full h-12 px-4 pr-12 rounded-lg border text-sm font-mono disabled:opacity-50"
                style={{
                  background: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-tertiary)" }}
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Video Coming Soon Notice */}
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              background: "var(--bg-base)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--bg-elevated)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-tertiary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Video Generation
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--accent-primary)", color: "var(--accent-foreground)" }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Runway, Kling, Pika, and more video AI providers
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading || !apiKey.trim()}
            className="w-full h-12 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#000",
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save &amp; Continue
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          className="px-10 py-4 text-center border-t"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-subtle)",
          }}
        >
          <p className="text-xs flex items-center justify-center gap-2" style={{ color: "var(--text-tertiary)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your API key is stored securely in your browser
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
