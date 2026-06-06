import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export interface ParsedTask {
  text: string;
  priority: "high" | "medium" | "low";
  scheduledFor: "today" | "later" | null;
  deadline: string | null;       // "YYYY-MM-DD" or null
  estimatedMinutes: number | null;
  tags: string[];
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: `Today is ${todayStr}. Parse the following Ukrainian or mixed-language text into a structured task list.

For each task determine:
- text: cleaned task description (keep the original language)
- priority: "high" if urgent/critical/важливо/терміново, "low" if minor/someday/колись, otherwise "medium"
- scheduledFor: "today" if today/сьогодні, "later" if deferred/пізніше/потім/згодом, null if unspecified
- deadline: a "YYYY-MM-DD" date string if a specific date/day/deadline is mentioned (e.g. "до п'ятниці" = next Friday, "до кінця тижня" = this Sunday, "завтра" = tomorrow), otherwise null
- estimatedMinutes: realistic time estimate in minutes (e.g. "зателефонувати" ≈ 10, "написати звіт" ≈ 90, "купити хліб" ≈ 20), null if completely unclear
- tags: array of 1–3 short Ukrainian tags that categorize the task (e.g. ["робота"], ["особисте"], ["покупки"], ["здоров'я"], ["фінанси"]), empty array if none fit

Return ONLY valid JSON, no markdown, no explanation:
{"tasks": [{"text": "...", "priority": "high"|"medium"|"low", "scheduledFor": "today"|"later"|null, "deadline": "YYYY-MM-DD"|null, "estimatedMinutes": number|null, "tags": [...]}]}

Text to parse:
${text}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  try {
    const raw = textBlock.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
