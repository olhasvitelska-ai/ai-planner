"use client";

import { useState, useMemo } from "react";
import { Task, TimeOfDay, todayMidnight } from "@/lib/store";
import WeekStrip from "./WeekStrip";
import FilterBar, { Filters, applyFilters } from "./FilterBar";

const S = {
  surface:  "#3B404C",
  border:   "rgba(255,255,255,0.08)",
  text:     "rgba(255,255,255,0.95)",
  muted:    "rgba(255,255,255,0.50)",
  caption:  "rgba(255,255,255,0.30)",
  red:      "#FD3433",
};

const DAY_UA    = ["неділя","понеділок","вівторок","середа","четвер","п'ятниця","субота"];
const MONTH_UA  = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];

const SLOTS: { key: TimeOfDay; icon: string; label: string; hint: string }[] = [
  { key: "morning",   icon: "🌅", label: "Ранок",  hint: "Складні задачі, висока концентрація" },
  { key: "afternoon", icon: "☀️", label: "День",   hint: "Зустрічі, комунікація, командна робота" },
  { key: "evening",   icon: "🌙", label: "Вечір",  hint: "Рутина, адмін, легкі задачі" },
];

function dayLabel(ts: number, today: number) {
  if (ts === today) return "Сьогодні";
  if (ts === today + 86400000) return "Завтра";
  const d = new Date(ts);
  return `${DAY_UA[d.getDay()]}, ${d.getDate()} ${MONTH_UA[d.getMonth()]}`;
}

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onCarryOver: () => void;
  onOpenDetail: (id: string) => void;
  onChangeTimeSlot: (id: string, slot: TimeOfDay | null) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
}

type View = "upcoming" | "history";

