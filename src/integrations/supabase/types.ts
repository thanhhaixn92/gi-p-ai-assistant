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
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          auto_create_tasks: boolean
          created_at: string
          custom_system_prompt: string
          id: string
          max_history: number
          model: string
          personal_context: string
          temperature: number
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_create_tasks?: boolean
          created_at?: string
          custom_system_prompt?: string
          id?: string
          max_history?: number
          model?: string
          personal_context?: string
          temperature?: number
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_create_tasks?: boolean
          created_at?: string
          custom_system_prompt?: string
          id?: string
          max_history?: number
          model?: string
          personal_context?: string
          temperature?: number
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      editorial_exports: {
        Row: {
          approved_image_count: number
          created_at: string
          file_name: string
          format: string
          id: string
          session_id: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          approved_image_count?: number
          created_at?: string
          file_name: string
          format?: string
          id?: string
          session_id: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          approved_image_count?: number
          created_at?: string
          file_name?: string
          format?: string
          id?: string
          session_id?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_exports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "editorial_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_images: {
        Row: {
          alt_text: string
          caption: string
          created_at: string
          height: number | null
          id: string
          paragraph_anchor: string | null
          prompt: string | null
          quality_status: Database["public"]["Enums"]["editorial_image_quality"]
          review_status: Database["public"]["Enums"]["editorial_image_review"]
          session_id: string
          source: string
          storage_path: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          alt_text?: string
          caption?: string
          created_at?: string
          height?: number | null
          id?: string
          paragraph_anchor?: string | null
          prompt?: string | null
          quality_status?: Database["public"]["Enums"]["editorial_image_quality"]
          review_status?: Database["public"]["Enums"]["editorial_image_review"]
          session_id: string
          source?: string
          storage_path: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          alt_text?: string
          caption?: string
          created_at?: string
          height?: number | null
          id?: string
          paragraph_anchor?: string | null
          prompt?: string | null
          quality_status?: Database["public"]["Enums"]["editorial_image_quality"]
          review_status?: Database["public"]["Enums"]["editorial_image_review"]
          session_id?: string
          source?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_images_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "editorial_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_sessions: {
        Row: {
          article_type: Database["public"]["Enums"]["editorial_article_type"]
          assignment_code: string | null
          brief: string
          category_code: string | null
          created_at: string
          current_content: string
          id: string
          status: Database["public"]["Enums"]["editorial_session_status"]
          task_type: Database["public"]["Enums"]["editorial_task_type"]
          title: string
          tone: Database["public"]["Enums"]["editorial_tone"]
          updated_at: string
          user_id: string
        }
        Insert: {
          article_type?: Database["public"]["Enums"]["editorial_article_type"]
          assignment_code?: string | null
          brief?: string
          category_code?: string | null
          created_at?: string
          current_content?: string
          id?: string
          status?: Database["public"]["Enums"]["editorial_session_status"]
          task_type?: Database["public"]["Enums"]["editorial_task_type"]
          title: string
          tone?: Database["public"]["Enums"]["editorial_tone"]
          updated_at?: string
          user_id: string
        }
        Update: {
          article_type?: Database["public"]["Enums"]["editorial_article_type"]
          assignment_code?: string | null
          brief?: string
          category_code?: string | null
          created_at?: string
          current_content?: string
          id?: string
          status?: Database["public"]["Enums"]["editorial_session_status"]
          task_type?: Database["public"]["Enums"]["editorial_task_type"]
          title?: string
          tone?: Database["public"]["Enums"]["editorial_tone"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      editorial_sources: {
        Row: {
          created_at: string
          fetched_at: string | null
          id: string
          label: string | null
          raw_text: string | null
          session_id: string
          source_type: string
          storage_path: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string | null
          id?: string
          label?: string | null
          raw_text?: string | null
          session_id: string
          source_type?: string
          storage_path?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fetched_at?: string | null
          id?: string
          label?: string | null
          raw_text?: string | null
          session_id?: string
          source_type?: string
          storage_path?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_sources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "editorial_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_versions: {
        Row: {
          content: string
          created_at: string
          id: string
          note: string | null
          session_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          note?: string | null
          session_id: string
          user_id: string
          version_number?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note?: string | null
          session_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "editorial_versions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "editorial_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          assignment_code: string | null
          category_code: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_code?: string | null
          category_code?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_code?: string | null
          category_code?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_assignment_code_fkey"
            columns: ["assignment_code"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "notes_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number
          storage_path: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          storage_path: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          storage_path?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          note: string | null
          phone: string | null
          role: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          note?: string | null
          phone?: string | null
          role?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          note?: string | null
          phone?: string | null
          role?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_contacts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignment_code: string | null
          category_code: string | null
          completed_at: string | null
          created_at: string
          department_codes: string[]
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_code?: string | null
          category_code?: string | null
          completed_at?: string | null
          created_at?: string
          department_codes?: string[]
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_code?: string | null
          category_code?: string | null
          completed_at?: string | null
          created_at?: string
          department_codes?: string[]
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignment_code_fkey"
            columns: ["assignment_code"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tasks_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      editorial_article_type:
        | "news"
        | "notice"
        | "report"
        | "plan"
        | "analysis"
        | "minutes"
        | "other"
      editorial_image_quality:
        | "unrated"
        | "good"
        | "broken"
        | "needs_replacement"
      editorial_image_review: "suggested" | "approved" | "rejected"
      editorial_session_status:
        | "draft"
        | "composing"
        | "reviewing_images"
        | "ready"
        | "exported"
        | "archived"
      editorial_task_type:
        | "generate"
        | "edit"
        | "summarize"
        | "proofread"
        | "expand"
        | "shorten"
        | "normalize_tone"
      editorial_tone: "formal" | "neutral" | "friendly" | "concise" | "detailed"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "doing" | "review" | "done" | "blocked"
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
      editorial_article_type: [
        "news",
        "notice",
        "report",
        "plan",
        "analysis",
        "minutes",
        "other",
      ],
      editorial_image_quality: [
        "unrated",
        "good",
        "broken",
        "needs_replacement",
      ],
      editorial_image_review: ["suggested", "approved", "rejected"],
      editorial_session_status: [
        "draft",
        "composing",
        "reviewing_images",
        "ready",
        "exported",
        "archived",
      ],
      editorial_task_type: [
        "generate",
        "edit",
        "summarize",
        "proofread",
        "expand",
        "shorten",
        "normalize_tone",
      ],
      editorial_tone: ["formal", "neutral", "friendly", "concise", "detailed"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "doing", "review", "done", "blocked"],
    },
  },
} as const
