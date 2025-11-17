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
      coffee_shops: {
        Row: {
          id: string
          name: string
          description: string | null
          image: string | null
          location_latitude: number | null
          location_longitude: number | null
          active: boolean
          deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          active?: boolean
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          active?: boolean
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          coffee_shop_id: string
          street: string | null
          city: string | null
          country: string | null
          deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coffee_shop_id: string
          street?: string | null
          city?: string | null
          country?: string | null
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coffee_shop_id?: string
          street?: string | null
          city?: string | null
          country?: string | null
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            referencedRelation: "coffee_shops"
            referencedColumns: ["id"]
          }
        ]
      }
      schedules: {
        Row: {
          id: string
          coffee_shop_id: string
          day_of_week: number
          open_time: string | null
          close_time: string | null
          closed: boolean
          deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coffee_shop_id: string
          day_of_week: number
          open_time?: string | null
          close_time?: string | null
          closed?: boolean
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coffee_shop_id?: string
          day_of_week?: number
          open_time?: string | null
          close_time?: string | null
          closed?: boolean
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            referencedRelation: "coffee_shops"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          coffee_shop_id: string
          type: string
          value: string
          deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coffee_shop_id: string
          type: string
          value: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coffee_shop_id?: string
          type?: string
          value?: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            referencedRelation: "coffee_shops"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmark_lists: {
        Row: {
          id: string
          name: string
          user_id: string
          deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          bookmark_list_id: string
          coffee_shop_id: string
          user_id: string
          deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bookmark_list_id: string
          coffee_shop_id: string
          user_id: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bookmark_list_id?: string
          coffee_shop_id?: string
          user_id?: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_bookmark_list_id_fkey"
            columns: ["bookmark_list_id"]
            referencedRelation: "bookmark_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            referencedRelation: "coffee_shops"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          coffee_shop_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
          deleted: boolean
        }
        Insert: {
          id?: string
          coffee_shop_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
        Update: {
          id?: string
          coffee_shop_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
          deleted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            referencedRelation: "coffee_shops"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          coffee_shop_id: string
          user_id: string
          report_type: string
          description: string | null
          status: string
          deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coffee_shop_id: string
          user_id: string
          report_type: string
          description?: string | null
          status?: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coffee_shop_id?: string
          user_id?: string
          report_type?: string
          description?: string | null
          status?: string
          deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            referencedRelation: "coffee_shops"
            referencedColumns: ["id"]
          }
        ]
      }
      views: {
        Row: {
          id: string
          coffee_shop_id: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coffee_shop_id: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coffee_shop_id?: string
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "views_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            referencedRelation: "coffee_shops"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
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
  }
}
