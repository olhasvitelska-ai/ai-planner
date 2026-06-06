"use client";

import { useState, useEffect } from "react";
import { Task, loadTasks, saveTasks, createTask } from "@/lib/store";
import CaptureScreen from "./CaptureScreen";
import InboxScreen from "./InboxScreen";
import TodayScreen from "./TodayScreen";

type Tab = "capture" | "inbox" | "today";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "capture", label: "Захоплення", icon: "🎤" },
  { id: "inbox", label: "Вхідні", icon: "📥" },
  { id: "today", label: "Майбутнє", icon: "📅" },
];

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("capture");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  function persistTasks(updated: Task[]) {
    setTasks(updated);
    saveTasks(updated);
  }

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
          (t: { text: string; priority: Task["priority"]; scheduledFor: Task["scheduledFor"]; deadline?: number; estimatedMinutes?: number; tags?: string[] }) =>
            createTask(t.text, {
              priority: t.priority,
              scheduledFor: t.scheduledFor,
              deadline: t.deadline ?? null,
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

  const inboxTasks = tasks.filter((t) => t.scheduledFor !== "today");
  const todayTasks = tasks.filter((t) => t.scheduledFor === "today");

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        {activeTab === "capture" && <CaptureScreen onCapture={handleCapture} parsing={parsing} />}
        {activeTab === "inbox" && (
          <InboxScreen
            tasks={inboxTasks}
            onScheduleToday={handleScheduleToday}
            onScheduleLater={handleScheduleLater}
            onDelete={handleDelete}
          />
        )}
        {activeTab === "today" && <TodayScreen tasks={todayTasks} onToggle={handleToggle} />}
      </main>

      {/* Bottom nav — skelar-n97 background */}
      <nav
        className="shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
        style={{ backgroundColor: "#060607", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badgeCount = tab.id === "inbox" ? inboxTasks.length : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex flex-col items-center gap-1 py-4 text-xs font-medium transition-colors"
                style={{ color: isActive ? "#FD3433" : "rgba(255,255,255,0.40)" }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: "#FD3433" }}
                  />
                )}
                <span className="text-2xl leading-none">{tab.icon}</span>
                <span style={{ letterSpacing: "0.01em" }}>{tab.label}</span>
                {badgeCount > 0 && (
                  <span
                    className="absolute top-2 right-[22%] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold"
                    style={{ backgroundColor: "#FD3433" }}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
