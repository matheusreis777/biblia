// Gerado a partir do schema do Supabase (projeto Biblia).
// Para atualizar depois de mudar tabelas:
//   npx supabase gen types typescript --project-id lmpnjidnzgcqerlbimus > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      favorite_verses: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          text: string | null
          user_id: string
          verse: number
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          id?: string
          text?: string | null
          user_id: string
          verse: number
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          text?: string | null
          user_id?: string
          verse?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          chapter: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: number
          updated_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
