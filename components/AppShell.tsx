"use client";

import { useState, useEffect } from "react";
import { Task, loadTasks, saveTasks, createTask, parseDateString, dayMidnight } from "@/lib/store";
import CaptureScreen from "./CaptureScreen";
import InboxScreen from "./InboxScreen";
import TodayScreen from "./TodayScreen";
import TaskDetail from "./TaskDetail";

type Tab = "capture" | "inbox" | "today";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "capture", label: "Захоплення", icon: "🎤" },
  { id: "inbox",   label: "Вхідні",    icon: "📥" },
  { id: "today",   label: "Майбутнє",  icon: "📅" },
];

export default function AppShell() {
  const [activeTab, setActiveTab]         = useState<Tab>("capture");
  const [tasks, setTasks]                 = useState<Task[]>([]);
  const [parsing, setParsing]             = useState(false);
  const [detailTaskId, setDetailTaskId]   = useState<string | null>(null);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  function persistTasks(updated: Task[]) {
    setTasks(updated);
    saveTasks(updated);
  }

  // ── Capture ──────────────────────────────────────────────────────────
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
          }) =>
            createTask(t.text, {
              priority: t.priority,
              scheduledFor: t.scheduledFor,
              deadline: t.deadline ? parseDateString(t.deadline) : null,
              estimatedMinutes: t.estimatedMinutes ?? null,
              tags: t.tags ?? [],
            })
        );
        persistTasks([...tasks, ...newTasks]);
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
    persistTasks([...tasks, ...lines.map((t) => createTask(t))]);
  }

  // ── Task actions ─────────────────────────────────────────────────────
  function handleToggle(id: string) {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function handleScheduleToday(id: string) {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, scheduledFor: "today" } : t)));
  }

  function handleScheduleLater(id: string) {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, scheduledFor: "later" } : t)));
  }

  function handleDelete(id: string) {
    persistTasks(tasks.filter((t) => t.id !== id));
  }

  function handleSaveTask(updated: Task) {
    persistTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
  }

  // Перенести невиконані минулих днів на завтра
  function handleCarryOver() {
    const tomorrow = dayMidnight(1);
    const now = Date.now();
    const todayTs = dayMidnight(0);
    persistTasks(
      tasks.map((t) => {
        const displayDate = t.deadline ?? (t.scheduledFor === "today" ? todayTs : null);
        if (!t.done && displayDate !== null && displayDate < todayTs) {
          return { ...t, deadline: tomorrow, scheduledFor: "later" };
        }
        return t;
      })
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────
  const inboxTasks = tasks.filter((t) => t.scheduledFor !== "today");
  const todayTasks = tasks.filter((t) => t.scheduledFor === "today");
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
            onScheduleToday={handleScheduleToday}
            onScheduleLater={handleScheduleLater}
            onDelete={handleDelete}
            onOpenDetail={(id) => setDetailTaskId(id)}
          />
        )}
        {activeTab === "today" && (
          <TodayScreen
            tasks={todayTasks}
            onToggle={handleToggle}
            onCarryOver={handleCarryOver}
            onOpenDetail={(id) => setDetailTaskId(id)}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav
        className="shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
        style={{ backgroundColor: "#060607", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badge = tab.id === "inbox" ? inboxTasks.length : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex flex-col items-center gap-1 py-4 text-xs font-medium transition-colors"
                style={{ color: isActive ? "#FD3433" : "rgba(255,255,255,0.40)" }}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: "#FD3433" }}
                  />
                )}
                <span className="text-2xl leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {badge > 0 && (
                  <span
                    className="absolute top-2 right-[22%] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold"
                    style={{ backgroundColor: "#FD3433" }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Task detail overlay */}
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
