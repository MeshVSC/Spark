import { supabase } from '../supabase'
import type { Database } from '../supabase'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

// Helper function to get current user ID
async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  return user.id
}

// Get all projects for current user
export async function getProjects() {
  const userId = await getUserId()
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return projects || []
}

// Get single project by ID
export async function getProject(id: string) {
  const userId = await getUserId()
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return project
}

// Create new project
export async function createProject(projectData: Omit<ProjectInsert, 'user_id' | 'is_archived' | 'sort_order'>) {
  const userId = await getUserId()
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      user_id: userId,
      is_archived: false,
      sort_order: Date.now(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update project
export async function updateProject(id: string, updates: ProjectUpdate) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!project || project.user_id !== userId) {
    throw new Error('Project not found or unauthorized')
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Archive project (soft delete)
export async function deleteProject(id: string) {
  const userId = await getUserId()
  
  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (!project || project.user_id !== userId) {
    throw new Error('Project not found or unauthorized')
  }

  const { error } = await supabase
    .from('projects')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) throw error
}

// Real-time subscription for projects
export function subscribeToProjects(callback: () => void) {
  return supabase
    .channel('projects')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'projects' }, 
      (payload) => {
        // Trigger callback to re-fetch data in components
        callback()
      }
    )
    .subscribe()
}