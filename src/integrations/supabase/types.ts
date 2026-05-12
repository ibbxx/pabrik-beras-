export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      product_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          slug: string
          description: string | null
          short_description: string | null
          price: number
          unit: string
          weight_kg: number | null
          stock: number
          min_order: number | null
          is_active: boolean | null
          is_featured: boolean | null
          main_image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          price: number
          unit: string
          weight_kg?: number | null
          stock: number
          min_order?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          main_image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          price?: number
          unit?: string
          weight_kg?: number | null
          stock?: number
          min_order?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          main_image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          full_name: string
          whatsapp: string
          email: string | null
          address: string
          city: string
          district: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          whatsapp: string
          email?: string | null
          address: string
          city: string
          district: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          whatsapp?: string
          email?: string | null
          address?: string
          city?: string
          district?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          order_code: string
          customer_id: string | null
          status: string | null
          subtotal: number | null
          shipping_cost: number | null
          total_amount: number | null
          payment_method: string | null
          customer_note: string | null
          admin_note: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_code: string
          customer_id?: string | null
          status?: string | null
          subtotal?: number | null
          shipping_cost?: number | null
          total_amount?: number | null
          payment_method?: string | null
          customer_note?: string | null
          admin_note?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_code?: string
          customer_id?: string | null
          status?: string | null
          subtotal?: number | null
          shipping_cost?: number | null
          total_amount?: number | null
          payment_method?: string | null
          customer_note?: string | null
          admin_note?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          price_at_time: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          price_at_time: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          price_at_time?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string | null
          amount: number
          payment_method: string
          proof_url: string | null
          status: string | null
          verified_by: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          amount: number
          payment_method: string
          proof_url?: string | null
          status?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          amount?: number
          payment_method?: string
          proof_url?: string | null
          status?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      faqs: {
        Row: {
          id: string
          question: string
          answer: string
          order_num: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          order_num?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          order_num?: number | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          image_url: string | null
          is_active: boolean | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: string
          excerpt?: string | null
          image_url?: string | null
          is_active?: boolean | null
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          image_url?: string | null
          is_active?: boolean | null
          published_at?: string | null
          created_at?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          name: string
          role: string | null
          content: string
          rating: number | null
          avatar_url: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: string | null
          content: string
          rating?: number | null
          avatar_url?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string | null
          content?: string
          rating?: number | null
          avatar_url?: string | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: any
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          description?: string | null
          updated_at?: string
        }
      }
      reseller_applications: {
        Row: {
          id: string
          name: string
          whatsapp: string
          business_name: string
          location: string
          volume_needs: string
          message: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          whatsapp: string
          business_name: string
          location: string
          volume_needs: string
          message?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          whatsapp?: string
          business_name?: string
          location?: string
          volume_needs?: string
          message?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
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
