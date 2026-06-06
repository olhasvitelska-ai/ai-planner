export type Priority = "high" | "medium" | "low";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  scheduledFor: "today" | "later" | null;
  deadline: number | null;       // midnight timestamp ms
  estimatedMinutes: number | null;
  tags: string[];
  notes: string;
  subtasks: Subtask[];
  timeOfDay: TimeOfDay | null;   // energy-based slot
  sortOrder: number;             // manual ordering within a slot
  createdAt: number;
}

const TASKS_KEY = "ai-planner-tasks";

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: Partial<Task>[] = JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]");
    return raw.map((t, i) => ({
      id: t.id ?? crypto.randomUUID(),
      text: t.text ?? "",
      done: t.done ?? false,
      priority: t.priority ?? "medium",
      scheduledFor: t.scheduledFor ?? null,
      deadline: t.deadline ?? null,
      estimatedMinutes: t.estimatedMinutes ?? null,
      tags: t.tags ?? [],
      notes: t.notes ?? "",
      subtasks: t.subtasks ?? [],
      timeOfDay: t.timeOfDay ?? null,
      sortOrder: t.sortOrder ?? i,
      createdAt: t.createdAt ?? Date.now(),
    }));
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function createTask(
  text: string,
  overrides?: Partial<Pick<Task, "priority" | "scheduledFor" | "deadline" | "estimatedMinutes" | "tags" | "timeOfDay">>
): Task {
  return {
    id: crypto.randomUUID(),
    text,
    done: false,
    priority: overrides?.priority ?? "medium",
    scheduledFor: overrides?.scheduledFor ?? null,
    deadline: overrides?.deadline ?? null,
    estimatedMinutes: overrides?.estimatedMinutes ?? null,
    tags: overrides?.tags ?? [],
    notes: "",
    subtasks: [],
    timeOfDay: overrides?.timeOfDay ?? null,
    sortOrder: Date.now(),
    createdAt: Date.now(),
  };
}

export function todayMidnight(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayMidnight(offset: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
}

/** Parse "YYYY-MM-DD" → midnight local timestamp */
export function parseDateString(s: string): number | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Format timestamp as "YYYY-MM-DD" */
export function formatDateString(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
