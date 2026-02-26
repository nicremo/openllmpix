"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronDown, Check, Sparkles, Zap, Bot, Box, Briefcase, DraftingCompass, Palette, ChevronRight, Cpu } from "lucide-react";
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
  getModelCategory,
  type ModelWithCategory,
} from "@/lib/providers/model-categories";

interface CategorizedModelSelectorProps {
  models: ModelWithCategory[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

// Map string icon IDs to actual Lucide icons
const IconMap: Record<string, React.ReactNode> = {
  "google": <Sparkles className="w-4 h-4" />,
  "bfl": <Zap className="w-4 h-4" />,
  "openai": <Bot className="w-4 h-4" />,
  "bytedance": <Briefcase className="w-4 h-4" />,
  "ideogram": <DraftingCompass className="w-4 h-4" />,
  "recraft": <Palette className="w-4 h-4" />,
  "fal": <Cpu className="w-4 h-4" />,
  "other": <Box className="w-4 h-4" />,
};

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
  
  const selectedCategoryInfo = selectedModelInfo ? getModelCategory(selectedModelInfo.id) : null;

  // Track the currently expanded category
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Auto-expand the category of the initially selected model
  useEffect(() => {
    if (selectedModelInfo) {
      const initialCategoryId = selectedModelInfo.id.split('/')[0];
      setExpandedCategory(initialCategoryId);
    } else if (groupedModels.length > 0 && !expandedCategory) {
      setExpandedCategory(groupedModels[0].categoryId);
    }
  }, [selectedModelInfo, groupedModels, expandedCategory]);

  const toggleCategory = (categoryId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "group flex items-center justify-between gap-2 text-sm font-medium transition-all disabled:opacity-50",
          "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] ring-offset-[var(--bg-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1 text-left w-full",
          compact
            ? "px-3 py-2.5 bg-transparent"
            : "px-3.5 py-2.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--border-strong)] shadow-sm"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedCategoryInfo && (
            <span className="shrink-0 text-[var(--text-secondary)]">
              {IconMap[selectedCategoryInfo.iconId] || <Box className="w-4 h-4" />}
            </span>
          )}
          <span className="truncate">
            {selectedModelInfo?.name || "Select Model"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 shrink-0 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={compact ? "start" : "end"}
        sideOffset={6}
        className="w-[340px] p-0 bg-[var(--bg-elevated)] border-[var(--border-default)] shadow-xl shadow-black/20 rounded-xl overflow-hidden relative"
      >
        <div className="max-h-[420px] overflow-y-auto p-1.5 scrollbar-thin">
          {groupedModels.map((group, groupIndex) => {
            const isExpanded = expandedCategory === group.categoryId;
            
            return (
              <div key={group.categoryId} className="mb-1 last:mb-0">
                {groupIndex > 0 && <div className="h-px bg-[var(--border-subtle)] my-1.5 mx-2" />}
                
                <div 
                  className={cn(
                    "sticky top-0 z-10 bg-[var(--bg-elevated)] flex items-center cursor-pointer gap-2 py-2 px-3 transition-colors rounded-md -mx-1.5 px-3",
                    "hover:bg-[var(--bg-surface)] select-none"
                  )}
                  onPointerDown={(e) => toggleCategory(group.categoryId, e)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <ChevronRight 
                    className={cn(
                      "w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200", 
                      isExpanded && "rotate-90"
                    )} 
                  />
                  <span className="text-[var(--text-secondary)] shrink-0">
                    {IconMap[group.categoryInfo.iconId] || <Box className="w-4 h-4" />}
                  </span>
                  <span className="text-[12px] font-semibold tracking-wide text-[var(--text-secondary)]">{group.categoryInfo.name}</span>
                  <span className="ml-auto bg-[var(--bg-surface)] px-1.5 py-0.5 rounded text-[10px] font-medium opacity-70 border border-[var(--border-default)]">
                    {group.models.length}
                  </span>
                </div>

                {/* Collapsible Content */}
                <div className={cn(
                  "grid transition-all duration-200 ease-in-out",
                  isExpanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                )}>
                  <div className="overflow-hidden space-y-0.5 ml-3 pl-1.5 border-l border-[var(--border-subtle)]">
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
                            "relative flex items-start gap-2.5 cursor-pointer py-2 px-2.5 rounded-lg",
                            "text-[var(--text-primary)] transition-colors duration-150",
                            "hover:bg-[var(--bg-surface)] focus:bg-[var(--bg-surface)]",
                            isSelected && "bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/15 focus:bg-[var(--accent-secondary)]/15"
                          )}
                        >
                          <div className="mt-0.5 flex items-center justify-center w-4 h-4 shrink-0">
                            {isSelected ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] opacity-30 hidden" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={cn(
                                "text-[13px] font-medium truncate",
                                isSelected && "font-semibold"
                              )}>
                                {model.name}
                              </span>
                              
                              <div className="shrink-0">
                                {isFree ? (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                                    FREE
                                  </span>
                                ) : price ? (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                                    {price}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            
                            {model.description && (
                              <p className="text-[11px] text-[var(--text-tertiary)] leading-snug line-clamp-1 pr-1 truncate">
                                {model.description.split(" • ")[0] || model.description}
                              </p>
                            )}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Bottom fade indicator for scroll */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[var(--bg-elevated)] to-transparent pointer-events-none rounded-b-xl" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
