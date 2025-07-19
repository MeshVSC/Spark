import { createContext, useContext, useEffect, useState } from 'react'
import { getAreas, subscribeToAreas } from '../lib/queries/areas'
import type { Database } from '../lib/supabase'

type Area = Database['public']['Tables']['areas']['Row']

interface AreaStore {
  areas: Area[]
  refresh: () => Promise<void>
  addOptimistic: (area: Omit<Area, 'id' | 'created_at' | 'updated_at'>) => string
  updateOptimistic: (id: string, updates: Partial<Area>) => void
  removeOptimistic: (id: string) => void
}

const AreaStoreContext = createContext<AreaStore | undefined>(undefined)

export function AreaStoreProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = useState<Area[]>([])

  const refresh = async () => {
    try {
      const fetched = await getAreas()
      setAreas(fetched)
    } catch (err) {
      console.error('Failed to refresh areas:', err)
      setAreas([])
    }
  }

  // Optimistic update methods
  const addOptimistic = (areaData: Omit<Area, 'id' | 'created_at' | 'updated_at'>): string => {
    const optimisticId = `temp-${Date.now()}-${Math.random()}`
    const optimisticArea: Area = {
      id: optimisticId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...areaData
    }
    setAreas(prev => [optimisticArea, ...prev])
    return optimisticId
  }

  const updateOptimistic = (id: string, updates: Partial<Area>) => {
    setAreas(prev => prev.map(area => 
      area.id === id ? { ...area, ...updates } : area
    ))
  }

  const removeOptimistic = (id: string) => {
    setAreas(prev => prev.filter(area => area.id !== id))
  }

  useEffect(() => {
    refresh()
    const channel = subscribeToAreas(refresh)
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <AreaStoreContext.Provider value={{ 
      areas, 
      refresh, 
      addOptimistic, 
      updateOptimistic, 
      removeOptimistic 
    }}>
      {children}
    </AreaStoreContext.Provider>
  )
}

export function useAreaStore() {
  const ctx = useContext(AreaStoreContext)
  if (!ctx) throw new Error('useAreaStore must be used within AreaStoreProvider')
  return ctx
}