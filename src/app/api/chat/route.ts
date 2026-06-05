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
    const body: ChatRequestBody = await req.json();
    const { message, sessionId, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const messages: OpenRouterMessage[] = [
      { role: "system", content: MEDICAL_SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://medical-bot.vercel.app",
        "X-Title": "Medical Consultation Bot",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", errText);
      return NextResponse.json({ error: "AI 서비스 오류가 발생했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";

    let parsed: { message: string; analysis: ConsultationAnalysis };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
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

    await supabase.from("consultation_records").insert({
      session_id: sessionId,
      user_message: message,
      ai_response: aiMessage,
      intent: analysis?.intent || null,
      symptoms: analysis?.symptoms || null,
      possible_conditions: analysis?.possibleConditions || null,
      recommended_departments: analysis?.recommendedDepartments || null,
      urgency_level: analysis?.urgencyLevel || null,
    });

    return NextResponse.json({ message: aiMessage, analysis });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
