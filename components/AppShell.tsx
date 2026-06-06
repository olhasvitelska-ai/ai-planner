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
  { id: "today", label: "Сьогодні", icon: "✅" },
];

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("capture");
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  function persistTasks(updated: Task[]) {
    setTasks(updated);
    saveTasks(updated);
  }

  function handleCapture(raw: string) {
    const lines = raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const newTasks = lines.map(createTask);
    persistTasks([...tasks, ...newTasks]);
    setActiveTab("inbox");
  }

  function handleToggle(id: string) {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function handleScheduleToday(id: string) {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, scheduledFor: "today" } : t)));
  }

  function handleDelete(id: string) {
    persistTasks(tasks.filter((t) => t.id !== id));
  }

  const inboxTasks = tasks.filter((t) => t.scheduledFor !== "today");
  const todayTasks = tasks.filter((t) => t.scheduledFor === "today");

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        {activeTab === "capture" && <CaptureScreen onCapture={handleCapture} />}
        {activeTab === "inbox" && (
          <InboxScreen tasks={inboxTasks} onScheduleToday={handleScheduleToday} onDelete={handleDelete} />
        )}
        {activeTab === "today" && <TodayScreen tasks={todayTasks} onToggle={handleToggle} />}
      </main>

      <nav className="shrink-0 bg-gray-900 border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-4 text-xs font-medium transition-colors ${
                activeTab === tab.id ? "text-sky-400" : "text-gray-500 active:text-gray-300"
              }`}
            >
              <span className="text-2xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "inbox" && inboxTasks.length > 0 && (
                <span className="absolute top-2 right-6 bg-sky-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {inboxTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
