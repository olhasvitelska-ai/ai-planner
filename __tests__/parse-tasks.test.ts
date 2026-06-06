import { POST } from "@/app/api/parse-tasks/route";
import { NextRequest } from "next/server";

jest.mock("@anthropic-ai/sdk", () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
    _mockCreate: mockCreate,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockCreate = (require("@anthropic-ai/sdk") as { _mockCreate: jest.Mock })._mockCreate;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/parse-tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/parse-tasks", () => {
  beforeEach(() => mockCreate.mockReset());

  it("returns 400 if text is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns parsed tasks from Claude", async () => {
    const tasks = [
      { text: "Buy milk", priority: "low", scheduledFor: null },
      { text: "Submit report", priority: "high", scheduledFor: "today" },
    ];
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ tasks }) }],
    });

    const res = await POST(makeRequest({ text: "Buy milk, submit report today" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tasks).toHaveLength(2);
    expect(data.tasks[0].text).toBe("Buy milk");
    expect(data.tasks[1].priority).toBe("high");
    expect(data.tasks[1].scheduledFor).toBe("today");
  });

  it("returns 500 if Claude returns invalid JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "not json" }],
    });
    const res = await POST(makeRequest({ text: "something" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 if Claude returns no text block", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "thinking", thinking: "..." }] });
    const res = await POST(makeRequest({ text: "something" }));
    expect(res.status).toBe(500);
  });
});
