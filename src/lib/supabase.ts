import { createClient } from '@supabase/supabase-js'

// These will be your Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Make supabase available globally for development
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase
}

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log("🔗 Testing Supabase connection...");
    console.log("URL:", supabaseUrl);
    console.log("Anon Key (first 20 chars):", supabaseAnonKey.substring(0, 20) + "...");
    
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Supabase connection test failed:", error);
      return false;
    }
    console.log("✅ Supabase connection successful");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection error:", error);
    return false;
  }
}

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          user_id: string
          is_archived: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          user_id: string
          is_archived?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          user_id?: string
          is_archived?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high' | null
          area_id: string | null
          tags: string[] | null
          user_id: string
          is_archived: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          area_id?: string | null
          tags?: string[] | null
          user_id: string
          is_archived?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          area_id?: string | null
          tags?: string[] | null
          user_id?: string
          is_archived?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          notes: string | null
          completed: boolean | null
          completed_at: string | null
          due_date: string | null
          scheduled_date: string | null
          priority: 'low' | 'medium' | 'high' | null
          project_id: string | null
          area_id: string | null
          user_id: string
          sort_order: number | null
          tags: string[] | null
          is_deleted: boolean | null
          duration: number | null
          is_recurring: boolean | null
          recurring_pattern: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          notes?: string | null
          completed?: boolean | null
          completed_at?: string | null
          due_date?: string | null
          scheduled_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          project_id?: string | null
          area_id?: string | null
          user_id: string
          sort_order?: number | null
          tags?: string[] | null
          is_deleted?: boolean | null
          duration?: number | null
          is_recurring?: boolean | null
          recurring_pattern?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          notes?: string | null
          completed?: boolean | null
          completed_at?: string | null
          due_date?: string | null
          scheduled_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          project_id?: string | null
          area_id?: string | null
          user_id?: string
          sort_order?: number | null
          tags?: string[] | null
          is_deleted?: boolean | null
          duration?: number | null
          is_recurring?: boolean | null
          recurring_pattern?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          title: string
          completed: boolean | null
          completed_at: string | null
          task_id: string
          user_id: string
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          completed?: boolean | null
          completed_at?: string | null
          task_id: string
          user_id: string
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          completed?: boolean | null
          completed_at?: string | null
          task_id?: string
          user_id?: string
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      time_blocks: {
        Row: {
          id: string
          title: string
          start_time: string
          end_time: string
          task_id: string | null
          user_id: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          start_time: string
          end_time: string
          task_id?: string | null
          user_id: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          start_time?: string
          end_time?: string
          task_id?: string | null
          user_id?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      recurring_tasks: {
        Row: {
          id: string
          pattern: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval_value: number
          days_of_week: number[] | null
          end_date: string | null
          occurrences: number | null
          user_id: string
          is_active: boolean | null
          last_generated: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pattern: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval_value?: number
          days_of_week?: number[] | null
          end_date?: string | null
          occurrences?: number | null
          user_id: string
          is_active?: boolean | null
          last_generated?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pattern?: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval_value?: number
          days_of_week?: number[] | null
          end_date?: string | null
          occurrences?: number | null
          user_id?: string
          is_active?: boolean | null
          last_generated?: string | null
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
      priority_level: 'low' | 'medium' | 'high'
      recurring_pattern: 'daily' | 'weekly' | 'monthly' | 'custom'
    }
  }
}