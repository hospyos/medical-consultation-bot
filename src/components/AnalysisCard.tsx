"use client";

import { ConsultationAnalysis } from "@/types";
import { AlertTriangle, Activity, Stethoscope, Building2 } from "lucide-react";

interface AnalysisCardProps {
  analysis: ConsultationAnalysis;
}

const urgencyConfig = {
  normal: { label: "일반", color: "bg-green-100 text-green-800 border-green-200" },
  urgent: { label: "빠른 진료 권장", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  emergency: { label: "응급", color: "bg-red-100 text-red-800 border-red-200" },
};

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const urgency = urgencyConfig[analysis.urgencyLevel] || urgencyConfig.normal;

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-blue-900 text-xs uppercase tracking-wide">상담 분석 결과</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${urgency.color}`}>
          {urgency.label}
        </span>
      </div>

      {analysis.urgencyLevel === "emergency" && analysis.urgencyReason && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-red-700 text-xs">{analysis.urgencyReason}</p>
        </div>
      )}

      {analysis.symptoms && analysis.symptoms.length > 0 && (
        <div className="flex items-start gap-2">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-gray-700 text-xs mb-1">감지된 증상</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.symptoms.map((symptom, i) => (
                <span key={i} className="rounded-md bg-white border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {analysis.possibleConditions && analysis.possibleConditions.length > 0 && (
        <div className="flex items-start gap-2">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
          <div>
            <p className="font-medium text-gray-700 text-xs mb-1">의심 가능 상태</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.possibleConditions.map((condition, i) => (
                <span key={i} className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs text-purple-700">
                  {condition}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {analysis.recommendedDepartments && analysis.recommendedDepartments.length > 0 && (
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          <div>
            <p className="font-medium text-gray-700 text-xs mb-1">추천 진료과</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.recommendedDepartments.map((dept, i) => (
                <span key={i} className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-medium text-teal-700">
                  {dept}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
