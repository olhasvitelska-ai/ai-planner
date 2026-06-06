"use client";

import { Task } from "@/lib/store";

interface Props {
  tasks: Task[];
  onScheduleToday: (id: string) => void;
  onScheduleLater: (id: string) => void;
  onDelete: (id: string) => void;
}

// Priority: high=red, medium=white/50%, low=white/30%
const PRIORITY_CONFIG: Record<Task["priority"], { dot: string; label: string; labelColor: string }> = {
  high:   { dot: "#FD3433", label: "Важливо",  labelColor: "#FD3433" },
  medium: { dot: "rgba(255,255,255,0.50)", label: "Середнє", labelColor: "rgba(255,255,255,0.50)" },
  low:    { dot: "rgba(255,255,255,0.25)", label: "Низьке",  labelColor: "rgba(255,255,255,0.25)" },
};

function TaskCard({ task, onScheduleToday, onScheduleLater, onDelete }: {
  task: Task;
  onScheduleToday: (id: string) => void;
  onScheduleLater: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const p = PRIORITY_CONFIG[task.priority];

  return (
    <li
      className="rounded-lg p-4 flex flex-col gap-3"
      style={{ backgroundColor: "#3B404C", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Task text + priority dot */}
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 shrink-0 w-2 h-2 rounded-full"
          style={{ backgroundColor: p.dot }}
        />
        <p className="flex-1 text-base leading-snug" style={{ color: "rgba(255,255,255,0.95)" }}>
          {task.text}
        </p>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 pl-5">
        <span className="text-xs font-medium" style={{ color: p.labelColor }}>
          {p.label}
        </span>
        {task.estimatedMinutes && (
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
            ⏱ {task.estimatedMinutes} хв
          </span>
        )}
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.60)" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pl-5">
        {task.scheduledFor !== "today" && (
          <button
            onClick={() => onScheduleToday(task.id)}
            className="flex-1 py-2.5 rounded-md text-sm font-medium transition-colors"
            style={{ backgroundColor: "rgba(253,52,51,0.12)", color: "#FD3433", borderRadius: "8px" }}
          >
            ✅ На сьогодні
          </button>
        )}
        {task.scheduledFor !== "later" && (
          <button
            onClick={() => onScheduleLater(task.id)}
            className="flex-1 py-2.5 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.70)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
            }}
          >
            ⏰ На пізніше
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="py-2.5 px-3 rounded-md text-sm transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.30)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
          }}
          aria-label="Видалити"
        >
          🗑
        </button>
      </div>
    </li>
  );
}

export default function InboxScreen({ tasks, onScheduleToday, onScheduleLater, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] gap-4 text-center p-8">
        <span className="text-6xl">📭</span>
        <h2 className="text-xl font-medium" style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}>
          Вхідні порожні
        </h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
          Перейди на «Захоплення» і розкажи, що в голові
        </p>
      </div>
    );
  }

  const unscheduled = tasks.filter((t) => t.scheduledFor === null);
  const later = tasks.filter((t) => t.scheduledFor === "later");

  return (
    <div className="flex flex-col gap-3 p-4 pb-6">
      <div className="flex items-baseline justify-between pt-6 pb-2">
        <h1
          className="text-xl font-medium"
          style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}
        >
          Вхідні
        </h1>
        <span
          className="text-sm px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: "#FD3433", color: "#FFFFFF" }}
        >
          {tasks.length}
        </span>
      </div>

      {unscheduled.length > 0 && (
        <ul className="flex flex-col gap-2">
          {unscheduled.map((task) => (
            <TaskCard key={task.id} task={task}
              onScheduleToday={onScheduleToday}
              onScheduleLater={onScheduleLater}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}

      {later.length > 0 && (
        <>
          <p
            className="text-xs font-medium mt-3 uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            На пізніше
          </p>
          <ul className="flex flex-col gap-2">
            {later.map((task) => (
              <TaskCard key={task.id} task={task}
                onScheduleToday={onScheduleToday}
                onScheduleLater={onScheduleLater}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
