import { createContext, useContext, useEffect, useState } from 'react'
import { getTasks, subscribeToTasks } from '../lib/queries/tasks'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskStore {
  tasks: Task[]
  refresh: () => Promise<void>
}

const TaskStoreContext = createContext<TaskStore | undefined>(undefined)

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  const refresh = async () => {
    try {
      const fetched = await getTasks({ view: 'all' })
      setTasks(fetched)
    } catch (err) {
      console.error('Failed to refresh tasks:', err)
      setTasks([])
    }
  }

  useEffect(() => {
    refresh()
    const channel = subscribeToTasks(refresh)
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <TaskStoreContext.Provider value={{ tasks, refresh }}>
      {children}
    </TaskStoreContext.Provider>
  )
}

export function useTaskStore() {
  const ctx = useContext(TaskStoreContext)
  if (!ctx) throw new Error('useTaskStore must be used within TaskStoreProvider')
  return ctx
}
