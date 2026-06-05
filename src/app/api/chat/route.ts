import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MEDICAL_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { ConsultationAnalysis } from "@/types";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message: string;
  sessionId: string;
  history?: OpenRouterMessage[];
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[chat] OPENROUTER_API_KEY is not set");
      return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
    }

    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[chat] Failed to parse request body:", e);
      return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
    }

    const message = body?.message;
    const sessionId = body?.sessionId ?? "anonymous";
    const history: OpenRouterMessage[] = Array.isArray(body?.history) ? body.history : [];

    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const messages: OpenRouterMessage[] = [
      { role: "system", content: MEDICAL_SYSTEM_PROMPT },
      ...history.slice(-10),
      {
        role: "user",
        content: `${message}\n\n반드시 위 시스템 프롬프트에 명시된 JSON 형식으로만 응답하세요.`,
      },
    ];

    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://medical-consultation-bot-nine.vercel.app",
          "X-Title": "Medical Consultation Bot",
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[chat] fetch to OpenRouter failed:", msg);
      return NextResponse.json({ error: "AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("[chat] OpenRouter API error:", response.status, errText.slice(0, 300));
      return NextResponse.json({ error: "AI 서비스 오류가 발생했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const rawContent: string = (data?.choices?.[0]?.message?.content as string) ?? "{}";

    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim();

    let parsed: { message?: string; analysis?: ConsultationAnalysis };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.warn("[chat] JSON parse failed, using raw content");
      parsed = {
        message: rawContent,
        analysis: {
          intent: "기타",
          symptoms: [],
          possibleConditions: [],
          recommendedDepartments: [],
          urgencyLevel: "normal",
        },
      };
    }

    const aiMessage = parsed.message || "응답을 처리하는 중 오류가 발생했습니다.";
    const analysis = parsed.analysis;

    supabase
      .from("consultation_records")
      .insert({
        session_id: sessionId,
        user_message: message,
        ai_response: aiMessage,
        intent: analysis?.intent ?? null,
        symptoms: analysis?.symptoms ?? null,
        possible_conditions: analysis?.possibleConditions ?? null,
        recommended_departments: analysis?.recommendedDepartments ?? null,
        urgency_level: analysis?.urgencyLevel ?? null,
      })
      .then(({ error }) => {
        if (error) console.error("[chat] Supabase insert error:", error.message);
      });

    return NextResponse.json({ message: aiMessage, analysis });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Unknown";
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? (err.stack ?? "") : "";
    console.error(`[chat] Unhandled error [${name}]: ${msg}\n${stack.split("\n").slice(0, 6).join("\n")}`);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
