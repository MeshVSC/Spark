import { supabase } from '../supabase'
import type { Database } from '../supabase'

type Subtask = Database['public']['Tables']['subtasks']['Row']
type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert']
type SubtaskUpdate = Database['public']['Tables']['subtasks']['Update']

// Helper function to get current user ID
async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  return user.id
}

// Get subtasks for a specific task
export async function getSubtasks(taskId: string) {
  const userId = await getUserId()
  
  const { data: subtasks, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return subtasks || []
}

// Create new subtask
export async function createSubtask(subtaskData: Omit<SubtaskInsert, 'user_id' | 'completed' | 'sort_order'>) {
  const userId = await getUserId()
  
  // Verify the parent task belongs to the user
  const { data: task } = await supabase
    .from('tasks')
    .select('user_id')
    .eq('id', subtaskData.task_id)
    .single()
  
  if (!task || task.user_id !== userId) {
    throw new Error('Task not found or unauthorized')
  }
  
  const { data, error } = await supabase
    .from('subtasks')
    .insert({
      ...subtaskData,
      user_id: userId,
      completed: false,
      sort_order: Math.floor(Date.now() / 1000), // Use seconds instead of milliseconds
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update subtask
export async function updateSubtask(id: string, updates: SubtaskUpdate) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!subtask || subtask.user_id !== userId) {
    throw new Error('Subtask not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('subtasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Toggle subtask completion
export async function toggleSubtask(id: string) {
  const userId = await getUserId()
  
  // Get current subtask state
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('completed, user_id')
    .eq('id', id)
    .single()
  
  if (!subtask || subtask.user_id !== userId) {
    throw new Error('Subtask not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('subtasks')
    .update({
      completed: !subtask.completed,
      completed_at: !subtask.completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete subtask
export async function deleteSubtask(id: string) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!subtask || subtask.user_id !== userId) {
    throw new Error('Subtask not found or unauthorized')
  }

  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Real-time subscription for subtasks
export function subscribeToSubtasks(taskId: string, callback: (subtasks: Subtask[]) => void) {
  return supabase
    .channel(`subtasks-${taskId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'subtasks',
        filter: `task_id=eq.${taskId}`
      }, 
      (payload) => {
        // Re-fetch subtasks when changes occur
        getSubtasks(taskId).then(callback)
      }
    )
    .subscribe()
}