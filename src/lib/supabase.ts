import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      consultation_records: {
        Row: {
          id: string;
          session_id: string;
          user_message: string;
          ai_response: string;
          intent: string | null;
          symptoms: string[] | null;
          possible_conditions: string[] | null;
          recommended_departments: string[] | null;
          urgency_level: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_message: string;
          ai_response: string;
          intent?: string | null;
          symptoms?: string[] | null;
          possible_conditions?: string[] | null;
          recommended_departments?: string[] | null;
          urgency_level?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
