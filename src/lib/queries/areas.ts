import { supabase } from '../supabase'
import type { Database } from '../supabase'

type Area = Database['public']['Tables']['areas']['Row']
type AreaInsert = Database['public']['Tables']['areas']['Insert']
type AreaUpdate = Database['public']['Tables']['areas']['Update']

// Helper function to get current user ID
async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  return user.id
}

// Get all areas for current user
export async function getAreas() {
  const userId = await getUserId()
  
  const { data: areas, error } = await supabase
    .from('areas')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return areas || []
}

// Create new area
export async function createArea(areaData: Omit<AreaInsert, 'user_id' | 'is_archived' | 'sort_order'>) {
  const userId = await getUserId()
  
  const { data, error } = await supabase
    .from('areas')
    .insert({
      ...areaData,
      user_id: userId,
      is_archived: false,
      sort_order: Date.now(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update area
export async function updateArea(id: string, updates: AreaUpdate) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: area } = await supabase
    .from('areas')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!area || area.user_id !== userId) {
    throw new Error('Area not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('areas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Archive area (soft delete)
export async function deleteArea(id: string) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: area } = await supabase
    .from('areas')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!area || area.user_id !== userId) {
    throw new Error('Area not found or unauthorized')
  }

  const { error } = await supabase
    .from('areas')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) throw error
}

// Real-time subscription for areas
export function subscribeToAreas(callback: () => void) {
  return supabase
    .channel('areas')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'areas' }, 
      (payload) => {
        // Trigger callback to re-fetch data in components
        callback()
      }
    )
    .subscribe()
}