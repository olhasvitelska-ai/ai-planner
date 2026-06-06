"use client";

import { Task } from "@/lib/store";

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
}

export default function TodayScreen({ tasks, onToggle }: Props) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] gap-4 text-center p-8">
        <span className="text-6xl">🌅</span>
        <h2 className="text-xl font-semibold text-white">День поки чистий</h2>
        <p className="text-gray-400">У «Вхідних» натисни «На сьогодні» для будь-якої задачі</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="pt-4 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-white">Сьогодні</h1>
        <span className="text-gray-400 text-sm">{done}/{total} виконано</span>
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-500 rounded-full transition-all duration-500"
          style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
        />
      </div>

      <ul className="flex flex-col gap-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              onClick={() => onToggle(task.id)}
              className={`w-full text-left bg-gray-900 border rounded-2xl p-4 flex items-start gap-4 transition-colors active:bg-gray-800 ${
                task.done ? "border-sky-500/30" : "border-gray-800"
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm transition-colors ${
                  task.done ? "bg-sky-500 border-sky-500 text-white" : "border-gray-600"
                }`}
              >
                {task.done ? "✓" : ""}
              </span>
              <span className={`text-base leading-snug ${task.done ? "line-through text-gray-500" : "text-white"}`}>
                {task.text}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {done === total && total > 0 && (
        <div className="mt-4 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-sky-400 font-semibold mt-2">Усі задачі виконано!</p>
        </div>
      )}
    </div>
  );
}
