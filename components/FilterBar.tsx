"use client";

import { Priority, Task, todayMidnight } from "@/lib/store";

export interface Filters {
  priority: Priority | null;
  tag: string | null;
  overdue: boolean;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  availableTags: string[];
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "🔴 Важливо",
  medium: "🟡 Середнє",
  low: "⚪ Низьке",
};

export function applyFilters(tasks: Task[], filters: Filters): Task[] {
  const today = todayMidnight();
  return tasks.filter((t) => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.tag && !t.tags.includes(filters.tag)) return false;
    if (filters.overdue && !(t.deadline && t.deadline < today && !t.done)) return false;
    return true;
  });
}

export default function FilterBar({ filters, onChange, availableTags }: Props) {
  const active = filters.priority || filters.tag || filters.overdue;

  function togglePriority(p: Priority) {
    onChange({ ...filters, priority: filters.priority === p ? null : p });
  }
  function toggleTag(tag: string) {
    onChange({ ...filters, tag: filters.tag === tag ? null : tag });
  }
  function toggleOverdue() {
    onChange({ ...filters, overdue: !filters.overdue });
  }
  function clear() {
    onChange({ priority: null, tag: null, overdue: false });
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 pb-3 pt-1">
      {/* Overdue chip */}
      <Chip
        active={filters.overdue}
        color="#FD3433"
        onClick={toggleOverdue}
      >
        ⚠ Прострочені
      </Chip>

      {/* Priority chips */}
      {(["high", "medium", "low"] as Priority[]).map((p) => (
        <Chip
          key={p}
          active={filters.priority === p}
          color={p === "high" ? "#FD3433" : "rgba(255,255,255,0.12)"}
          onClick={() => togglePriority(p)}
        >
          {PRIORITY_LABELS[p]}
        </Chip>
      ))}

      {/* Tag chips */}
      {availableTags.map((tag) => (
        <Chip
          key={tag}
          active={filters.tag === tag}
          color="rgba(255,255,255,0.12)"
          onClick={() => toggleTag(tag)}
        >
          #{tag}
        </Chip>
      ))}

      {/* Clear */}
      {active && (
        <Chip active={false} color="rgba(255,255,255,0.08)" onClick={clear}>
          ✕ Скинути
        </Chip>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  color,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
      style={{
        backgroundColor: active ? color : "rgba(255,255,255,0.06)",
        color: active ? "#fff" : "rgba(255,255,255,0.60)",
        border: `1px solid ${active ? color : "rgba(255,255,255,0.10)"}`,
      }}
    >
      {children}
    </button>
  );
}