export default function TodayScreen({ tasks, onToggle, onCarryOver, onOpenDetail, onChangeTimeSlot, onReorder }: Props) {
  const [filterDate, setFilterDate] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({ priority: null, tag: null, overdue: false });
  const [view, setView] = useState<View>("upcoming");
  const [reorderMode, setReorderMode] = useState(false);
  const today = todayMidnight();

  function getDisplayDate(t: Task): number {
    if (t.deadline) return t.deadline;
    if (t.scheduledFor === "today") return today;
    return today + 86400000;
  }

  const todayTasks = tasks.filter((t) => getDisplayDate(t) === today);
  const upcoming   = tasks.filter((t) => getDisplayDate(t) >= today);
  const history    = tasks.filter((t) => getDisplayDate(t) < today);
  const carryCount = history.filter((t) => !t.done).length;

  const allTags = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((g) => s.add(g)));
    return Array.from(s);
  }, [tasks]);

  // Upcoming filtered + grouped by date
  const filteredUpcoming = applyFilters(
    filterDate ? upcoming.filter((t) => getDisplayDate(t) === filterDate) : upcoming,
    filters
  );
  const dateGroups = new Map<number, Task[]>();
  for (const t of filteredUpcoming) {
    const d = getDisplayDate(t);
    if (!dateGroups.has(d)) dateGroups.set(d, []);
    dateGroups.get(d)!.push(t);
  }
  const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => a - b);

  // Today grouped by energy slot
  const slotGroups: Record<TimeOfDay | "unset", Task[]> = { morning: [], afternoon: [], evening: [], unset: [] };
  todayTasks.filter((t) => !t.done).sort((a, b) => a.sortOrder - b.sortOrder).forEach((t) => {
    const slot = t.timeOfDay ?? "unset";
    slotGroups[slot].push(t);
  });
  const doneTodayTasks = todayTasks.filter((t) => t.done);
  const hasTodayEnergyData = todayTasks.some((t) => t.timeOfDay);

  // History grouped
  const histGroups = new Map<number, Task[]>();
  for (const t of history) {
    const d = getDisplayDate(t);
    if (!histGroups.has(d)) histGroups.set(d, []);
    histGroups.get(d)!.push(t);
  }
  const sortedHistDates = Array.from(histGroups.keys()).sort((a, b) => b - a);

  const done  = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)]">
      {/* Header */}
      <div className="px-4 pt-6 pb-1 flex items-center justify-between">
        <div className="flex gap-4">
          {(["upcoming", "history"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="text-base font-medium pb-0.5 transition-colors"
              style={{
                color: view === v ? S.text : S.muted,
                borderBottom: view === v ? `2px solid ${S.red}` : "2px solid transparent",
                letterSpacing: "-0.02em",
              }}
            >
              {v === "upcoming" ? "Майбутнє" : (
                <span>Архів{history.length > 0 && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.10)", color: S.muted }}>{history.length}</span>}</span>
              )}
            </button>
          ))}
        </div>
        {total > 0 && <span className="text-xs" style={{ color: S.caption }}>{done}/{total}</span>}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mx-4 mt-1 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: S.border }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(done / total) * 100}%`, backgroundColor: S.red }} />
        </div>
      )}

      {/* Carry-over banner */}
      {carryCount > 0 && view === "upcoming" && (
        <button onClick={onCarryOver} className="mx-4 mt-3 flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ backgroundColor: "rgba(253,52,51,0.10)", border: "1px solid rgba(253,52,51,0.25)" }}>
          <span className="text-sm" style={{ color: S.red }}>{carryCount} невиконаних із минулих днів</span>
          <span className="text-sm font-medium" style={{ color: S.red }}>Перенести на завтра →</span>
        </button>
      )}

      {/* ── UPCOMING ── */}
      {view === "upcoming" && (
        <>
          <WeekStrip selectedDate={filterDate} onSelect={(ts) => setFilterDate(ts === -1 ? null : ts)} />
          <FilterBar filters={filters} onChange={setFilters} availableTags={allTags} />

          {tasks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex-1 overflow-y-auto pb-6 px-4 flex flex-col gap-6">

              {/* TODAY — energy view */}
              {(!filterDate || filterDate === today) && todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: S.text, letterSpacing: "-0.01em" }}>
                      Сьогодні
                    </span>
                    {hasTodayEnergyData && (
                      <button
                        onClick={() => setReorderMode((r) => !r)}
                        className="text-xs px-2.5 py-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: reorderMode ? S.red : S.surface,
                          color: reorderMode ? "#fff" : S.muted,
                          border: `1px solid ${reorderMode ? S.red : S.border}`,
                        }}
                      >
                        {reorderMode ? "✓ Готово" : "↕ Сортувати"}
                      </button>
                    )}
                  </div>

                  {hasTodayEnergyData ? (
                    /* Energy-grouped view */
                    <div className="flex flex-col gap-4">
                      {SLOTS.map(({ key, icon, label, hint }) => {
                        const group = slotGroups[key];
                        return (
                          <div key={key}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-base">{icon}</span>
                              <span className="text-sm font-medium" style={{ color: S.muted }}>{label}</span>
                              <span className="text-xs" style={{ color: S.caption }}>— {hint}</span>
                            </div>
                            {group.length === 0 ? (
                              <div className="rounded-lg py-3 px-4 text-xs" style={{ backgroundColor: S.surface, border: `1px dashed ${S.border}`, color: S.caption }}>
                                Немає задач для цього часу
                              </div>
                            ) : (
                              <ul className="flex flex-col rounded-lg overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                                {group.map((t, idx) => (
                                  <EnergyTaskRow
                                    key={t.id}
                                    task={t}
                                    isFirst={idx === 0}
                                    isLast={idx === group.length - 1}
                                    reorderMode={reorderMode}
                                    onToggle={onToggle}
                                    onOpenDetail={onOpenDetail}
                                    onChangeSlot={(slot) => onChangeTimeSlot(t.id, slot)}
                                    onReorder={(dir) => onReorder(t.id, dir)}
                                  />
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}

                      {/* Unassigned */}
                      {slotGroups.unset.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">❓</span>
                            <span className="text-sm font-medium" style={{ color: S.muted }}>Без слоту</span>
                          </div>
                          <ul className="flex flex-col rounded-lg overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
                            {slotGroups.unset.map((t, idx) => (
                              <EnergyTaskRow
                                key={t.id}
                                task={t}
                                isFirst={idx === 0}
                                isLast={idx === slotGroups.unset.length - 1}
                                reorderMode={reorderMode}
                                onToggle={onToggle}
                                onOpenDetail={onOpenDetail}
                                onChangeSlot={(slot) => onChangeTimeSlot(t.id, slot)}
                                onReorder={(dir) => onReorder(t.id, dir)}
                              />
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Done */}
                      {doneTodayTasks.length > 0 && (
                        <div>
                          <p className="text-xs mb-2" style={{ color: S.caption }}>Виконано ({doneTodayTasks.length})</p>
                          <ul className="flex flex-col">
                            {doneTodayTasks.map((t) => (
                              <SimpleTaskRow key={t.id} task={t} today={today} onToggle={onToggle} onOpenDetail={onOpenDetail} />
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Flat list for today without energy data */
                    <ul className="flex flex-col">
                      {todayTasks.map((t) => (
                        <SimpleTaskRow key={t.id} task={t} today={today} onToggle={onToggle} onOpenDetail={onOpenDetail} />
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* FUTURE dates */}
              {sortedDates.filter((d) => d !== today).map((dateTs) => {
                const group = dateGroups.get(dateTs)!;
                const isPast = dateTs < today;
                return (
                  <div key={dateTs}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium" style={{ color: isPast ? S.red : S.muted, letterSpacing: "-0.01em" }}>
                        {dayLabel(dateTs, today)}
                      </span>
                      {isPast && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(253,52,51,0.15)", color: S.red }}>прострочено</span>
                      )}
                    </div>
                    <ul className="flex flex-col">
                      {group.map((t) => (
                        <SimpleTaskRow key={t.id} task={t} today={today} onToggle={onToggle} onOpenDetail={onOpenDetail} />
                      ))}
                    </ul>
                  </div>
                );
              })}

              {filteredUpcoming.length === 0 && (
                <p className="text-center pt-8 text-sm" style={{ color: S.muted }}>Жодних задач за фільтрами</p>
              )}

              {done === total && total > 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl">🎉</span>
                  <p className="font-medium mt-2" style={{ color: S.red }}>Усі задачі виконано!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY ── */}
      {view === "history" && (
        <div className="flex-1 overflow-y-auto pb-6 px-4 pt-4 flex flex-col gap-6">
          {sortedHistDates.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <span className="text-5xl">📖</span>
              <p className="text-sm" style={{ color: S.muted }}>Архів поки порожній</p>
            </div>
          ) : sortedHistDates.map((dateTs) => {
            const group = histGroups.get(dateTs)!;
            const doneCnt = group.filter((t) => t.done).length;
            const d = new Date(dateTs);
            return (
              <div key={dateTs}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: S.muted, letterSpacing: "-0.01em" }}>
                    {DAY_UA[d.getDay()]}, {d.getDate()} {MONTH_UA[d.getMonth()]}
                  </span>
                  <span className="text-xs" style={{ color: S.caption }}>{doneCnt}/{group.length} виконано</span>
                </div>
                <ul className="flex flex-col">
                  {group.map((t) => (
                    <SimpleTaskRow key={t.id} task={t} today={today} onToggle={onToggle} onOpenDetail={onOpenDetail} />
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

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
      <span className="text-6xl">🌅</span>
      <h2 className="text-xl font-medium" style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}>
        День поки чистий
      </h2>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
        У «Вхідних» натисни «На сьогодні» для будь-якої задачі
      </p>
    </div>
  );
}

const SLOT_CYCLE: (TimeOfDay | null)[] = ["morning", "afternoon", "evening", null];
const SLOT_ICON: Record<TimeOfDay, string> = { morning: "🌅", afternoon: "☀️", evening: "🌙" };

function EnergyTaskRow({
  task, isFirst, isLast, reorderMode,
  onToggle, onOpenDetail, onChangeSlot, onReorder,
}: {
  task: Task; isFirst: boolean; isLast: boolean; reorderMode: boolean;
  onToggle: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onChangeSlot: (slot: TimeOfDay | null) => void;
  onReorder: (dir: "up" | "down") => void;
}) {
  function cycleSlot() {
    const idx = SLOT_CYCLE.indexOf(task.timeOfDay ?? null);
    onChangeSlot(SLOT_CYCLE[(idx + 1) % SLOT_CYCLE.length] ?? null);
  }

  return (
    <li className="flex items-center gap-3 px-3 py-3" style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
      {/* Reorder arrows */}
      {reorderMode && (
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onReorder("up")} disabled={isFirst} className="text-xs leading-none px-1" style={{ color: isFirst ? S.caption : S.muted }}>▲</button>
          <button onClick={() => onReorder("down")} disabled={isLast} className="text-xs leading-none px-1" style={{ color: isLast ? S.caption : S.muted }}>▼</button>
        </div>
      )}

      {/* Checkbox */}
      <button onClick={() => onToggle(task.id)}
        className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all"
        style={{ backgroundColor: "transparent", borderColor: task.priority === "high" ? S.red : "rgba(255,255,255,0.30)", color: "#fff" }}
      />

      {/* Text */}
      <button className="flex-1 min-w-0 text-left" onClick={() => onOpenDetail(task.id)}>
        <p className="text-sm leading-snug" style={{ color: S.text }}>{task.text}</p>
        {task.estimatedMinutes && (
          <p className="text-xs mt-0.5" style={{ color: S.caption }}>⏱ {task.estimatedMinutes} хв</p>
        )}
      </button>

      {/* Slot badge — tap to cycle */}
      <button onClick={cycleSlot}
        className="shrink-0 px-2 py-1 rounded-full text-xs transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: S.muted, border: `1px solid ${S.border}` }}
        title="Натисни щоб змінити слот"
      >
        {task.timeOfDay ? SLOT_ICON[task.timeOfDay] : "＋"}
      </button>
    </li>
  );
}

function SimpleTaskRow({ task, today, onToggle, onOpenDetail }: {
  task: Task; today: number;
  onToggle: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const isOverdue = task.deadline && task.deadline < today && !task.done;
  return (
    <>
      <li className="flex items-start gap-3 py-3">
        <button onClick={() => onToggle(task.id)}
          className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all"
          style={{
            backgroundColor: task.done ? S.red : "transparent",
            borderColor: task.done ? S.red : task.priority === "high" ? S.red : "rgba(255,255,255,0.30)",
            color: "#fff",
          }}
        >{task.done ? "✓" : ""}</button>
        <button className="flex-1 min-w-0 text-left" onClick={() => onOpenDetail(task.id)}>
          <p className="text-base leading-snug" style={{ color: task.done ? S.caption : isOverdue ? S.red : S.text, textDecoration: task.done ? "line-through" : "none" }}>
            {task.text}
          </p>
          {!task.done && (task.estimatedMinutes || task.tags.length > 0 || task.subtasks.length > 0) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {task.estimatedMinutes && <span className="text-xs" style={{ color: S.caption }}>⏱ {task.estimatedMinutes} хв</span>}
              {task.subtasks.length > 0 && <span className="text-xs" style={{ color: S.caption }}>☑ {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}</span>}
              {task.tags.map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: S.muted }}>#{tag}</span>
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
