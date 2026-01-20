"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium transition-all disabled:opacity-50",
          "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
          compact
            ? "px-3 py-2.5 bg-transparent"
            : "px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)]"
        )}
      >
        {compact ? (
          <>
            <span className="max-w-[100px] truncate">
              {selectedModelInfo?.name || "Select Model"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </>
        ) : (
          <>
            <span>{selectedModelInfo?.name || "Select Model"}</span>
            <ChevronDown className="w-4 h-4 opacity-60 transition-transform duration-200" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={compact ? "start" : "end"}
        className="w-[280px] max-h-[400px] overflow-y-auto bg-[var(--bg-elevated)] border-[var(--border-default)]"
      >
        <DropdownMenuRadioGroup value={selectedModel} onValueChange={onModelChange}>
          {groupedModels.map((group, groupIndex) => (
            <div key={group.categoryId}>
              {groupIndex > 0 && <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />}
              <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold py-2 text-[var(--text-secondary)]">
                <span>{group.categoryInfo.icon}</span>
                <span>{group.categoryInfo.name}</span>
              </DropdownMenuLabel>

              {group.models.map((model) => {
                const price = extractPriceFromDescription(model.description);
                const isFree = isFreeModel(model.id);

                return (
                  <DropdownMenuRadioItem
                    key={model.id}
                    value={model.id}
                    className={cn(
                      "flex items-center justify-between cursor-pointer py-2.5 px-3",
                      "text-[var(--text-primary)]",
                      "transition-colors duration-150",
                      "hover:bg-[var(--bg-surface)] focus:bg-[var(--bg-surface)]",
                      "data-[state=checked]:bg-[var(--bg-surface)]"
                    )}
                  >
                    <span className="truncate pr-2">{model.name}</span>
                    {isFree ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--success)] text-black">
                        FREE
                      </span>
                    ) : price ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-tertiary)]">
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
