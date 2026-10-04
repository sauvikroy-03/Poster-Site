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
      cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          prod_id: string
          quantity: number
          updated_at: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          cart_id?: string
          created_at?: string | null
          prod_id: string
          quantity?: number
          updated_at?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          prod_id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_prod_id_fkey"
            columns: ["prod_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["prod_id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      categories: {
        Row: {
          category_name: string
          id: string
          slug: string
        }
        Insert: {
          category_name: string
          id?: string
          slug: string
        }
        Update: {
          category_name?: string
          id?: string
          slug?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          discount_applied: number
          id: string
          order_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_applied: number
          id?: string
          order_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_applied?: number
          id?: string
          order_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["coupon_id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      coupons: {
        Row: {
          coupon_code: string
          coupon_id: string
          created_at: string
          description: string | null
          discount_amount: number
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          end_datetime: string
          is_active: boolean
          max_discount_amount: number | null
          maximum_order_value: number | null
          minimum_order_value: number
          per_user_limit: number
          start_datetime: string
          total_usage: number
          updated_at: string
          usage_limit: number | null
          user_type: Database["public"]["Enums"]["coupon_user_type"]
        }
        Insert: {
          coupon_code: string
          coupon_id?: string
          created_at?: string
          description?: string | null
          discount_amount?: number
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          end_datetime: string
          is_active?: boolean
          max_discount_amount?: number | null
          maximum_order_value?: number | null
          minimum_order_value?: number
          per_user_limit?: number
          start_datetime: string
          total_usage?: number
          updated_at?: string
          usage_limit?: number | null
          user_type?: Database["public"]["Enums"]["coupon_user_type"]
        }
        Update: {
          coupon_code?: string
          coupon_id?: string
          created_at?: string
          description?: string | null
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          end_datetime?: string
          is_active?: boolean
          max_discount_amount?: number | null
          maximum_order_value?: number | null
          minimum_order_value?: number
          per_user_limit?: number
          start_datetime?: string
          total_usage?: number
          updated_at?: string
          usage_limit?: number | null
          user_type?: Database["public"]["Enums"]["coupon_user_type"]
        }
        Relationships: []
      }
      materials: {
        Row: {
          gsm: number
          id: string
          material_name: string
        }
        Insert: {
          gsm: number
          id?: string
          material_name: string
        }
        Update: {
          gsm?: number
          id?: string
          material_name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          line_total: number
          order_id: string
          order_item_id: string
          prod_image: string | null
          prod_material: string | null
          prod_name: string
          prod_size: string | null
          product_id: string | null
          quantity: number
          sku: string | null
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          line_total: number
          order_id: string
          order_item_id?: string
          prod_image?: string | null
          prod_material?: string | null
          prod_name: string
          prod_size?: string | null
          product_id?: string | null
          quantity: number
          sku?: string | null
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          line_total?: number
          order_id?: string
          order_item_id?: string
          prod_image?: string | null
          prod_material?: string | null
          prod_name?: string
          prod_size?: string | null
          product_id?: string | null
          quantity?: number
          sku?: string | null
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["prod_id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string
          history_id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_at?: string
          history_id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_at?: string
          history_id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          delivery_charge: number
          discount_amount: number
          discount_details: Json | null
          notes: string | null
          order_id: string
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          placed_at: string
          shipping_address: Json
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          delivery_charge?: number
          discount_amount?: number
          discount_details?: Json | null
          notes?: string | null
          order_id?: string
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          shipping_address: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          delivery_charge?: number
          discount_amount?: number
          discount_details?: Json | null
          notes?: string | null
          order_id?: string
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failure_reason: string | null
          gateway: string
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gateway_signature: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          order_id: string
          payment_id: string
          raw_response: Json | null
          status: Database["public"]["Enums"]["payment_txn_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          order_id: string
          payment_id?: string
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["payment_txn_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          order_id?: string
          payment_id?: string
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["payment_txn_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string | null
          is_in_stock: boolean
          prod_id: string
          prod_material: string | null
          prod_price: number
          prod_size: string
          sku: string | null
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string | null
          is_in_stock?: boolean
          prod_id: string
          prod_material?: string | null
          prod_price: number
          prod_size: string
          sku?: string | null
          updated_at?: string | null
          variant_id?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string | null
          is_in_stock?: boolean
          prod_id?: string
          prod_material?: string | null
          prod_price?: number
          prod_size?: string
          sku?: string | null
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_prod_id_fkey"
            columns: ["prod_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["prod_id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          hero_visible: boolean
          is_trending: boolean
          prod_category: string
          prod_description: string | null
          prod_id: string
          prod_images: string[]
          prod_is_active: boolean
          prod_name: string
          prod_preview_image: string
          prod_slug: string
          prod_tags: string[] | null
          raw_prod_images: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hero_visible?: boolean
          is_trending?: boolean
          prod_category: string
          prod_description?: string | null
          prod_id?: string
          prod_images?: string[]
          prod_is_active?: boolean
          prod_name: string
          prod_preview_image?: string
          prod_slug: string
          prod_tags?: string[] | null
          raw_prod_images: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hero_visible?: boolean
          is_trending?: boolean
          prod_category?: string
          prod_description?: string | null
          prod_id?: string
          prod_images?: string[]
          prod_is_active?: boolean
          prod_name?: string
          prod_preview_image?: string
          prod_slug?: string
          prod_tags?: string[] | null
          raw_prod_images?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      user_address: {
        Row: {
          address_line1: string
          address_type: Database["public"]["Enums"]["address_type"]
          city: string
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_default: boolean
          landmark: string | null
          last_name: string
          phone_country_iso2: string
          phone_dial_code: string
          phone_number: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_type?: Database["public"]["Enums"]["address_type"]
          city: string
          country?: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          last_name: string
          phone_country_iso2?: string
          phone_dial_code?: string
          phone_number: string
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_type?: Database["public"]["Enums"]["address_type"]
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          last_name?: string
          phone_country_iso2?: string
          phone_dial_code?: string
          phone_number?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          dob: string | null
          email: string
          first_name: string | null
          is_email_verified: boolean
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dob?: string | null
          email: string
          first_name?: string | null
          is_email_verified?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dob?: string | null
          email?: string
          first_name?: string | null
          is_email_verified?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
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
      address_type: "home" | "office"
      coupon_discount_type: "percentage" | "amount"
      coupon_user_type: "all" | "new" | "existing"
      discount_type: "percentage" | "fixed"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "returned"
        | "refunded"
      payment_method: "card" | "upi" | "netbanking" | "cod" | "wallet"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      payment_txn_status:
        | "created"
        | "pending"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
        | "partially_refunded"
      user_role: "CUSTOMER" | "ADMIN"
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
    Enums: {
      address_type: ["home", "office"],
      coupon_discount_type: ["percentage", "amount"],
      coupon_user_type: ["all", "new", "existing"],
      discount_type: ["percentage", "fixed"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      payment_method: ["card", "upi", "netbanking", "cod", "wallet"],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      payment_txn_status: [
        "created",
        "pending",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      user_role: ["CUSTOMER", "ADMIN"],
    },
  },
} as const
