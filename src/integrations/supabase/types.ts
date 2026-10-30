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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          last_seen: string | null
          role: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          last_seen?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          last_seen?: string | null
          role?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          id: string
          is_admin: boolean
          message: string
          read: boolean
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          is_admin?: boolean
          message: string
          read?: boolean
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          is_admin?: boolean
          message?: string
          read?: boolean
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          delivery_status: string
          id: string
          items: Json
          note: string | null
          payment_method: string | null
          payment_status: string
          proof_path: string | null
          status: string
          total: number
        }
        Insert: {
          address: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          delivery_status?: string
          id?: string
          items?: Json
          note?: string | null
          payment_method?: string | null
          payment_status?: string
          proof_path?: string | null
          status?: string
          total?: number
        }
        Update: {
          address?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          delivery_status?: string
          id?: string
          items?: Json
          note?: string | null
          payment_method?: string | null
          payment_status?: string
          proof_path?: string | null
          status?: string
          total?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          available: boolean
          category: string
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          images: string[]
          name: string
          old_price: number | null
          price: number
          stock: number
        }
        Insert: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[]
          name: string
          old_price?: number | null
          price?: number
          stock?: number
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[]
          name?: string
          old_price?: number | null
          price?: number
          stock?: number
        }
        Relationships: []
      }
      public_payment_info: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_details: string | null
          bank_name: string | null
          id: number
          powered_by_url: string | null
          store_name: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_details?: string | null
          bank_name?: string | null
          id?: number
          powered_by_url?: string | null
          store_name?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_details?: string | null
          bank_name?: string | null
          id?: number
          powered_by_url?: string | null
          store_name?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_heartbeat: { Args: never; Returns: undefined }
      any_admin_online: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
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
