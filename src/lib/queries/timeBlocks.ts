import { supabase } from '../supabase'
import type { Database } from '../supabase'

type TimeBlock = Database['public']['Tables']['time_blocks']['Row']
type TimeBlockInsert = Database['public']['Tables']['time_blocks']['Insert']
type TimeBlockUpdate = Database['public']['Tables']['time_blocks']['Update']

// Helper function to get current user ID
async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  return user.id
}

// Get time blocks for a specific date
export async function getTimeBlocks(date: number) {
  const userId = await getUserId()
  
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: timeBlocks, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return timeBlocks || []
}

// Get time blocks for a date range
export async function getTimeBlocksForRange(startDate: number, endDate: number) {
  const userId = await getUserId()

  const { data: timeBlocks, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', new Date(startDate).toISOString())
    .lte('start_time', new Date(endDate).toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return timeBlocks || []
}

// Create new time block
export async function createTimeBlock(timeBlockData: Omit<TimeBlockInsert, 'user_id'>) {
  const userId = await getUserId()
  
  const { data, error } = await supabase
    .from('time_blocks')
    .insert({
      ...timeBlockData,
      user_id: userId,
      color: timeBlockData.color || '#3B82F6',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update time block
export async function updateTimeBlock(id: string, updates: TimeBlockUpdate) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: timeBlock } = await supabase
    .from('time_blocks')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!timeBlock || timeBlock.user_id !== userId) {
    throw new Error('Time block not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('time_blocks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete time block
export async function deleteTimeBlock(id: string) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: timeBlock } = await supabase
    .from('time_blocks')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!timeBlock || timeBlock.user_id !== userId) {
    throw new Error('Time block not found or unauthorized')
  }

  const { error } = await supabase
    .from('time_blocks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Check for time conflicts
export async function checkTimeBlockConflicts(
  startTime: string, 
  endTime: string, 
  excludeId?: string
) {
  const userId = await getUserId()
  
  let query = supabase
    .from('time_blocks')
    .select('id, title, start_time, end_time')
    .eq('user_id', userId)
    .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data: conflicts, error } = await query

  if (error) throw error
  return conflicts || []
}

// Real-time subscription for time blocks
export function subscribeToTimeBlocks(date: number, callback: (timeBlocks: TimeBlock[]) => void) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return supabase
    .channel(`time-blocks-${date}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'time_blocks',
        filter: `start_time.gte.${startOfDay.toISOString()}.and.start_time.lte.${endOfDay.toISOString()}`
      }, 
      (payload) => {
        // Re-fetch time blocks when changes occur
        getTimeBlocks(date).then(callback)
      }
    )
    .subscribe()
}