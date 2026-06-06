export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  scheduledFor: "today" | "later" | null;
  createdAt: number;
}

const TASKS_KEY = "ai-planner-tasks";

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function createTask(text: string, overrides?: Partial<Pick<Task, "priority" | "scheduledFor">>): Task {
  return {
    id: crypto.randomUUID(),
    text,
    done: false,
    priority: overrides?.priority ?? "medium",
    scheduledFor: overrides?.scheduledFor ?? null,
    createdAt: Date.now(),
  };
}
