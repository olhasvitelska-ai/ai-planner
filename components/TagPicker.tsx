"use client";

import { useState, useRef, useEffect } from "react";

const S = {
  surface:  "#3B404C",
  surface2: "#2E3340",
  border:   "rgba(255,255,255,0.08)",
  text:     "rgba(255,255,255,0.95)",
  muted:    "rgba(255,255,255,0.50)",
  caption:  "rgba(255,255,255,0.30)",
  red:      "#FD3433",
};

interface Props {
  tags: string[];
  allTags: string[];          // globally known tags for suggestions
  onChange: (tags: string[]) => void;
  compact?: boolean;
}

export default function TagPicker({ tags, allTags, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function add(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  }

  const suggestions = allTags
    .filter((t) => !tags.includes(t) && t.includes(input.toLowerCase()))
    .slice(0, 6);

  return (
    <div ref={containerRef} className="relative">
      {/* Tag chips row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: "rgba(253,52,51,0.15)", color: S.red, border: "1px solid rgba(253,52,51,0.30)" }}
          >
            #{tag}
            <button
              onClick={() => remove(tag)}
              className="leading-none opacity-70 hover:opacity-100"
              style={{ fontSize: "0.85rem" }}
            >×</button>
          </span>
        ))}

        {/* Add button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-2 py-0.5 rounded-full text-xs transition-colors"
          style={{
            backgroundColor: open ? "rgba(253,52,51,0.15)" : "rgba(255,255,255,0.06)",
            color: open ? S.red : S.caption,
            border: `1px solid ${open ? "rgba(253,52,51,0.30)" : S.border}`,
          }}
        >
          {compact && tags.length === 0 ? "＋ тег" : "＋"}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 z-40 mt-1.5 rounded-lg p-2 flex flex-col gap-1 min-w-[200px]"
          style={{ backgroundColor: "#2E3340", border: `1px solid ${S.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.40)" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Назва категорії…"
            className="w-full px-2 py-1.5 rounded-md text-xs focus:outline-none"
            style={{ backgroundColor: S.surface, color: S.text, border: `1px solid ${S.border}`, caretColor: S.red }}
          />

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { add(s); }}
                  className="text-left px-2 py-1.5 rounded-md text-xs transition-colors"
                  style={{ color: S.muted }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = S.surface)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  #{s}
                </button>
              ))}
            </div>
          )}

          {input.trim() && !tags.includes(input.trim().toLowerCase()) && (
            <button
              onClick={() => { add(input); setOpen(false); }}
              className="text-left px-2 py-1.5 rounded-md text-xs mt-0.5"
              style={{ backgroundColor: "rgba(253,52,51,0.12)", color: S.red }}
            >
              ＋ Створити «{input.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}
