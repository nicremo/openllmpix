"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
          "group flex items-center gap-1.5 text-sm font-medium transition-all disabled:opacity-50",
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
            <ChevronDown className="w-4 h-4 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={compact ? "start" : "end"}
        className="w-[280px] p-0 bg-[var(--bg-elevated)] border-[var(--border-default)] overflow-hidden relative"
      >
        <div className="max-h-[400px] overflow-y-auto py-1">
          {groupedModels.map((group, groupIndex) => (
            <div key={group.categoryId}>
              {groupIndex > 0 && <DropdownMenuSeparator className="bg-[var(--border-subtle)] my-1" />}
              <DropdownMenuLabel className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider py-2 px-3 text-[var(--text-tertiary)]">
                <span className="text-sm">{group.categoryInfo.icon}</span>
                <span>{group.categoryInfo.name}</span>
                <span className="ml-auto opacity-50">{group.models.length}</span>
              </DropdownMenuLabel>

              {group.models.map((model) => {
                const price = extractPriceFromDescription(model.description);
                const isFree = isFreeModel(model.id);
                const isSelected = selectedModel === model.id;

                return (
                  <DropdownMenuItem
                    key={model.id}
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onSelect={() => onModelChange(model.id)}
                    className={cn(
                      "flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-md mx-1",
                      "text-[var(--text-primary)] transition-all duration-150",
                      "hover:bg-[var(--bg-surface)] focus:bg-[var(--bg-surface)]",
                      isSelected && "bg-[var(--accent-secondary)]/10 border-l-2 border-[var(--accent-secondary)] pl-2.5"
                    )}
                  >
                    <span className="truncate pr-2">{model.name}</span>
                    {isFree ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                        Free
                      </span>
                    ) : price ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-tertiary)]">
                        {price}
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))}
        </div>
        {/* Bottom fade indicator for scroll */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[var(--bg-elevated)] to-transparent pointer-events-none" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
