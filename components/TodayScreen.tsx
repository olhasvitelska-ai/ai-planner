"use client";

import { useState, useMemo } from "react";
import { Task, todayMidnight } from "@/lib/store";
import WeekStrip from "./WeekStrip";
import FilterBar, { Filters, applyFilters } from "./FilterBar";

const S = {
  bg:       "#222631",
  surface:  "#3B404C",
  border:   "rgba(255,255,255,0.08)",
  text:     "rgba(255,255,255,0.95)",
  muted:    "rgba(255,255,255,0.50)",
  caption:  "rgba(255,255,255,0.30)",
  red:      "#FD3433",
};

const DAY_UA = ["неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"];
const MONTH_UA = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];

function dayLabel(ts: number, todayTs: number): string {
  if (ts === todayTs) return "Сьогодні";
  if (ts === todayTs + 86400000) return "Завтра";
  const d = new Date(ts);
  return `${DAY_UA[d.getDay()]}, ${d.getDate()} ${MONTH_UA[d.getMonth()]}`;
}

function histLabel(ts: number): string {
  const d = new Date(ts);
  return `${DAY_UA[d.getDay()]}, ${d.getDate()} ${MONTH_UA[d.getMonth()]}`;
}

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onCarryOver: () => void;
  onOpenDetail: (id: string) => void;
}

type View = "upcoming" | "history";

