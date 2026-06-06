import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export interface ParsedTask {
  text: string;
  priority: "high" | "medium" | "low";
  scheduledFor: "today" | "later" | null;
  deadline: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  timeOfDay: "morning" | "afternoon" | "evening" | null;
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
        content: `Today is ${todayStr}. Parse the following Ukrainian or mixed-language brain-dump into a structured task list.

For each task determine ALL of these fields:
- text: cleaned task description (keep original language)
- priority: "high" if urgent/critical/важливо/терміново, "low" if minor/someday/колись, otherwise "medium"
- scheduledFor: "today" if today/сьогодні, "later" if deferred, null if unspecified
- deadline: "YYYY-MM-DD" if a date is mentioned (e.g. "до п'ятниці"=next Friday, "завтра"=tomorrow, "до кінця тижня"=this Sunday), otherwise null
- estimatedMinutes: realistic time estimate (зателефонувати≈10, email≈15, купити продукти≈30, написати звіт≈90, зробити презентацію≈120), null if truly unclear
- tags: 1–3 short Ukrainian category tags from: ["робота","особисте","покупки","здоров'я","фінанси","навчання","дім","спорт","сім'я"], empty if none fit
- timeOfDay: energy-based recommendation —
    "morning" = tasks requiring deep focus, creativity, high cognitive load (звіти, складні рішення, важливі дзвінки)
    "afternoon" = meetings, communication, collaborative work, errands (зустрічі, листи, покупки)
    "evening" = routine, admin, light reading, planning (рутина, планування, прості задачі)
    null = if truly unclear

Return ONLY valid JSON, no markdown:
{"tasks": [{"text":"...","priority":"high"|"medium"|"low","scheduledFor":"today"|"later"|null,"deadline":"YYYY-MM-DD"|null,"estimatedMinutes":number|null,"tags":[...],"timeOfDay":"morning"|"afternoon"|"evening"|null}]}

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
