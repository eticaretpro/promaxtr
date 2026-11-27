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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      admin_phones: {
        Row: {
          created_at: string
          label: string
          phone_e164: string
        }
        Insert: {
          created_at?: string
          label?: string
          phone_e164: string
        }
        Update: {
          created_at?: string
          label?: string
          phone_e164?: string
        }
        Relationships: []
      }
      business_groups: {
        Row: {
          color: string
          created_at: string
          description: string
          id: string
          name: string
          owner_phone_e164: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          owner_phone_e164: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_phone_e164?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_sessions: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string
          id: string
          phone_e164: string
          token_hash: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at: string
          id?: string
          phone_e164: string
          token_hash: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_e164?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string
          category: string
          claimed_at: string | null
          created_at: string
          district: string
          id: string
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          mobile_phone: string
          mobile_phone_e164: string
          opening_hours: Json | null
          place_id: string | null
          province: string
          rating: number | null
          review_count: number
          slug: string
          source: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string
          category: string
          claimed_at?: string | null
          created_at?: string
          district: string
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          mobile_phone: string
          mobile_phone_e164: string
          opening_hours?: Json | null
          place_id?: string | null
          province: string
          rating?: number | null
          review_count?: number
          slug: string
          source?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          category?: string
          claimed_at?: string | null
          created_at?: string
          district?: string
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          mobile_phone?: string
          mobile_phone_e164?: string
          opening_hours?: Json | null
          place_id?: string | null
          province?: string
          rating?: number | null
          review_count?: number
          slug?: string
          source?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts: number
          code_hash: string | null
          created_at: string
          expires_at: string
          external_otp_id: string | null
          id: string
          phone_e164: string
          provider: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash?: string | null
          created_at?: string
          expires_at: string
          external_otp_id?: string | null
          id?: string
          phone_e164: string
          provider?: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string | null
          created_at?: string
          expires_at?: string
          external_otp_id?: string | null
          id?: string
          phone_e164?: string
          provider?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      saved_businesses: {
        Row: {
          business_id: string
          created_at: string
          group_id: string
          id: string
          note: string
          owner_phone_e164: string
        }
        Insert: {
          business_id: string
          created_at?: string
          group_id: string
          id?: string
          note?: string
          owner_phone_e164: string
        }
        Update: {
          business_id?: string
          created_at?: string
          group_id?: string
          id?: string
          note?: string
          owner_phone_e164?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_businesses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "business_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          district: string
          id: string
          keyword: string
          province: string
          result_count: number
          visitor_key: string
        }
        Insert: {
          created_at?: string
          district: string
          id?: string
          keyword: string
          province: string
          result_count?: number
          visitor_key: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          keyword?: string
          province?: string
          result_count?: number
          visitor_key?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string
          is_secret: boolean
          key: string
          updated_at: string
          updated_by_phone: string | null
          value: string
        }
        Insert: {
          description?: string
          is_secret?: boolean
          key: string
          updated_at?: string
          updated_by_phone?: string | null
          value?: string
        }
        Update: {
          description?: string
          is_secret?: boolean
          key?: string
          updated_at?: string
          updated_by_phone?: string | null
          value?: string
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
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
