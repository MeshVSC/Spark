import { createContext, useContext, useEffect, useState } from 'react'
import { getTasks, subscribeToTasks } from '../lib/queries/tasks'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskStore {
  tasks: Task[]
  refresh: () => Promise<void>
  addOptimistic: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => string
  updateOptimistic: (id: string, updates: Partial<Task>) => void
  removeOptimistic: (id: string) => void
}

const TaskStoreContext = createContext<TaskStore | undefined>(undefined)

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  const refresh = async () => {
    try {
      const fetched = await getTasks({ view: 'stats' })
      setTasks(fetched)
    } catch (err) {
      console.error('Failed to refresh tasks:', err)
      setTasks([])
    }
  }

  // Optimistic update methods
  const addOptimistic = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): string => {
    const optimisticId = `temp-${Date.now()}-${Math.random()}`
    const optimisticTask: Task = {
      id: optimisticId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed: false,
      ...taskData
    }
    setTasks(prev => [optimisticTask, ...prev])
    return optimisticId
  }

  const updateOptimistic = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ))
  }

  const removeOptimistic = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  useEffect(() => {
    refresh()
    const channel = subscribeToTasks(refresh)
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <TaskStoreContext.Provider value={{ 
      tasks, 
      refresh, 
      addOptimistic, 
      updateOptimistic, 
      removeOptimistic 
    }}>
      {children}
    </TaskStoreContext.Provider>
  )
}

export function useTaskStore() {
  const ctx = useContext(TaskStoreContext)
  if (!ctx) throw new Error('useTaskStore must be used within TaskStoreProvider')
  return ctx
}
