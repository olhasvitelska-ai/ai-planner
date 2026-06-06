"use client";

import { useMemo, useState } from "react";
import { Task, todayMidnight } from "@/lib/store";

const S = {
  surface:  "#3B404C",
  border:   "rgba(255,255,255,0.08)",
  text:     "rgba(255,255,255,0.95)",
  muted:    "rgba(255,255,255,0.50)",
  caption:  "rgba(255,255,255,0.30)",
  red:      "#FD3433",
};

const DAY_SHORT = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_SHORT = ["січ","лют","бер","квіт","трав","черв","лип","серп","вер","жовт","лист","груд"];

interface Props {
  tasks: Task[];
  onRenameTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
}

export default function AnalyticsScreen({ tasks, onRenameTag, onDeleteTag }: Props) {
  const today = todayMidnight();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const overdue = tasks.filter((t) => t.deadline && t.deadline < today && !t.done).length;
    const todayTasks = tasks.filter((t) => {
      const d = t.deadline ?? (t.scheduledFor === "today" ? today : null);
      return d === today;
    });
    const todayDone = todayTasks.filter((t) => t.done).length;
    const todayMinutes = todayTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);

    // This week completion (Mon–today)
    const weekStart = (() => { const d = new Date(today); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); })();
    const weekTasks = tasks.filter((t) => {
      const d = t.deadline ?? (t.scheduledFor === "today" ? today : null);
      return d !== null && d >= weekStart && d <= today;
    });
    const weekDone = weekTasks.filter((t) => t.done).length;

    // Priority breakdown
    const byPriority = { high: 0, medium: 0, low: 0 };
    tasks.filter((t) => !t.done).forEach((t) => byPriority[t.priority]++);

    // Workload per day — next 7 days (minutes)
    const workload: { ts: number; minutes: number; count: number }[] = Array.from({ length: 7 }, (_, i) => {
      const ts = today + i * 86400000;
      const dayTasks = tasks.filter((t) => {
        const d = t.deadline ?? (t.scheduledFor === "today" && i === 0 ? today : null);
        return d === ts && !t.done;
      });
      return { ts, minutes: dayTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 30), 0), count: dayTasks.length };
    });

    const maxMinutes = Math.max(...workload.map((d) => d.minutes), 1);

    // By energy slot
    const bySlot = { morning: 0, afternoon: 0, evening: 0, unset: 0 };
    tasks.filter((t) => !t.done).forEach((t) => {
      if (t.timeOfDay) bySlot[t.timeOfDay]++;
      else bySlot.unset++;
    });

    return { total, done, overdue, todayTasks: todayTasks.length, todayDone, todayMinutes, weekTasks: weekTasks.length, weekDone, byPriority, workload, maxMinutes, bySlot };
  }, [tasks, today]);

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-10">
      <h1 className="text-xl font-medium" style={{ color: S.text, letterSpacing: "-0.02em" }}>
        Аналітика
      </h1>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Сьогодні" value={`${stats.todayDone}/${stats.todayTasks}`} sub={stats.todayMinutes ? `${Math.round(stats.todayMinutes / 60 * 10) / 10} год заплановано` : "задач на сьогодні"} accent />
        <StatCard label="Цього тижня" value={`${stats.weekDone}/${stats.weekTasks}`} sub="виконано" />
        <StatCard label="Всього задач" value={String(stats.total)} sub={`${stats.done} виконано`} />
        <StatCard label="Прострочено" value={String(stats.overdue)} sub="задач" accent={stats.overdue > 0} />
      </div>

      {/* Workload — next 7 days */}
      <Section title="Навантаження на тиждень">
        <div className="flex items-end gap-2 h-28">
          {stats.workload.map(({ ts, minutes, count }) => {
            const d = new Date(ts);
            const isToday = ts === today;
            const pct = minutes / stats.maxMinutes;
            return (
              <div key={ts} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px]" style={{ color: S.caption }}>
                  {minutes > 0 ? `${minutes}хв` : ""}
                </span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(pct * 80, count > 0 ? 4 : 2)}px`,
                    backgroundColor: isToday ? S.red : minutes > 240 ? "rgba(253,52,51,0.50)" : S.surface,
                    minHeight: count > 0 ? "4px" : "2px",
                  }}
                />
                <span className="text-[10px] font-medium" style={{ color: isToday ? S.red : S.muted }}>
                  {DAY_SHORT[d.getDay()]}
                </span>
                <span className="text-[10px]" style={{ color: S.caption }}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: S.caption }}>
          Червоний = сьогодні · Темний = більше 4 год
        </p>
      </Section>

      {/* Priority distribution */}
      <Section title="Пріоритети (активні)">
        <PriorityBar label="Важливо" count={stats.byPriority.high} total={stats.total - stats.done} color={S.red} />
        <PriorityBar label="Середнє" count={stats.byPriority.medium} total={stats.total - stats.done} color="rgba(255,255,255,0.40)" />
        <PriorityBar label="Низьке"  count={stats.byPriority.low}    total={stats.total - stats.done} color="rgba(255,255,255,0.20)" />
      </Section>

      {/* Energy planning distribution */}
      <Section title="Розподіл по енергії">
        <div className="flex gap-3">
          {([
            { key: "morning",   icon: "🌅", label: "Ранок" },
            { key: "afternoon", icon: "☀️", label: "День" },
            { key: "evening",   icon: "🌙", label: "Вечір" },
            { key: "unset",     icon: "❓", label: "Не задано" },
          ] as const).map(({ key, icon, label }) => (
            <div
              key={key}
              className="flex-1 flex flex-col items-center gap-1 py-3 rounded-lg"
              style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-lg font-medium" style={{ color: S.text }}>
                {stats.bySlot[key]}
              </span>
              <span className="text-[10px] text-center" style={{ color: S.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Completion rate */}
      <Section title="Загальний прогрес">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: S.surface }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%`,
                backgroundColor: S.red,
              }}
            />
          </div>
          <span className="text-sm font-medium shrink-0" style={{ color: S.text }}>
            {stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%
          </span>
        </div>
        <p className="text-xs mt-2" style={{ color: S.muted }}>
          {stats.done} із {stats.total} задач виконано
        </p>
      </Section>

      {/* Category manager */}
      <CategoryManager tasks={tasks} onRename={onRenameTag} onDelete={onDeleteTag} />

      {/* Анекдот від Діми Іванова */}
      <DimaJoke />
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-1"
      style={{
        backgroundColor: accent ? "rgba(253,52,51,0.10)" : S.surface,
        border: `1px solid ${accent ? "rgba(253,52,51,0.25)" : S.border}`,
      }}
    >
      <p className="text-xs" style={{ color: S.muted }}>{label}</p>
      <p className="text-2xl font-medium" style={{ color: accent ? S.red : S.text, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: S.caption }}>{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: S.caption }}>{title}</p>
      <div className="rounded-lg p-4 flex flex-col gap-3" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        {children}
      </div>
    </div>
  );
}

