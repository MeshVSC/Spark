import { createContext, useContext, useEffect, useState } from 'react'
import { getProjects, subscribeToProjects } from '../lib/queries/projects'
import type { Database } from '../lib/supabase'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectStore {
  projects: Project[]
  refresh: () => Promise<void>
  addOptimistic: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => string
  updateOptimistic: (id: string, updates: Partial<Project>) => void
  removeOptimistic: (id: string) => void
  deleteOptimistic: (id: string) => void
}

const ProjectStoreContext = createContext<ProjectStore | undefined>(undefined)

export function ProjectStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])

  const refresh = async () => {
    try {
      const fetched = await getProjects()
      setProjects(fetched)
    } catch (err) {
      console.error('Failed to refresh projects:', err)
      setProjects([])
    }
  }

  // Optimistic update methods
  const addOptimistic = (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): string => {
    const optimisticId = `temp-${Date.now()}-${Math.random()}`
    const optimisticProject: Project = {
      id: optimisticId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...projectData
    }
    setProjects(prev => [optimisticProject, ...prev])
    return optimisticId
  }

  const updateOptimistic = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates } : project
    ))
  }

  const removeOptimistic = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id))
  }

  const deleteOptimistic = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id))
  }

  useEffect(() => {
    refresh()
    const channel = subscribeToProjects(refresh)
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <ProjectStoreContext.Provider value={{ 
      projects, 
      refresh, 
      addOptimistic, 
      updateOptimistic, 
      removeOptimistic,
      deleteOptimistic 
    }}>
      {children}
    </ProjectStoreContext.Provider>
  )
}

export function useProjectStore() {
  const ctx = useContext(ProjectStoreContext)
  if (!ctx) throw new Error('useProjectStore must be used within ProjectStoreProvider')
  return ctx
}