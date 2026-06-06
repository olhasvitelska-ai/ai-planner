"use client";

import { Task } from "@/lib/store";

interface Props {
  tasks: Task[];
  onScheduleToday: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function InboxScreen({ tasks, onScheduleToday, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] gap-4 text-center p-8">
        <span className="text-6xl">📭</span>
        <h2 className="text-xl font-semibold text-white">Вхідні порожні</h2>
        <p className="text-gray-400">Перейди на «Захоплення» і розкажи, що в голові</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-6">
      <h1 className="text-xl font-bold pt-4 text-white">
        Вхідні <span className="text-sky-400 font-normal">({tasks.length})</span>
      </h1>
      <ul className="flex flex-col gap-3">
        {tasks.map((task) => (
          <li key={task.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-white text-base leading-snug">{task.text}</p>
            <div className="flex gap-2">
              <button
                onClick={() => onScheduleToday(task.id)}
                className="flex-1 py-3 rounded-xl bg-sky-500/20 text-sky-400 text-sm font-medium active:bg-sky-500/30 transition-colors"
              >
                ✅ На сьогодні
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="py-3 px-4 rounded-xl bg-gray-800 text-gray-400 text-sm active:bg-gray-700 transition-colors"
                aria-label="Видалити"
              >
                🗑
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
