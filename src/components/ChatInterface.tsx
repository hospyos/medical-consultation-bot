"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message, ConsultationAnalysis } from "@/types";
import MessageBubble from "./MessageBubble";
import { Send, Loader2, RefreshCw } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const QUICK_PROMPTS = [
  "목이 아프고 열이 나요",
  "오른쪽 아래 배가 찌르듯이 아파요",
  "두통이 심하고 어지러워요",
  "기침이 2주 넘게 계속돼요",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: "assistant",
        content:
          "안녕하세요! 저는 병원 AI 상담 어시스턴트입니다.\n\n증상이나 궁금한 점을 편하게 말씀해 주세요. 증상 분석, 진료과 추천, 병원 안내를 도와드립니다.\n\n⚠️ 본 서비스는 참고용 안내이며, 정확한 진단은 반드시 의사와 상담하세요.",
        createdAt: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: text.trim(),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      const history = messages
        .filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            sessionId,
            history,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "오류가 발생했습니다.");
        }

        const aiMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: data.message,
          createdAt: new Date(),
          analysis: data.analysis as ConsultationAnalysis,
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        const errorMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
        textareaRef.current?.focus();
      }
    },
    [loading, messages, sessionId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: uuidv4(),
        role: "assistant",
        content:
          "안녕하세요! 저는 병원 AI 상담 어시스턴트입니다.\n\n증상이나 궁금한 점을 편하게 말씀해 주세요. 증상 분석, 진료과 추천, 병원 안내를 도와드립니다.\n\n⚠️ 본 서비스는 참고용 안내이며, 정확한 진단은 반드시 의사와 상담하세요.",
        createdAt: new Date(),
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow">
              <span className="text-white text-lg">🏥</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">병원 AI 상담봇</h1>
              <p className="text-xs text-gray-500">증상 분석 · 진료과 추천 · 병원 안내</p>
            </div>
          </div>
          <button
            onClick={resetChat}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            새 상담
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
                <span className="text-sm">🏥</span>
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-4 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="border-t border-gray-100 bg-white px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-medium text-gray-500">자주 묻는 증상</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="증상이나 궁금한 점을 입력하세요... (Enter로 전송)"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none max-h-32"
              style={{ minHeight: "24px" }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            본 서비스는 참고용이며 의사의 진료를 대체하지 않습니다.
          </p>
        </form>
      </div>
    </div>
  );
}
