"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProviderId, ProviderModel } from "@/lib/providers/types";
import { getProvider } from "@/lib/providers/registry";
import CategorizedModelSelector from "./CategorizedModelSelector";

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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-2">
        <span className="block text-[11px] font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
          Model
        </span>
        <div className="h-10 rounded-xl animate-pulse bg-[var(--bg-elevated)] border border-[var(--border-default)]" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="block text-[11px] font-semibold tracking-wide uppercase text-[var(--text-tertiary)]">
            Model
          </span>
          {provider === "openrouter" && apiKey && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-widest">
              OpenRouter Active
            </span>
          )}
        </div>
        {isLive && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Live
          </span>
        )}
      </div>

      <CategorizedModelSelector
        models={models}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        disabled={models.length === 0}
      />

      {error && (
        <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-70" />
          {error} - Using cached models
        </p>
      )}
    </div>
  );
}