function CategoryManager({ tasks, onRename, onDelete }: {
  tasks: Task[];
  onRename: (old: string, next: string) => void;
  onDelete: (tag: string) => void;
}) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const tagStats = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => t.tags.forEach((tag) => map.set(tag, (map.get(tag) ?? 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  function startEdit(tag: string) {
    setEditingTag(tag);
    setEditValue(tag);
  }

  function commitEdit(tag: string) {
    const next = editValue.trim().toLowerCase();
    if (next && next !== tag) onRename(tag, next);
    setEditingTag(null);
  }

  if (tagStats.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: S.caption }}>
        Категорії
      </p>
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
        {tagStats.map(([tag, count], i) => (
          <div
            key={tag}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: S.surface,
              borderTop: i > 0 ? `1px solid ${S.border}` : "none",
            }}
          >
            {editingTag === tag ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(tag)}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(tag); if (e.key === "Escape") setEditingTag(null); }}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: S.text, borderBottom: `1px solid ${S.red}` }}
              />
            ) : (
              <button
                onClick={() => startEdit(tag)}
                className="flex-1 text-left text-sm"
                style={{ color: S.text }}
              >
                #{tag}
              </button>
            )}
            <span className="text-xs shrink-0" style={{ color: S.caption }}>
              {count} {count === 1 ? "задача" : count < 5 ? "задачі" : "задач"}
            </span>
            <button
              onClick={() => onDelete(tag)}
              className="shrink-0 text-sm px-2 py-0.5 rounded-md transition-colors"
              style={{ color: S.caption, backgroundColor: "rgba(255,255,255,0.04)" }}
              title="Видалити категорію"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: S.caption }}>
        Натисни на назву щоб перейменувати. Зміна застосовується до всіх задач.
      </p>
    </div>
  );
}

function DimaJoke() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full py-3 rounded-lg text-sm font-medium transition-colors"
        style={{ backgroundColor: open ? "rgba(253,52,51,0.12)" : S.surface, color: open ? S.red : S.muted, border: `1px solid ${open ? "rgba(253,52,51,0.30)" : S.border}` }}
      >
        🐢 Анекдот від Діми Іванова
      </button>
      {open && (
        <div className="rounded-lg p-4 text-sm font-medium" style={{ backgroundColor: S.surface, border: `1px solid S.border`, color: S.text, lineHeight: "1.6" }}>
          Є черепашка, а як звати дорослу черепашку?<br />
          <span style={{ color: S.red }}>череПАВЕЛ 🐢</span>
        </div>
      )}
    </div>
  );
}

function PriorityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-16 shrink-0" style={{ color: S.muted }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-4 text-right shrink-0" style={{ color: S.caption }}>{count}</span>
    </div>
  );
}
