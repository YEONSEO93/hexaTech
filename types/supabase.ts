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
      company: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      event: {
        Row: {
          category_id: number
          company_id: number
          details: string | null
          end_date: string | null
          id: number
          name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          subcategory_id: number
          total_attendee_category:
            | Database["public"]["Enums"]["attendee_bucket"]
            | null
          total_attendees: number | null
          venue_id: number
        }
        Insert: {
          category_id: number
          company_id: number
          details?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          subcategory_id: number
          total_attendee_category?:
            | Database["public"]["Enums"]["attendee_bucket"]
            | null
          total_attendees?: number | null
          venue_id: number
        }
        Update: {
          category_id?: number
          company_id?: number
          details?: string | null
          end_date?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          subcategory_id?: number
          total_attendee_category?:
            | Database["public"]["Enums"]["attendee_bucket"]
            | null
          total_attendees?: number | null
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
            foreignKeyName: "event_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
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
          company_id: number | null
          created_at: string
          email: string
          id: string
          must_change_password: boolean | null
          name: string | null
          profile_photo: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          company: string
          company_id?: number | null
          created_at?: string
          email: string
          id?: string
          must_change_password?: boolean | null
          name?: string | null
          profile_photo?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          company?: string
          company_id?: number | null
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean | null
          name?: string | null
          profile_photo?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
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
      insert_event_if_not_exists: {
        Args: {
          event_title: string
          start_date: string
          venue_name: string
          status: string
          end_date?: string
          total_attendees?: number
          details?: string
          category_name?: Database["public"]["Enums"]["category_name"]
          subcategory_name?: Database["public"]["Enums"]["sub_category_name"]
          total_attendee_category?: string
          company_name?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      attendee_bucket:
        | "<500"
        | "501-1,000"
        | "1,001-3,000"
        | "3,001-5,000"
        | "5,001-10,000"
        | "10,001-25,000"
        | "25,001-50,000"
        | ">50,000"
        | "INFO ONLY"
      category_name:
        | "Mega Event"
        | "Business Event"
        | "Concert"
        | "Mass Participation"
        | "Major Event"
        | "Key Cultural Event"
        | "Trans/Infra Disrupt"
      event_status: "PENDING" | "ANNOUNCED"
      role: "ADMIN" | "USER"
      sub_category_name:
        | "Arts & Culture"
        | "Business Event"
        | "Lifestyle"
        | "Music"
        | "Sport (Non-Olympic / Paralympic)"
        | "Sport (Olympic / Paralympic)"
        | "STEM"
        | "Trans/Infra Disrupt"
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
      attendee_bucket: [
        "<500",
        "501-1,000",
        "1,001-3,000",
        "3,001-5,000",
        "5,001-10,000",
        "10,001-25,000",
        "25,001-50,000",
        ">50,000",
        "INFO ONLY",
      ],
      category_name: [
        "Mega Event",
        "Business Event",
        "Concert",
        "Mass Participation",
        "Major Event",
        "Key Cultural Event",
        "Trans/Infra Disrupt",
      ],
      event_status: ["PENDING", "ANNOUNCED"],
      role: ["ADMIN", "USER"],
      sub_category_name: [
        "Arts & Culture",
        "Business Event",
        "Lifestyle",
        "Music",
        "Sport (Non-Olympic / Paralympic)",
        "Sport (Olympic / Paralympic)",
        "STEM",
        "Trans/Infra Disrupt",
      ],
    },
  },
} as const
