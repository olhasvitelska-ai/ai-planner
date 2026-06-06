"use client";

import { useState, useEffect, useRef } from "react";
import { Task, Subtask, Priority, todayMidnight } from "@/lib/store";

const S = {
  bg:        "#222631",
  surface:   "#3B404C",
  surface2:  "#2E3340",
  border:    "rgba(255,255,255,0.08)",
  text:      "rgba(255,255,255,0.95)",
  muted:     "rgba(255,255,255,0.50)",
  caption:   "rgba(255,255,255,0.30)",
  red:       "#FD3433",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Важливо",
  medium: "Середнє",
  low: "Низьке",
};

function tsToDateInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateInputToTs(s: string): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface Props {
  task: Task;
  onSave: (updated: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function TaskDetail({ task, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(task.text);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [deadline, setDeadline] = useState(tsToDateInput(task.deadline));
  const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimatedMinutes?.toString() ?? "");
  const [tags, setTags] = useState(task.tags.join(", "));
  const [notes, setNotes] = useState(task.notes);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks);
  const [newSubtask, setNewSubtask] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const subtaskRef = useRef<HTMLInputElement>(null);

  // Auto-save on unmount / change
  useEffect(() => {
    return () => { /* cleanup only */ };
  }, []);

  function save() {
    const updated: Task = {
      ...task,
      text: text.trim() || task.text,
      priority,
      deadline: dateInputToTs(deadline),
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes,
      subtasks,
    };
    onSave(updated);
    onClose();
  }

  function addSubtask() {
    const t = newSubtask.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), text: t, done: false }]);
    setNewSubtask("");
    subtaskRef.current?.focus();
  }

  function toggleSubtask(id: string) {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s));
  }

  function deleteSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  const today = todayMidnight();
  const deadlineTs = dateInputToTs(deadline);
  const isOverdue = deadlineTs && deadlineTs < today;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: S.bg }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{ borderBottom: `1px solid ${S.border}` }}
      >
        <button onClick={onClose} className="text-sm font-medium" style={{ color: S.muted }}>
          ← Назад
        </button>
        <button
          onClick={save}
          className="text-sm font-medium px-4 py-2 rounded-md"
          style={{ backgroundColor: S.red, color: "#fff" }}
        >
          Зберегти
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 pb-12">

        {/* Task text */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="w-full text-xl font-medium resize-none focus:outline-none bg-transparent"
          style={{ color: S.text, letterSpacing: "-0.02em", caretColor: S.red }}
        />

        {/* Priority */}
        <Field label="Пріоритет">
          <div className="flex gap-2">
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: priority === p
                    ? p === "high" ? S.red : S.surface
                    : "transparent",
                  color: priority === p
                    ? p === "high" ? "#fff" : S.text
                    : S.muted,
                  border: `1px solid ${priority === p ? (p === "high" ? S.red : S.border) : S.border}`,
                }}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </Field>

        {/* Deadline */}
        <Field label="Дедлайн">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-md px-3 py-2.5 text-sm focus:outline-none"
            style={{
              backgroundColor: S.surface,
              color: isOverdue ? S.red : S.text,
              border: `1px solid ${isOverdue ? S.red : S.border}`,
              colorScheme: "dark",
            }}
          />
          {isOverdue && (
            <p className="text-xs mt-1" style={{ color: S.red }}>Дедлайн минув</p>
          )}
        </Field>

        {/* Estimated time */}
        <Field label="Оцінка часу (хвилин)">
          <input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="напр. 30"
            min={0}
            className="w-full rounded-md px-3 py-2.5 text-sm focus:outline-none"
            style={{ backgroundColor: S.surface, color: S.text, border: `1px solid ${S.border}`, colorScheme: "dark" }}
          />
        </Field>

        {/* Tags */}
        <Field label="Теги (через кому)">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="робота, фінанси, особисте"
            className="w-full rounded-md px-3 py-2.5 text-sm focus:outline-none"
            style={{ backgroundColor: S.surface, color: S.text, border: `1px solid ${S.border}` }}
          />
        </Field>

        {/* Notes */}
        <Field label="Нотатки">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Додаткові деталі, посилання, контекст…"
            className="w-full rounded-md px-3 py-3 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: S.surface, color: S.text, border: `1px solid ${S.border}`, caretColor: S.red }}
          />
        </Field>

        {/* Subtasks */}
        <Field label={`Підзадачі ${subtasks.length > 0 ? `(${subtasks.filter((s) => s.done).length}/${subtasks.length})` : ""}`}>
          <ul className="flex flex-col gap-2 mb-2">
            {subtasks.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <button
                  onClick={() => toggleSubtask(s.id)}
                  className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all"
                  style={{
                    backgroundColor: s.done ? S.red : "transparent",
                    borderColor: s.done ? S.red : "rgba(255,255,255,0.30)",
                    color: "#fff",
                  }}
                >
                  {s.done ? "✓" : ""}
                </button>
                <span
                  className="flex-1 text-sm"
                  style={{
                    color: s.done ? S.caption : S.text,
                    textDecoration: s.done ? "line-through" : "none",
                  }}
                >
                  {s.text}
                </span>
                <button onClick={() => deleteSubtask(s.id)} style={{ color: S.caption, fontSize: "1.1rem" }}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              ref={subtaskRef}
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); }}}
              placeholder="Додати підзадачу…"
              className="flex-1 rounded-md px-3 py-2.5 text-sm focus:outline-none"
              style={{ backgroundColor: S.surface, color: S.text, border: `1px solid ${S.border}` }}
            />
            <button
              onClick={addSubtask}
              className="px-4 rounded-md text-sm font-medium"
              style={{ backgroundColor: S.surface, color: S.text, border: `1px solid ${S.border}` }}
            >
              +
            </button>
          </div>
        </Field>

        {/* Delete */}
        <div className="pt-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3 rounded-md text-sm font-medium"
              style={{ color: S.red, border: `1px solid rgba(253,52,51,0.30)`, borderRadius: "10px" }}
            >
              Видалити задачу
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { onDelete(task.id); onClose(); }}
                className="flex-1 py-3 rounded-md text-sm font-medium"
                style={{ backgroundColor: S.red, color: "#fff", borderRadius: "10px" }}
              >
                Підтвердити видалення
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-3 px-4 rounded-md text-sm"
                style={{ backgroundColor: S.surface, color: S.muted, borderRadius: "10px" }}
              >
                Скасувати
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}
