export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      category: {
        Row: {
          description: string | null
          id: number
          name: Database["public"]["Enums"]["category_name"] | null
        }
        Insert: {
          description?: string | null
          id?: number
          name?: Database["public"]["Enums"]["category_name"] | null
        }
        Update: {
          description?: string | null
          id?: number
          name?: Database["public"]["Enums"]["category_name"] | null
        }
        Relationships: []
      }
      event: {
        Row: {
          category_id: number
          details: string | null
          end_date: string | null
          id: number
          name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          subcategory_id: number
          total_attendees: number | null
          user_id: string
          venue_id: number
        }
        Insert: {
          category_id: number
          details?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          subcategory_id: number
          total_attendees?: number | null
          user_id: string
          venue_id: number
        }
        Update: {
          category_id?: number
          details?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          subcategory_id?: number
          total_attendees?: number | null
          user_id?: string
          venue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "sub_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assignments: {
        Row: {
          assigned_at: string | null
          collaborator_id: string
          event_id: number
        }
        Insert: {
          assigned_at?: string | null
          collaborator_id: string
          event_id: number
        }
        Update: {
          assigned_at?: string | null
          collaborator_id?: string
          event_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_category: {
        Row: {
          id: number
          name: Database["public"]["Enums"]["sub_category_name"] | null
        }
        Insert: {
          id?: number
          name?: Database["public"]["Enums"]["sub_category_name"] | null
        }
        Update: {
          id?: number
          name?: Database["public"]["Enums"]["sub_category_name"] | null
        }
        Relationships: []
      }
      users: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          must_change_password: boolean | null
          name: string
          role: string
          updated_at: string | null
          profile_photo: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id: string
          must_change_password?: boolean | null
          name: string
          role: string
          updated_at?: string | null
          profile_photo?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean | null
          name?: string
          role?: string
          updated_at?: string | null
          profile_photo?: string | null
        }
        Relationships: []
      }
      venue: {
        Row: {
          id: number
          location: string | null
          name: string | null
        }
        Insert: {
          id?: number
          location?: string | null
          name?: string | null
        }
        Update: {
          id?: number
          location?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      category_name:
        | "MEGA_EVENT"
        | "MAJOR_EVENT"
        | "MASS_PARTICIPATION_EVENT"
        | "BUSINESS_EVENT"
        | "CONCERT"
      event_status: "PENDING" | "ANNOUNCED"
      role: "ADMIN" | "USER"
      sub_category_name:
        | "SPORT_OLYMPIC_PARALYMPIC"
        | "NON_OLYMPIC"
        | "ARTS_AND_CULTURE"
        | "STEM"
        | "LIFESTYLE"
        | "MUSIC"
        | "TRANS_INFRA_DISRUPT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      category_name: [
        "MEGA_EVENT",
        "MAJOR_EVENT",
        "MASS_PARTICIPATION_EVENT",
        "BUSINESS_EVENT",
        "CONCERT",
      ],
      event_status: ["PENDING", "ANNOUNCED"],
      role: ["ADMIN", "USER"],
      sub_category_name: [
        "SPORT_OLYMPIC_PARALYMPIC",
        "NON_OLYMPIC",
        "ARTS_AND_CULTURE",
        "STEM",
        "LIFESTYLE",
        "MUSIC",
        "TRANS_INFRA_DISRUPT",
      ],
    },
  },
} as const
