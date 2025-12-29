"use client";

import { useState, useEffect, useCallback } from "react";
import { ProviderId, ProviderModel } from "@/lib/providers/types";
import { getProvider } from "@/lib/providers/registry";

interface ModelSelectorProps {
  provider: ProviderId;
  apiKey: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  mode?: "text-to-image" | "image-to-image";
}

export default function ModelSelector({
  provider,
  apiKey,
  selectedModel,
  onModelChange,
  mode = "text-to-image",
}: ModelSelectorProps) {
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Load models when provider or apiKey changes
  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }

      const res = await fetch(`/api/models?provider=${provider}`, { headers });

      if (!res.ok) {
        throw new Error("Failed to load models");
      }

      const data = await res.json();
      let fetchedModels: ProviderModel[] = data.models || [];

      // Filter models based on mode capability
      if (mode === "image-to-image") {
        fetchedModels = fetchedModels.filter((m) => m.capabilities?.imageToImage !== false);
      }

      setModels(fetchedModels);
      setIsLive(data.source === "live");

      // Auto-select default model if none selected or current not in list
      if (fetchedModels.length > 0) {
        const currentModelExists = fetchedModels.some((m) => m.id === selectedModel);
        if (!selectedModel || !currentModelExists) {
          const defaultModel = data.defaultModel || fetchedModels[0].id;
          const modelToSelect = fetchedModels.find((m) => m.id === defaultModel)?.id || fetchedModels[0].id;
          onModelChange(modelToSelect);
        }
      }
    } catch (err) {
      console.error("Failed to load models:", err);
      setError("Could not load models");

      // Fallback to static models from registry
      try {
        const config = getProvider(provider);
        let staticModels = config.models;
        if (mode === "image-to-image") {
          staticModels = staticModels.filter((m) => m.capabilities?.imageToImage !== false);
        }
        setModels(staticModels);
        if (staticModels.length > 0 && !selectedModel) {
          onModelChange(config.defaultModel || staticModels[0].id);
        }
      } catch {
        // Provider not found, leave empty
      }
    } finally {
      setLoading(false);
    }
  }, [provider, apiKey, mode, selectedModel, onModelChange]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  if (loading) {
    return (
      <div className="space-y-2">
        <label
          className="block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Model
        </label>
        <div
          className="h-10 rounded-lg animate-pulse"
          style={{ background: "var(--bg-base)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          className="block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Model
        </label>
        {isLive && (
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: "var(--bg-elevated)", color: "var(--success)" }}
          >
            Live
          </span>
        )}
      </div>

      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border text-sm appearance-none cursor-pointer"
        style={{
          background: "var(--bg-base)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.5em 1.5em",
          paddingRight: "2.5rem",
        }}
        disabled={models.length === 0}
      >
        {models.length === 0 ? (
          <option value="">No models available</option>
        ) : (
          models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
              {model.pricing?.perImage ? ` ($${model.pricing.perImage.toFixed(4)}/img)` : ""}
            </option>
          ))
        )}
      </select>

      {error && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {error} - Using cached models
        </p>
      )}

      {selectedModel && models.length > 0 && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {(() => {
            const desc = models.find((m) => m.id === selectedModel)?.description || "";
            return desc.length > 80 ? desc.slice(0, 80) + "..." : desc;
          })()}
        </p>
      )}
    </div>
  );
}
