"use client";

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
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog/types";

interface BlogFilterProps {
  category: BlogCategory | "all";
  sortBy: "newest" | "oldest";
  onCategoryChange: (category: BlogCategory | "all") => void;
  onSortChange: (sort: "newest" | "oldest") => void;
}

export default function BlogFilter({
  category,
  sortBy,
  onCategoryChange,
  onSortChange,
}: BlogFilterProps) {
  const selectedCategory =
    category === "all"
      ? { name: "All Categories", icon: "📁" }
      : BLOG_CATEGORIES.find((c) => c.id === category) || { name: "All", icon: "📁" };

  return (
    <div className="flex items-center gap-3">
      {/* Category Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          <span>{selectedCategory.icon}</span>
          <span>{selectedCategory.name}</span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[200px]"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          <DropdownMenuLabel
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Filter by Category
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={category}
            onValueChange={(v) => onCategoryChange(v as BlogCategory | "all")}
          >
            <DropdownMenuRadioItem
              value="all"
              className="cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="mr-2">📁</span>
              All Categories
            </DropdownMenuRadioItem>
            {BLOG_CATEGORIES.map((cat) => (
              <DropdownMenuRadioItem
                key={cat.id}
                value={cat.id}
                className="cursor-pointer"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          <span>{sortBy === "newest" ? "Newest" : "Oldest"}</span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[150px]"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          <DropdownMenuLabel
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Sort by
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(v) => onSortChange(v as "newest" | "oldest")}
          >
            <DropdownMenuRadioItem
              value="newest"
              className="cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              Newest first
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="oldest"
              className="cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              Oldest first
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