export default function TodayScreen({ tasks, onToggle, onCarryOver, onOpenDetail }: Props) {
  const [filterDate, setFilterDate] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({ priority: null, tag: null, overdue: false });
  const [view, setView] = useState<View>("upcoming");
  const today = todayMidnight();

  function getDisplayDate(t: Task): number {
    if (t.deadline) return t.deadline;
    if (t.scheduledFor === "today") return today;
    return today + 86400000;
  }

  // Upcoming = today + future
  const upcoming = tasks.filter((t) => !t.done || getDisplayDate(t) >= today);
  // History = past days (overdue or done in the past)
  const history = tasks.filter((t) => {
    const d = getDisplayDate(t);
    return d < today;
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Pending carry-over count
  const carryOverCount = tasks.filter((t) => !t.done && getDisplayDate(t) < today).length;

  // Upcoming grouped
  const filteredUpcoming = applyFilters(
    filterDate ? upcoming.filter((t) => getDisplayDate(t) === filterDate) : upcoming,
    filters
  );

  const groups = new Map<number, Task[]>();
  for (const t of filteredUpcoming) {
    const d = getDisplayDate(t);
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(t);
  }
  const sortedDates = Array.from(groups.keys()).sort((a, b) => a - b);

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  // History grouped
  const histGroups = new Map<number, Task[]>();
  for (const t of history) {
    const d = getDisplayDate(t);
    if (!histGroups.has(d)) histGroups.set(d, []);
    histGroups.get(d)!.push(t);
  }
  const sortedHistDates = Array.from(histGroups.keys()).sort((a, b) => b - a); // newest first

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setView("upcoming")}
            className="text-base font-medium transition-colors"
            style={{
              color: view === "upcoming" ? S.text : S.muted,
              borderBottom: view === "upcoming" ? `2px solid ${S.red}` : "2px solid transparent",
              paddingBottom: "2px",
              letterSpacing: "-0.02em",
            }}
          >
            Майбутнє
          </button>
          <button
            onClick={() => setView("history")}
            className="text-base font-medium transition-colors relative"
            style={{
              color: view === "history" ? S.text : S.muted,
              borderBottom: view === "history" ? `2px solid ${S.red}` : "2px solid transparent",
              paddingBottom: "2px",
              letterSpacing: "-0.02em",
            }}
          >
            Архів
            {history.length > 0 && (
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(255,255,255,0.10)", color: S.muted }}
              >
                {history.length}
              </span>
            )}
          </button>
        </div>
        {total > 0 && (
          <span className="text-xs" style={{ color: S.caption }}>
            {done}/{total}
          </span>
        )}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mx-4 mt-1 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(done / total) * 100}%`, backgroundColor: S.red }}
          />
        </div>
      )}

      {/* Carry-over banner */}
      {carryOverCount > 0 && view === "upcoming" && (
        <button
          onClick={onCarryOver}
          className="mx-4 mt-3 flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ backgroundColor: "rgba(253,52,51,0.10)", border: "1px solid rgba(253,52,51,0.25)" }}
        >
          <span className="text-sm" style={{ color: S.red }}>
            {carryOverCount} невиконаних із минулих днів
          </span>
          <span className="text-sm font-medium" style={{ color: S.red }}>
            Перенести на завтра →
          </span>
        </button>
      )}

      {/* UPCOMING VIEW */}
      {view === "upcoming" && (
        <>
          <WeekStrip selectedDate={filterDate} onSelect={(ts) => setFilterDate(ts === -1 ? null : ts)} />
          <FilterBar filters={filters} onChange={setFilters} availableTags={allTags} />

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
              <span className="text-6xl">🌅</span>
              <h2 className="text-xl font-medium" style={{ color: S.text, letterSpacing: "-0.02em" }}>
                День поки чистий
              </h2>
              <p className="text-sm" style={{ color: S.muted }}>
                У «Вхідних» натисни «На сьогодні» для будь-якої задачі
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pb-6 px-4 flex flex-col gap-6">
              {filteredUpcoming.length === 0 && (
                <p className="text-center pt-12 text-sm" style={{ color: S.muted }}>
                  Жодних задач за обраними фільтрами
                </p>
              )}
              {sortedDates.map((dateTs) => {
                const group = groups.get(dateTs)!;
                const isToday = dateTs === today;
                const isPast = dateTs < today;
                return (
                  <div key={dateTs}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: isPast ? S.red : isToday ? S.text : S.muted,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {dayLabel(dateTs, today)}
                      </span>
                      {isPast && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(253,52,51,0.15)", color: S.red }}
                        >
                          прострочено
                        </span>
                      )}
                    </div>
                    <ul className="flex flex-col">
                      {group.map((task) => (
                        <TaskRow key={task.id} task={task} today={today} onToggle={onToggle} onOpenDetail={onOpenDetail} />
                      ))}
                    </ul>
                  </div>
                );
              })}

              {done === total && total > 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl">🎉</span>
                  <p className="font-medium mt-2" style={{ color: S.red }}>
                    Усі задачі виконано!
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* HISTORY VIEW */}
      {view === "history" && (
        <div className="flex-1 overflow-y-auto pb-6 px-4 pt-4 flex flex-col gap-6">
          {sortedHistDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-5xl">📖</span>
              <p className="text-sm" style={{ color: S.muted }}>Архів поки порожній</p>
            </div>
          ) : sortedHistDates.map((dateTs) => {
            const group = histGroups.get(dateTs)!;
            const doneCnt = group.filter((t) => t.done).length;
            return (
              <div key={dateTs}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: S.muted, letterSpacing: "-0.01em" }}>
                    {histLabel(dateTs)}
                  </span>
                  <span className="text-xs" style={{ color: S.caption }}>
                    {doneCnt}/{group.length} виконано
                  </span>
                </div>
                <ul className="flex flex-col">
                  {group.map((task) => (
                    <TaskRow key={task.id} task={task} today={today} onToggle={onToggle} onOpenDetail={onOpenDetail} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, today, onToggle, onOpenDetail }: {
  task: Task;
  today: number;
  onToggle: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const isOverdue = task.deadline && task.deadline < today && !task.done;
  return (
    <>
      <li className="flex items-start gap-3 py-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all"
          style={{
            backgroundColor: task.done ? S.red : "transparent",
            borderColor: task.done ? S.red : task.priority === "high" ? S.red : "rgba(255,255,255,0.30)",
            color: "#fff",
          }}
        >
          {task.done ? "✓" : ""}
        </button>

        {/* Text + meta */}
        <button className="flex-1 min-w-0 text-left" onClick={() => onOpenDetail(task.id)}>
          <p
            className="text-base leading-snug"
            style={{
              color: task.done ? S.caption : isOverdue ? S.red : S.text,
              textDecoration: task.done ? "line-through" : "none",
            }}
          >
            {task.text}
          </p>
          {!task.done && (task.tags.length > 0 || task.estimatedMinutes || task.subtasks.length > 0) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {task.estimatedMinutes && (
                <span className="text-xs" style={{ color: S.caption }}>⏱ {task.estimatedMinutes} хв</span>
              )}
              {task.subtasks.length > 0 && (
                <span className="text-xs" style={{ color: S.caption }}>
                  ☑ {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                </span>
              )}
              {task.tags.map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: S.muted }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </button>
        <span style={{ color: S.caption, fontSize: "1.1rem", marginTop: "2px" }}>›</span>
      </li>
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.05)" }} />
    </>
  );
}
