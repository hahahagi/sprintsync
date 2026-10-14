import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { AnalysisSchema } from "@/lib/schema";
import { MOCKS } from "@/lib/mocks";
import { isRateLimited } from "@/lib/rate-limit";

export const maxDuration = 30;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseAndValidate(raw: string) {
  const clean = raw.replace(/```json|```/g, "").trim();
  return AnalysisSchema.parse(JSON.parse(clean));
}

function createAbortSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function callGroq(transcript: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `TRANSCRIPT:\n${transcript}` },
      ],
    }),
    signal: createAbortSignal(25000),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return parseAndValidate(data.choices[0].message.content);
}

async function callGemini(transcript: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          { role: "user", parts: [{ text: `TRANSCRIPT:\n${transcript}` }] },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: createAbortSignal(25000),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return parseAndValidate(data.candidates[0].content.parts[0].text);
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const { transcript, sampleId, demoMode } = await req.json();

  // Demo mode: mock + fake delay
  if (demoMode && sampleId && MOCKS[sampleId]) {
    await sleep(3000);
    return NextResponse.json({ source: "mock", data: MOCKS[sampleId] });
  }

  if (!transcript || transcript.length < 50) {
    return NextResponse.json(
      { error: "Transcript too short (min 50 characters)" },
      { status: 400 }
    );
  }

  // Layer 1: Groq → Layer 2: Gemini → Layer 3: Mock
  const providers: [string, () => Promise<unknown>][] = [
    ["groq", () => callGroq(transcript)],
    ["gemini", () => callGemini(transcript)],
  ];

  for (const [name, fn] of providers) {
    try {
      return NextResponse.json({ source: name, data: await fn() });
    } catch (e) {
      console.error(`[${name}] failed:`, e);
    }
  }

  // Layer 3: mock fallback for known samples
  if (sampleId && MOCKS[sampleId]) {
    await sleep(2000);
    return NextResponse.json({ source: "mock", data: MOCKS[sampleId] });
  }

  return NextResponse.json(
    { error: "All AI providers unavailable. Please try again later." },
    { status: 503 }
  );
}
