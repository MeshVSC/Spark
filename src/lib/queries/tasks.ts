import { supabase } from '../supabase'
import type { Database } from '../supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']
type RecurringTaskInsert = Database['public']['Tables']['recurring_tasks']['Insert']
type RecurringTaskUpdate = Database['public']['Tables']['recurring_tasks']['Update']

// Helper function to get current user ID
async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  return user.id
}

// Get tasks with filtering
export async function getTasks({
  view,
  projectId,
  areaId,
}: {
  view?: 'inbox' | 'today' | 'upcoming' | 'someday' | 'completed'
  projectId?: string | null
  areaId?: string | null
} = {}) {
  const userId = await getUserId()
  
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)

  // Apply project/area filters
  if (projectId) {
    query = query.eq('project_id', projectId)
  } else if (areaId) {
    query = query.eq('area_id', areaId)
  }

  const { data: tasks, error } = await query
  
  if (error) throw error
  if (!tasks) return []

  const now = new Date()
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const todayEnd = today.getTime()

  // Apply view filters
  const filteredTasks = tasks.filter(task => {
    switch (view) {
      case 'inbox':
        return !task.completed && 
               !task.scheduled_date && 
               !task.due_date && 
               !task.project_id && 
               !task.area_id
      case 'today':
        return !task.completed && (
          (task.scheduled_date && new Date(task.scheduled_date).getTime() <= todayEnd) ||
          (task.due_date && new Date(task.due_date).getTime() <= todayEnd)
        )
      case 'upcoming':
        return !task.completed && (
          (task.scheduled_date && new Date(task.scheduled_date).getTime() > todayEnd) ||
          (task.due_date && new Date(task.due_date).getTime() > todayEnd)
        )
      case 'someday':
        return !task.completed && 
               !task.scheduled_date && 
               !task.due_date && 
               (task.project_id || task.area_id)
      case 'completed':
        return task.completed
      case 'all':
        return !task.completed  // Return all non-completed tasks for grouping
      default:
        return !task.completed
    }
  })

  // Sort tasks
  return filteredTasks.sort((a, b) => {
    // Priority sorting
    if (a.priority && b.priority) {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    
    // Due date sorting
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    
    // Sort order
    return (a.sort_order || 0) - (b.sort_order || 0)
  })
}

// Get tasks for calendar view
export async function getTasksForCalendar(startDate: number, endDate: number) {
  const userId = await getUserId()
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .or(`scheduled_date.gte.${new Date(startDate).toISOString()},due_date.gte.${new Date(startDate).toISOString()}`)
    .or(`scheduled_date.lte.${new Date(endDate).toISOString()},due_date.lte.${new Date(endDate).toISOString()}`)

  if (error) throw error
  
  return tasks?.filter(task => {
    const scheduledInRange = task.scheduled_date && 
      new Date(task.scheduled_date).getTime() >= startDate && 
      new Date(task.scheduled_date).getTime() <= endDate
    
    const dueInRange = task.due_date && 
      new Date(task.due_date).getTime() >= startDate && 
      new Date(task.due_date).getTime() <= endDate
    
    return scheduledInRange || dueInRange
  }) || []
}

// Get tasks for specific date
export async function getTasksForDate(date: number) {
  const userId = await getUserId()
  
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .or(`scheduled_date.gte.${startOfDay.toISOString()},due_date.gte.${startOfDay.toISOString()}`)
    .or(`scheduled_date.lte.${endOfDay.toISOString()},due_date.lte.${endOfDay.toISOString()}`)

  if (error) throw error
  
  return tasks?.filter(task => {
    const scheduledInDay = task.scheduled_date && 
      new Date(task.scheduled_date).getTime() >= startOfDay.getTime() && 
      new Date(task.scheduled_date).getTime() <= endOfDay.getTime()
    
    const dueInDay = task.due_date && 
      new Date(task.due_date).getTime() >= startOfDay.getTime() && 
      new Date(task.due_date).getTime() <= endOfDay.getTime()
    
    return scheduledInDay || dueInDay
  }) || []
}

// Search tasks
export async function searchTasks(searchQuery: string) {
  const userId = await getUserId()
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .or(`title.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`)

  if (error) throw error
  if (!tasks) return []

  const searchTerm = searchQuery.toLowerCase()
  
  return tasks
    .filter(task => {
      const titleMatch = task.title.toLowerCase().includes(searchTerm)
      const notesMatch = task.notes?.toLowerCase().includes(searchTerm)
      const tagsMatch = task.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      
      return titleMatch || notesMatch || tagsMatch
    })
    .sort((a, b) => {
      // Prioritize title matches
      const aInTitle = a.title.toLowerCase().includes(searchTerm)
      const bInTitle = b.title.toLowerCase().includes(searchTerm)
      
      if (aInTitle && !bInTitle) return -1
      if (!aInTitle && bInTitle) return 1
      
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
}

// Create task
export async function createTask(taskData: Omit<TaskInsert, 'user_id' | 'completed'>) {
  const userId = await getUserId()
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: userId,
      completed: false,
      sort_order: Date.now(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update task
export async function updateTask(id: string, updates: TaskUpdate) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: task } = await supabase
    .from('tasks')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!task || task.user_id !== userId) {
    throw new Error('Task not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Toggle task completion
export async function toggleTask(id: string) {
  const userId = await getUserId()
  
  // Get current task state
  const { data: task } = await supabase
    .from('tasks')
    .select('completed, user_id')
    .eq('id', id)
    .single()
  
  if (!task || task.user_id !== userId) {
    throw new Error('Task not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Soft delete task
export async function deleteTask(id: string) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: task } = await supabase
    .from('tasks')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!task || task.user_id !== userId) {
    throw new Error('Task not found or unauthorized')
  }

  const { error } = await supabase
    .from('tasks')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}

// Get task statistics
export async function getTaskStats() {
  const userId = await getUserId()
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('completed, due_date, priority')
    .eq('user_id', userId)
    .eq('is_deleted', false)

  if (error) throw error
  if (!tasks) return null

  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()
  today.setHours(23, 59, 59, 999)
  const todayEnd = today.getTime()

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    dueToday: tasks.filter(t => 
      !t.completed && 
      t.due_date && 
      new Date(t.due_date).getTime() >= todayStart && 
      new Date(t.due_date).getTime() <= todayEnd
    ).length,
    overdue: tasks.filter(t => 
      !t.completed && 
      t.due_date && 
      new Date(t.due_date).getTime() < todayStart
    ).length,
    highPriority: tasks.filter(t => !t.completed && t.priority === 'high').length,
  }

  return stats
}

// Real-time subscription for tasks
export function subscribeToTasks(callback: () => void) {
  return supabase
    .channel('tasks')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks' }, 
      (payload) => {
        // Trigger callback to re-fetch data in components
        callback()
      }
    )
    .subscribe()
}

// Create recurring task
export async function createRecurringTask(recurringData: Omit<RecurringTaskInsert, 'user_id' | 'is_active'>) {
    const userId = await getUserId()

    const { data, error } = await supabase
        .from('recurring_tasks')
        .insert({
            ...recurringData,
            user_id: userId,
            is_active: true,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

// Update recurring task
export async function updateRecurringTask(id: string, updates: RecurringTaskUpdate) {
    const userId = await getUserId()

    // Verify ownership
    const { data: recurringTask } = await supabase
        .from('recurring_tasks')
        .select('user_id')
        .eq('id', id)
        .single()

    if (!recurringTask || recurringTask.user_id !== userId) {
        throw new Error('Recurring task not found or unauthorized')
    }

    const { data, error } = await supabase
        .from('recurring_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}
