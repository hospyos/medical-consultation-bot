import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { MEDICAL_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { ConsultationAnalysis } from "@/types";

interface ChatRequestBody {
  message: string;
  sessionId: string;
  history?: OpenAI.Chat.ChatCompletionMessageParam[];
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      console.error("[chat] OPENROUTER_API_KEY is not set");
      return NextResponse.json({ error: "서버 설정 오류입니다." }, { status: 500 });
    }

    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
    }

    const message = body?.message;
    const sessionId = body?.sessionId ?? "anonymous";
    const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];

    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://medical-consultation-bot-nine.vercel.app",
        "X-Title": "Medical Consultation Bot",
      },
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: MEDICAL_SYSTEM_PROMPT },
      ...history,
      {
        role: "user",
        content: message,
      },
    ];

    let completion: OpenAI.Chat.ChatCompletion;
    try {
      completion = await client.chat.completions.create({
        model: "qwen/qwen-2.5-72b-instruct:free",
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      });
    } catch (err) {
      const isApiErr = err instanceof OpenAI.APIError;
      const status = isApiErr ? err.status : "network";
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[chat] OpenRouter API call failed [${status}]:`, errMsg);
      return NextResponse.json(
        { error: "AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const rawContent = completion.choices?.[0]?.message?.content ?? "{}";

    // extract JSON from markdown code blocks if model wraps it
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = (jsonMatch ? jsonMatch[1] : rawContent).trim();

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

    const validUrgency = ["normal", "urgent", "emergency"];
    const urgencyLevel = validUrgency.includes(analysis?.urgencyLevel ?? "")
      ? analysis!.urgencyLevel
      : "normal";

    supabase
      .from("consultation_records")
      .insert({
        session_id: sessionId,
        user_message: message,
        ai_response: aiMessage,
        intent: analysis?.intent ?? null,
        symptoms: Array.isArray(analysis?.symptoms) ? analysis.symptoms : null,
        possible_conditions: Array.isArray(analysis?.possibleConditions) ? analysis.possibleConditions : null,
        recommended_departments: Array.isArray(analysis?.recommendedDepartments) ? analysis.recommendedDepartments : null,
        urgency_level: urgencyLevel,
      })
      .then(({ error }) => {
        if (error) console.error("[chat] Supabase insert error:", error.message);
      });

    return NextResponse.json({ message: aiMessage, analysis });
  } catch (err) {
    const name = err instanceof Error ? err.name : "Unknown";
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[chat] Unhandled ${name}: ${msg}`);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
