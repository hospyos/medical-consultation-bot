"use client";

import { Message } from "@/types";
import AnalysisCard from "./AnalysisCard";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser ? "bg-blue-600" : "bg-white border border-gray-200"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-blue-600" />
        )}
      </div>

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && message.analysis && (
          <AnalysisCard analysis={message.analysis} />
        )}

        <p className={`mt-1 text-xs text-gray-400 ${isUser ? "text-right" : "text-left"}`}>
          {message.createdAt.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
