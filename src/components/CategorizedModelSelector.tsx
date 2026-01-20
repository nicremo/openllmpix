"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  groupModelsByCategory,
  extractPriceFromDescription,
  isFreeModel,
  type ModelWithCategory,
} from "@/lib/providers/model-categories";

interface CategorizedModelSelectorProps {
  models: ModelWithCategory[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

export default function CategorizedModelSelector({
  models,
  selectedModel,
  onModelChange,
  compact = false,
  disabled = false,
}: CategorizedModelSelectorProps) {
  const groupedModels = useMemo(() => groupModelsByCategory(models), [models]);
  const selectedModelInfo = useMemo(
    () => models.find((m) => m.id === selectedModel),
    [models, selectedModel]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          compact
            ? "px-3 py-2.5 hover:bg-[var(--bg-elevated)]"
            : "px-3 py-2 rounded-lg border hover:bg-[var(--bg-elevated)]"
        }`}
        style={{
          background: compact ? "transparent" : "var(--bg-surface)",
          borderColor: compact ? "transparent" : "var(--border-default)",
          color: "var(--text-primary)",
        }}
      >
        {compact ? (
          <>
            <span className="max-w-[100px] truncate">
              {selectedModelInfo?.name || "Select Model"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </>
        ) : (
          <>
            <span>{selectedModelInfo?.name || "Select Model"}</span>
            <ChevronDown className="w-4 h-4 opacity-60" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={compact ? "start" : "end"}
        className="w-[280px] max-h-[400px] overflow-y-auto"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <DropdownMenuRadioGroup value={selectedModel} onValueChange={onModelChange}>
          {groupedModels.map((group, groupIndex) => (
            <div key={group.categoryId}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold py-2">
                <span>{group.categoryInfo.icon}</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {group.categoryInfo.name}
                </span>
              </DropdownMenuLabel>

              {group.models.map((model) => {
                const price = extractPriceFromDescription(model.description);
                const isFree = isFreeModel(model.id);

                return (
                  <DropdownMenuRadioItem
                    key={model.id}
                    value={model.id}
                    className="flex items-center justify-between cursor-pointer py-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="truncate pr-2">{model.name}</span>
                    {isFree ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--success)",
                          color: "#000",
                        }}
                      >
                        FREE
                      </span>
                    ) : price ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--bg-surface)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {price}
                      </span>
                    ) : null}
                  </DropdownMenuRadioItem>
                );
              })}
            </div>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
