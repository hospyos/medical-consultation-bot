export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  analysis?: ConsultationAnalysis;
}

export interface ConsultationAnalysis {
  intent: string;
  symptoms: string[];
  possibleConditions: string[];
  recommendedDepartments: string[];
  urgencyLevel: "normal" | "urgent" | "emergency";
  urgencyReason?: string;
}

export interface ConsultationRecord {
  id?: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  intent: string | null;
  symptoms: string[] | null;
  possible_conditions: string[] | null;
  recommended_departments: string[] | null;
  urgency_level: string | null;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
}
