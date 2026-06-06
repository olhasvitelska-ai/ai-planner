"use client";

import { useState } from "react";
import { Task, todayMidnight } from "@/lib/store";
import WeekStrip from "./WeekStrip";

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
}

const DAY_UA = ["неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"];
const MONTH_UA = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];

function dayLabel(ts: number, todayTs: number): string {
  if (ts === todayTs) return "Сьогодні";
  if (ts === todayTs + 86400000) return "Завтра";
  const d = new Date(ts);
  return `${DAY_UA[d.getDay()]}, ${d.getDate()} ${MONTH_UA[d.getMonth()]}`;
}

export default function TodayScreen({ tasks, onToggle }: Props) {
  const [filterDate, setFilterDate] = useState<number | null>(null);
  const today = todayMidnight();

  function getDisplayDate(t: Task): number {
    if (t.deadline) return t.deadline;
    if (t.scheduledFor === "today") return today;
    return today + 86400000;
  }

  const visible = filterDate ? tasks.filter((t) => getDisplayDate(t) === filterDate) : tasks;

  const groups = new Map<number, Task[]>();
  for (const t of visible) {
    const d = getDisplayDate(t);
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(t);
  }
  const sortedDates = Array.from(groups.keys()).sort((a, b) => a - b);

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">
      {/* Header */}
      <div className="px-4 pt-6 pb-1 flex items-center justify-between">
        <h1
          className="text-xl font-medium"
          style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}
        >
          Майбутнє
        </h1>
        {total > 0 && (
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
            {done}/{total} виконано
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mx-4 mt-2 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(done / total) * 100}%`, backgroundColor: "#FD3433" }}
          />
        </div>
      )}

      {/* Week strip */}
      <WeekStrip
        selectedDate={filterDate}
        onSelect={(ts) => setFilterDate(ts === -1 ? null : ts)}
      />

      {/* Content */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
          <span className="text-6xl">🌅</span>
          <h2 className="text-xl font-medium" style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}>
            День поки чистий
          </h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
            У «Вхідних» натисни «На сьогодні» для будь-якої задачі
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-6 px-4 flex flex-col gap-6">
          {sortedDates.map((dateTs) => {
            const group = groups.get(dateTs)!;
            const isPast = dateTs < today;
            const isToday = dateTs === today;
            return (
              <div key={dateTs}>
                {/* Day header */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: isPast ? "#FD3433" : isToday ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.70)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {dayLabel(dateTs, today)}
                  </span>
                  {isPast && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(253,52,51,0.15)", color: "#FD3433" }}
                    >
                      прострочено
                    </span>
                  )}
                </div>

                {/* Task list */}
                <ul className="flex flex-col">
                  {group.map((task) => (
                    <li key={task.id}>
                      <button
                        onClick={() => onToggle(task.id)}
                        className="w-full text-left flex items-start gap-3 py-3"
                      >
                        {/* Circle checkbox — red border matches priority */}
                        <span
                          className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all"
                          style={{
                            backgroundColor: task.done ? "#FD3433" : "transparent",
                            borderColor: task.done
                              ? "#FD3433"
                              : task.priority === "high"
                              ? "#FD3433"
                              : "rgba(255,255,255,0.30)",
                            color: "#FFFFFF",
                          }}
                        >
                          {task.done ? "✓" : ""}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-base leading-snug"
                            style={{
                              color: task.done ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.95)",
                              textDecoration: task.done ? "line-through" : "none",
                            }}
                          >
                            {task.text}
                          </p>
                          {!task.done && (task.tags.length > 0 || task.estimatedMinutes) && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {task.estimatedMinutes && (
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                                  ⏱ {task.estimatedMinutes} хв
                                </span>
                              )}
                              {task.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    color: "rgba(255,255,255,0.50)",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                      {/* Divider */}
                      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {done === total && total > 0 && (
            <div className="text-center py-8">
              <span className="text-4xl">🎉</span>
              <p className="font-medium mt-2" style={{ color: "#FD3433" }}>
                Усі задачі виконано!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
