"use client";

import { Task } from "@/lib/store";

interface Props {
  tasks: Task[];
  onScheduleToday: (id: string) => void;
  onScheduleLater: (id: string) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_BADGE: Record<Task["priority"], { label: string; className: string }> = {
  high: { label: "Важливо", className: "bg-red-500/20 text-red-400" },
  medium: { label: "Середнє", className: "bg-yellow-500/20 text-yellow-400" },
  low: { label: "Низьке", className: "bg-gray-700 text-gray-400" },
};

function TaskCard({
  task,
  onScheduleToday,
  onScheduleLater,
  onDelete,
}: {
  task: Task;
  onScheduleToday: (id: string) => void;
  onScheduleLater: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const badge = PRIORITY_BADGE[task.priority];
  return (
    <li className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-base leading-snug flex-1">{task.text}</p>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <div className="flex gap-2">
        {task.scheduledFor !== "today" && (
          <button
            onClick={() => onScheduleToday(task.id)}
            className="flex-1 py-3 rounded-xl bg-sky-500/20 text-sky-400 text-sm font-medium active:bg-sky-500/30 transition-colors"
          >
            ✅ На сьогодні
          </button>
        )}
        {task.scheduledFor !== "later" && (
          <button
            onClick={() => onScheduleLater(task.id)}
            className="flex-1 py-3 rounded-xl bg-violet-500/20 text-violet-400 text-sm font-medium active:bg-violet-500/30 transition-colors"
          >
            ⏰ На пізніше
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="py-3 px-4 rounded-xl bg-gray-800 text-gray-400 text-sm active:bg-gray-700 transition-colors"
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
        <h2 className="text-xl font-semibold text-white">Вхідні порожні</h2>
        <p className="text-gray-400">Перейди на «Захоплення» і розкажи, що в голові</p>
      </div>
    );
  }

  const unscheduled = tasks.filter((t) => t.scheduledFor === null);
  const later = tasks.filter((t) => t.scheduledFor === "later");

  return (
    <div className="flex flex-col gap-3 p-4 pb-6">
      <h1 className="text-xl font-bold pt-4 text-white">
        Вхідні <span className="text-sky-400 font-normal">({tasks.length})</span>
      </h1>

      {unscheduled.length > 0 && (
        <ul className="flex flex-col gap-3">
          {unscheduled.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onScheduleToday={onScheduleToday}
              onScheduleLater={onScheduleLater}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}

      {later.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 mt-2 uppercase tracking-wider">На пізніше</h2>
          <ul className="flex flex-col gap-3">
            {later.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
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
