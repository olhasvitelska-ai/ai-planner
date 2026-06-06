"use client";

import { useState, useMemo } from "react";
import { Task, todayMidnight } from "@/lib/store";
import FilterBar, { Filters, applyFilters } from "./FilterBar";
import LaterSheet from "./LaterSheet";
import TagPicker from "./TagPicker";

const S = {
  surface:  "#3B404C",
  border:   "rgba(255,255,255,0.08)",
  text:     "rgba(255,255,255,0.95)",
  muted:    "rgba(255,255,255,0.50)",
  caption:  "rgba(255,255,255,0.30)",
  red:      "#FD3433",
};

const PRIORITY_DOT: Record<Task["priority"], string> = {
  high:   S.red,
  medium: "rgba(255,255,255,0.40)",
  low:    "rgba(255,255,255,0.20)",
};

interface Props {
  tasks: Task[];
  allTags: string[];
  onScheduleToday: (id: string) => void;
  onScheduleLater: (id: string, deadline: number) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onChangeTags: (id: string, tags: string[]) => void;
}

function TaskCard({ task, allTags, onScheduleToday, onPickLater, onOpenDetail, onChangeTags }: {
  task: Task;
  allTags: string[];
  onScheduleToday: () => void;
  onPickLater: () => void;
  onOpenDetail: () => void;
  onChangeTags: (tags: string[]) => void;
}) {
  const today = todayMidnight();
  const isOverdue = task.deadline && task.deadline < today;

  return (
    <li className="rounded-lg flex flex-col"
      style={{ backgroundColor: S.surface, border: `1px solid ${isOverdue ? "rgba(253,52,51,0.30)" : S.border}` }}
    >
      <button onClick={onOpenDetail} className="w-full text-left flex items-start gap-3 p-4">
        <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_DOT[task.priority] }} />
        <div className="flex-1 min-w-0">
          <p className="text-base leading-snug" style={{ color: S.text }}>{task.text}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.deadline && (
              <span className="text-xs" style={{ color: isOverdue ? S.red : S.muted }}>
                📅 {new Date(task.deadline).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="text-xs" style={{ color: S.caption }}>⏱ {task.estimatedMinutes} хв</span>
            )}
            {task.subtasks.length > 0 && (
              <span className="text-xs" style={{ color: S.caption }}>
                ☑ {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
        <span style={{ color: S.caption, fontSize: "1.1rem" }}>›</span>
      </button>

      {/* Inline tag editor */}
      <div className="px-4 pb-2 pt-1">
        <TagPicker tags={task.tags} allTags={allTags} onChange={onChangeTags} compact />
      </div>

      <div className="flex gap-2 px-4 pb-3 pt-0" style={{ borderTop: `1px solid ${S.border}` }}>
        <button onClick={onScheduleToday}
          className="flex-1 py-2 rounded-md text-sm font-medium mt-3"
          style={{ backgroundColor: "rgba(253,52,51,0.12)", color: S.red, borderRadius: "8px" }}
        >
          ✅ На сьогодні
        </button>
        <button onClick={onPickLater}
          className="flex-1 py-2 rounded-md text-sm font-medium mt-3"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: S.muted, border: `1px solid ${S.border}`, borderRadius: "8px" }}
        >
          ⏰ На пізніше
        </button>
      </div>
    </li>
  );
}

export default function InboxScreen({ tasks, allTags, onScheduleToday, onScheduleLater, onDelete, onOpenDetail, onChangeTags }: Props) {
  const [filters, setFilters] = useState<Filters>({ priority: null, tag: null, overdue: false });
  const [laterTaskId, setLaterTaskId] = useState<string | null>(null);

  const filtered = applyFilters(tasks, filters);
  const unscheduled = filtered.filter((t) => t.scheduledFor === null);
  const later       = filtered.filter((t) => t.scheduledFor === "later");

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] gap-4 text-center p-8">
        <span className="text-6xl">📭</span>
        <h2 className="text-xl font-medium" style={{ color: S.text, letterSpacing: "-0.02em" }}>Вхідні порожні</h2>
        <p className="text-sm" style={{ color: S.muted }}>Перейди на «Захоплення» і розкажи, що в голові</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-0 pb-6">
        <div className="flex items-center justify-between px-4 pt-6 pb-3">
          <h1 className="text-xl font-medium" style={{ color: S.text, letterSpacing: "-0.02em" }}>Вхідні</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: S.red, color: "#fff" }}>
            {tasks.length}
          </span>
        </div>

        <FilterBar filters={filters} onChange={setFilters} availableTags={allTags} />

        {filtered.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: S.muted }}>Жодних задач за фільтрами</p>
        )}

        <div className="px-4 flex flex-col gap-4">
          {unscheduled.length > 0 && (
            <ul className="flex flex-col gap-2">
              {unscheduled.map((task) => (
                <TaskCard key={task.id} task={task} allTags={allTags}
                  onScheduleToday={() => onScheduleToday(task.id)}
                  onPickLater={() => setLaterTaskId(task.id)}
                  onOpenDetail={() => onOpenDetail(task.id)}
                  onChangeTags={(tags) => onChangeTags(task.id, tags)}
                />
              ))}
            </ul>
          )}

          {later.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: S.caption }}>На пізніше</p>
              <ul className="flex flex-col gap-2">
                {later.map((task) => (
                  <TaskCard key={task.id} task={task} allTags={allTags}
                    onScheduleToday={() => onScheduleToday(task.id)}
                    onPickLater={() => setLaterTaskId(task.id)}
                    onOpenDetail={() => onOpenDetail(task.id)}
                    onChangeTags={(tags) => onChangeTags(task.id, tags)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Later date picker sheet */}
      {laterTaskId && (
        <LaterSheet
          onConfirm={(deadline) => {
            onScheduleLater(laterTaskId, deadline);
            setLaterTaskId(null);
          }}
          onCancel={() => setLaterTaskId(null)}
        />
      )}
    </>
  );
}
