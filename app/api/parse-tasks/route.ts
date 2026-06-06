import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export interface ParsedTask {
  text: string;
  priority: "high" | "medium" | "low";
  scheduledFor: "today" | "later" | null;
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: `Parse the following Ukrainian or mixed-language text into a list of tasks.
For each task determine:
- text: cleaned task description (Ukrainian or as written)
- priority: "high" if urgent/important, "low" if minor/optional, otherwise "medium"
- scheduledFor: "today" if explicitly for today/сьогодні, "later" if deferred/пізніше/потім/згодом, null if unspecified

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"tasks": [{"text": "...", "priority": "high"|"medium"|"low", "scheduledFor": "today"|"later"|null}]}

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
    const parsed = JSON.parse(textBlock.text.trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
