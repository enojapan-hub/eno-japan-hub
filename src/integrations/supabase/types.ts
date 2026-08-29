export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      grammar_points: {
        Row: {
          created_at: string
          examples: Json
          explanation_id: string | null
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          meaning_en: string | null
          meaning_id: string
          pattern: string
          sort_order: number
          source: Database["public"]["Enums"]["content_source"]
          structure: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          examples?: Json
          explanation_id?: string | null
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          meaning_en?: string | null
          meaning_id: string
          pattern: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          structure?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          examples?: Json
          explanation_id?: string | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["jlpt_level"]
          meaning_en?: string | null
          meaning_id?: string
          pattern?: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          structure?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_points_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["code"]
          },
        ]
      }
      kanji: {
        Row: {
          character: string
          created_at: string
          examples: Json
          id: string
          is_published: boolean
          kunyomi: string[]
          level: Database["public"]["Enums"]["jlpt_level"]
          meaning_en: string | null
          meaning_id: string
          mnemonic: string | null
          onyomi: string[]
          sort_order: number
          source: Database["public"]["Enums"]["content_source"]
          stroke_count: number | null
          updated_at: string
        }
        Insert: {
          character: string
          created_at?: string
          examples?: Json
          id?: string
          is_published?: boolean
          kunyomi?: string[]
          level: Database["public"]["Enums"]["jlpt_level"]
          meaning_en?: string | null
          meaning_id: string
          mnemonic?: string | null
          onyomi?: string[]
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          stroke_count?: number | null
          updated_at?: string
        }
        Update: {
          character?: string
          created_at?: string
          examples?: Json
          id?: string
          is_published?: boolean
          kunyomi?: string[]
          level?: Database["public"]["Enums"]["jlpt_level"]
          meaning_en?: string | null
          meaning_id?: string
          mnemonic?: string | null
          onyomi?: string[]
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          stroke_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanji_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["code"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          completed_at: string | null
          correct_count: number
          created_at: string
          duration_seconds: number
          id: string
          items_studied: number
          lesson_id: string | null
          level: Database["public"]["Enums"]["jlpt_level"] | null
          skill: Database["public"]["Enums"]["skill_kind"] | null
          started_at: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          items_studied?: number
          lesson_id?: string | null
          level?: Database["public"]["Enums"]["jlpt_level"] | null
          skill?: Database["public"]["Enums"]["skill_kind"] | null
          started_at?: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          items_studied?: number
          lesson_id?: string | null
          level?: Database["public"]["Enums"]["jlpt_level"] | null
          skill?: Database["public"]["Enums"]["skill_kind"] | null
          started_at?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["item_kind"]
          lesson_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["item_kind"]
          lesson_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["item_kind"]
          lesson_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          estimated_minutes: number
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          skill: Database["public"]["Enums"]["skill_kind"]
          slug: string
          sort_order: number
          source: Database["public"]["Enums"]["content_source"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          skill?: Database["public"]["Enums"]["skill_kind"]
          slug: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["jlpt_level"]
          skill?: Database["public"]["Enums"]["skill_kind"]
          slug?: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["code"]
          },
        ]
      }
      levels: {
        Row: {
          cefr_max: Database["public"]["Enums"]["cefr_level"]
          cefr_min: Database["public"]["Enums"]["cefr_level"]
          code: Database["public"]["Enums"]["jlpt_level"]
          created_at: string
          description: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cefr_max: Database["public"]["Enums"]["cefr_level"]
          cefr_min: Database["public"]["Enums"]["cefr_level"]
          code: Database["public"]["Enums"]["jlpt_level"]
          created_at?: string
          description?: string | null
          sort_order: number
          title: string
          updated_at?: string
        }
        Update: {
          cefr_max?: Database["public"]["Enums"]["cefr_level"]
          cefr_min?: Database["public"]["Enums"]["cefr_level"]
          code?: Database["public"]["Enums"]["jlpt_level"]
          created_at?: string
          description?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          target_level: string
          ui_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          target_level?: string
          ui_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          target_level?: string
          ui_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          choices: Json
          correct_index: number
          created_at: string
          explanation_id: string | null
          id: string
          is_published: boolean
          item_id: string | null
          item_type: Database["public"]["Enums"]["item_kind"] | null
          kind: Database["public"]["Enums"]["question_kind"]
          level: Database["public"]["Enums"]["jlpt_level"]
          prompt: string
          prompt_note: string | null
          skill: Database["public"]["Enums"]["skill_kind"]
          source: Database["public"]["Enums"]["content_source"]
          updated_at: string
        }
        Insert: {
          choices?: Json
          correct_index?: number
          created_at?: string
          explanation_id?: string | null
          id?: string
          is_published?: boolean
          item_id?: string | null
          item_type?: Database["public"]["Enums"]["item_kind"] | null
          kind?: Database["public"]["Enums"]["question_kind"]
          level: Database["public"]["Enums"]["jlpt_level"]
          prompt: string
          prompt_note?: string | null
          skill: Database["public"]["Enums"]["skill_kind"]
          source?: Database["public"]["Enums"]["content_source"]
          updated_at?: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          created_at?: string
          explanation_id?: string | null
          id?: string
          is_published?: boolean
          item_id?: string | null
          item_type?: Database["public"]["Enums"]["item_kind"] | null
          kind?: Database["public"]["Enums"]["question_kind"]
          level?: Database["public"]["Enums"]["jlpt_level"]
          prompt?: string
          prompt_note?: string | null
          skill?: Database["public"]["Enums"]["skill_kind"]
          source?: Database["public"]["Enums"]["content_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["code"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean
          question_id: string | null
          selected_index: number | null
          time_spent_seconds: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          selected_index?: number | null
          time_spent_seconds?: number
          user_id: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          selected_index?: number | null
          time_spent_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          correct_count: number
          created_at: string
          duration_seconds: number
          id: string
          level: Database["public"]["Enums"]["jlpt_level"] | null
          quiz_id: string | null
          score: number
          skill: Database["public"]["Enums"]["skill_kind"] | null
          started_at: string
          total_questions: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          level?: Database["public"]["Enums"]["jlpt_level"] | null
          quiz_id?: string | null
          score?: number
          skill?: Database["public"]["Enums"]["skill_kind"] | null
          started_at?: string
          total_questions?: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          level?: Database["public"]["Enums"]["jlpt_level"] | null
          quiz_id?: string | null
          score?: number
          skill?: Database["public"]["Enums"]["skill_kind"] | null
          started_at?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          question_id: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          question_id: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          question_id?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          question_count: number
          skill: Database["public"]["Enums"]["skill_kind"]
          slug: string
          sort_order: number
          source: Database["public"]["Enums"]["content_source"]
          time_limit_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          question_count?: number
          skill?: Database["public"]["Enums"]["skill_kind"]
          slug: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["jlpt_level"]
          question_count?: number
          skill?: Database["public"]["Enums"]["skill_kind"]
          slug?: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["code"]
          },
        ]
      }
      user_daily_activity: {
        Row: {
          activity_date: string
          created_at: string
          grammar_learned: number
          id: string
          kanji_learned: number
          reviews_done: number
          updated_at: string
          user_id: string
          vocab_learned: number
          xp_earned: number
        }
        Insert: {
          activity_date?: string
          created_at?: string
          grammar_learned?: number
          id?: string
          kanji_learned?: number
          reviews_done?: number
          updated_at?: string
          user_id: string
          vocab_learned?: number
          xp_earned?: number
        }
        Update: {
          activity_date?: string
          created_at?: string
          grammar_learned?: number
          id?: string
          kanji_learned?: number
          reviews_done?: number
          updated_at?: string
          user_id?: string
          vocab_learned?: number
          xp_earned?: number
        }
        Relationships: []
      }
      user_item_progress: {
        Row: {
          created_at: string
          due_at: string | null
          ease_factor: number
          id: string
          interval_days: number
          item_id: string
          item_type: Database["public"]["Enums"]["item_kind"]
          lapses: number
          last_reviewed_at: string | null
          level: Database["public"]["Enums"]["jlpt_level"] | null
          mastery: number
          repetitions: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          ease_factor?: number
          id?: string
          interval_days?: number
          item_id: string
          item_type: Database["public"]["Enums"]["item_kind"]
          lapses?: number
          last_reviewed_at?: string | null
          level?: Database["public"]["Enums"]["jlpt_level"] | null
          mastery?: number
          repetitions?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          ease_factor?: number
          id?: string
          interval_days?: number
          item_id?: string
          item_type?: Database["public"]["Enums"]["item_kind"]
          lapses?: number
          last_reviewed_at?: string | null
          level?: Database["public"]["Enums"]["jlpt_level"] | null
          mastery?: number
          repetitions?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_grammar_target: number
          daily_kanji_target: number
          daily_reminder: boolean
          daily_vocab_target: number
          furigana_enabled: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_grammar_target?: number
          daily_kanji_target?: number
          daily_reminder?: boolean
          daily_vocab_target?: number
          furigana_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_grammar_target?: number
          daily_kanji_target?: number
          daily_reminder?: boolean
          daily_vocab_target?: number
          furigana_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          current_streak: number
          estimated_cefr: Database["public"]["Enums"]["cefr_level"] | null
          last_active_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          estimated_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          last_active_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          estimated_cefr?: Database["public"]["Enums"]["cefr_level"] | null
          last_active_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          created_at: string
          examples: Json
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          meaning_en: string | null
          meaning_id: string
          part_of_speech: string | null
          reading: string
          romaji: string | null
          sort_order: number
          source: Database["public"]["Enums"]["content_source"]
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          examples?: Json
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["jlpt_level"]
          meaning_en?: string | null
          meaning_id: string
          part_of_speech?: string | null
          reading: string
          romaji?: string | null
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          examples?: Json
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["jlpt_level"]
          meaning_en?: string | null
          meaning_id?: string
          part_of_speech?: string | null
          reading?: string
          romaji?: string | null
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_content_editor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      content_source: "eno_original" | "reference_derived"
      item_kind: "kanji" | "vocabulary" | "grammar"
      jlpt_level: "N5" | "N4" | "N3" | "N2" | "N1"
      question_kind:
        | "multiple_choice"
        | "fill_blank"
        | "ordering"
        | "listening_choice"
      skill_kind: "kanji" | "vocabulary" | "grammar" | "reading" | "listening"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      content_source: ["eno_original", "reference_derived"],
      item_kind: ["kanji", "vocabulary", "grammar"],
      jlpt_level: ["N5", "N4", "N3", "N2", "N1"],
      question_kind: [
        "multiple_choice",
        "fill_blank",
        "ordering",
        "listening_choice",
      ],
      skill_kind: ["kanji", "vocabulary", "grammar", "reading", "listening"],
    },
  },
} as const
