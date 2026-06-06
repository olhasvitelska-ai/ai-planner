export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  scheduledFor: "today" | "later" | null;
  deadline: number | null; // timestamp ms, date only (midnight)
  estimatedMinutes: number | null;
  tags: string[];
  createdAt: number;
}

const TASKS_KEY = "ai-planner-tasks";

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: Partial<Task>[] = JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]");
    return raw.map((t) => ({
      id: t.id ?? crypto.randomUUID(),
      text: t.text ?? "",
      done: t.done ?? false,
      priority: t.priority ?? "medium",
      scheduledFor: t.scheduledFor ?? null,
      deadline: t.deadline ?? null,
      estimatedMinutes: t.estimatedMinutes ?? null,
      tags: t.tags ?? [],
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
  overrides?: Partial<Pick<Task, "priority" | "scheduledFor" | "deadline" | "estimatedMinutes" | "tags">>
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
