import { createTask } from "@/lib/store";

describe("createTask", () => {
  it("creates a task with defaults", () => {
    const task = createTask("Buy milk");
    expect(task.text).toBe("Buy milk");
    expect(task.done).toBe(false);
    expect(task.priority).toBe("medium");
    expect(task.scheduledFor).toBeNull();
    expect(task.id).toBeTruthy();
    expect(typeof task.createdAt).toBe("number");
  });

  it("applies priority override", () => {
    const task = createTask("Urgent report", { priority: "high" });
    expect(task.priority).toBe("high");
    expect(task.scheduledFor).toBeNull();
  });

  it("applies scheduledFor override", () => {
    const task = createTask("Call dentist", { scheduledFor: "today" });
    expect(task.scheduledFor).toBe("today");
    expect(task.priority).toBe("medium");
  });

  it("applies both overrides", () => {
    const task = createTask("Low priority later", { priority: "low", scheduledFor: "later" });
    expect(task.priority).toBe("low");
    expect(task.scheduledFor).toBe("later");
  });

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createTask("x").id));
    expect(ids.size).toBe(50);
  });
});
