"use client";

import { useState, useEffect } from "react";
import { Task, TimeOfDay, loadTasks, saveTasks, createTask, parseDateString, dayMidnight, todayMidnight } from "@/lib/store";
import CaptureScreen from "./CaptureScreen";
import InboxScreen from "./InboxScreen";
import TodayScreen from "./TodayScreen";
import AnalyticsScreen from "./AnalyticsScreen";
import TaskDetail from "./TaskDetail";

type Tab = "capture" | "inbox" | "today" | "analytics";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "capture",   label: "Захоплення", icon: "🎤" },
  { id: "inbox",     label: "Вхідні",     icon: "📥" },
  { id: "today",     label: "Майбутнє",   icon: "📅" },
  { id: "analytics", label: "Аналітика",  icon: "📊" },
];

export default function AppShell() {
  const [activeTab, setActiveTab]       = useState<Tab>("capture");
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [parsing, setParsing]           = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  useEffect(() => { setTasks(loadTasks()); }, []);

  function persist(updated: Task[]) {
    setTasks(updated);
    saveTasks(updated);
  }

  // ── Capture ───────────────────────────────────────────────────
  async function handleCapture(raw: string) {
    setParsing(true);
    try {
      const res = await fetch("/api/parse-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw }),
      });
      if (res.ok) {
        const data = await res.json();
        const newTasks: Task[] = (data.tasks ?? []).map(
          (t: {
            text: string;
            priority: Task["priority"];
            scheduledFor: Task["scheduledFor"];
            deadline?: string | null;
            estimatedMinutes?: number | null;
            tags?: string[];
            timeOfDay?: TimeOfDay | null;
          }) =>
            createTask(t.text, {
              priority: t.priority,
              scheduledFor: t.scheduledFor,
              deadline: t.deadline ? parseDateString(t.deadline) : null,
              estimatedMinutes: t.estimatedMinutes ?? null,
              tags: t.tags ?? [],
              timeOfDay: t.timeOfDay ?? null,
            })
        );
        persist([...tasks, ...newTasks]);
      } else {
        fallbackParse(raw);
      }
    } catch {
      fallbackParse(raw);
    } finally {
      setParsing(false);
      setActiveTab("inbox");
    }
  }

  function fallbackParse(raw: string) {
    const lines = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    persist([...tasks, ...lines.map((t) => createTask(t))]);
  }

  // ── Task mutations ────────────────────────────────────────────
  function handleToggle(id: string) {
    persist(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function handleScheduleToday(id: string) {
    persist(tasks.map((t) => (t.id === id ? { ...t, scheduledFor: "today", deadline: todayMidnight() } : t)));
  }

  function handleScheduleLater(id: string, deadline: number) {
    persist(tasks.map((t) => (t.id === id ? { ...t, scheduledFor: "later", deadline } : t)));
  }

  function handleDelete(id: string) {
    persist(tasks.filter((t) => t.id !== id));
  }

  function handleSaveTask(updated: Task) {
    persist(tasks.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleCarryOver() {
    const tomorrow = dayMidnight(1);
    const today = todayMidnight();
    persist(
      tasks.map((t) => {
        const d = t.deadline ?? (t.scheduledFor === "today" ? today : null);
        if (!t.done && d !== null && d < today) {
          return { ...t, deadline: tomorrow, scheduledFor: "later" };
        }
        return t;
      })
    );
  }

  function handleChangeTimeSlot(id: string, slot: TimeOfDay | null) {
    persist(tasks.map((t) => (t.id === id ? { ...t, timeOfDay: slot } : t)));
  }

  function handleChangeTags(id: string, tags: string[]) {
    persist(tasks.map((t) => (t.id === id ? { ...t, tags } : t)));
  }

  function handleRenameTag(oldTag: string, newTag: string) {
    persist(tasks.map((t) => ({
      ...t,
      tags: t.tags.map((tag) => (tag === oldTag ? newTag : tag)),
    })));
  }

  function handleDeleteTag(tag: string) {
    persist(tasks.map((t) => ({ ...t, tags: t.tags.filter((g) => g !== tag) })));
  }

  function handleReorder(id: string, direction: "up" | "down") {
    const today = todayMidnight();
    // Get today's tasks in current sortOrder
    const todayList = tasks
      .filter((t) => {
        const d = t.deadline ?? (t.scheduledFor === "today" ? today : null);
        return d === today && !t.done;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const idx = todayList.findIndex((t) => t.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= todayList.length) return;

    const a = todayList[idx];
    const b = todayList[swapIdx];
    persist(
      tasks.map((t) =>
        t.id === a.id ? { ...t, sortOrder: b.sortOrder } :
        t.id === b.id ? { ...t, sortOrder: a.sortOrder } : t
      )
    );
  }

  // ── Derived ──────────────────────────────────────────────────
  const inboxTasks = tasks.filter((t) => t.scheduledFor !== "today");
  const todayTasks = tasks.filter((t) => t.scheduledFor === "today");
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags))).sort();
  const detailTask = detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null;

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        {activeTab === "capture" && (
          <CaptureScreen onCapture={handleCapture} parsing={parsing} />
        )}
        {activeTab === "inbox" && (
          <InboxScreen
            tasks={inboxTasks}
            allTags={allTags}
            onScheduleToday={handleScheduleToday}
            onScheduleLater={handleScheduleLater}
            onDelete={handleDelete}
            onOpenDetail={(id) => setDetailTaskId(id)}
            onChangeTags={handleChangeTags}
          />
        )}
        {activeTab === "today" && (
          <TodayScreen
            tasks={todayTasks}
            onToggle={handleToggle}
            onCarryOver={handleCarryOver}
            onOpenDetail={(id) => setDetailTaskId(id)}
            onChangeTimeSlot={handleChangeTimeSlot}
            onReorder={handleReorder}
          />
        )}
        {activeTab === "analytics" && (
          <AnalyticsScreen
            tasks={tasks}
            onRenameTag={handleRenameTag}
            onDeleteTag={handleDeleteTag}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
        style={{ backgroundColor: "#060607", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badge = tab.id === "inbox" ? inboxTasks.length : 0;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
                style={{ color: isActive ? "#FD3433" : "rgba(255,255,255,0.40)" }}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ backgroundColor: "#FD3433" }} />
                )}
                <span className="text-2xl leading-none">{tab.icon}</span>
                <span className="text-[10px]">{tab.label}</span>
                {badge > 0 && (
                  <span className="absolute top-2 right-[18%] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold" style={{ backgroundColor: "#FD3433" }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {detailTask && (
        <TaskDetail
          task={detailTask}
          onSave={handleSaveTask}
          onDelete={handleDelete}
          onClose={() => setDetailTaskId(null)}
        />
      )}
    </div>
  );
}
