// Model category definitions for categorized dropdowns
export const MODEL_CATEGORIES: Record<string, { name: string; icon: string }> = {
  "google": { name: "Google Gemini", icon: "✨" },
  "black-forest-labs": { name: "FLUX.2", icon: "⚡" },
  "openai": { name: "OpenAI", icon: "🤖" },
  "bytedance-seed": { name: "ByteDance", icon: "🌱" },
  "ideogram-ai": { name: "Ideogram", icon: "🔤" },
  "recraft-ai": { name: "Recraft", icon: "🎨" },
  "sourceful": { name: "Other", icon: "📦" },
};

export interface CategoryInfo {
  name: string;
  icon: string;
}

// Get category info from model ID (e.g., "google/gemini-2.5-flash" -> { name: "Google Gemini", icon: "✨" })
export function getModelCategory(modelId: string): CategoryInfo {
  const prefix = modelId.split("/")[0];
  return MODEL_CATEGORIES[prefix] || { name: "Other", icon: "📦" };
}

// Extract display price from model description (e.g., "~$0.039/img" -> "$0.04")
export function extractPriceFromDescription(description?: string): string | null {
  if (!description) return null;

  // Match patterns like ~$0.039/img, $0.03/img, ~$0.134/img
  const match = description.match(/~?\$(\d+\.?\d*)/);
  if (match) {
    const price = parseFloat(match[1]);
    // Round to 2 decimal places for display
    return `$${price.toFixed(2)}`;
  }
  return null;
}

// Check if model is free tier
export function isFreeModel(modelId: string): boolean {
  return modelId.includes(":free");
}

export interface ModelWithCategory {
  id: string;
  name: string;
  description?: string;
  capabilities?: {
    textToImage?: boolean;
    imageToImage?: boolean;
  };
}

export interface GroupedCategory {
  categoryId: string;
  categoryInfo: CategoryInfo;
  models: ModelWithCategory[];
}

// Group models by their category prefix
export function groupModelsByCategory<T extends ModelWithCategory>(models: T[]): GroupedCategory[] {
  const groups = new Map<string, { categoryInfo: CategoryInfo; models: T[] }>();

  for (const model of models) {
    const prefix = model.id.split("/")[0];
    const categoryInfo = MODEL_CATEGORIES[prefix] || { name: "Other", icon: "📦" };

    if (!groups.has(prefix)) {
      groups.set(prefix, { categoryInfo, models: [] });
    }
    groups.get(prefix)!.models.push(model);
  }

  // Convert to array and maintain order based on MODEL_CATEGORIES keys
  const categoryOrder = Object.keys(MODEL_CATEGORIES);
  const result: GroupedCategory[] = [];

  // First add categories in defined order
  for (const categoryId of categoryOrder) {
    const group = groups.get(categoryId);
    if (group) {
      result.push({
        categoryId,
        categoryInfo: group.categoryInfo,
        models: group.models,
      });
      groups.delete(categoryId);
    }
  }

  // Then add any remaining categories (not in MODEL_CATEGORIES)
  for (const [categoryId, group] of groups) {
    result.push({
      categoryId,
      categoryInfo: group.categoryInfo,
      models: group.models,
    });
  }

  return result;
}
