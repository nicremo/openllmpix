"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface BlogSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function BlogSearch({
  value,
  onChange,
  placeholder = "Search posts...",
}: BlogSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div
      className="relative flex items-center rounded-lg border"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <Search
        className="absolute left-3 w-4 h-4"
        style={{ color: "var(--text-tertiary)" }}
      />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm focus:outline-none"
        style={{ color: "var(--text-primary)" }}
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue("");
            onChange("");
          }}
          className="absolute right-3 p-0.5 rounded hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <X
            className="w-4 h-4"
            style={{ color: "var(--text-tertiary)" }}
          />
        </button>
      )}
    </div>
  );
}
