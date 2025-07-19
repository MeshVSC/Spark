import { createContext, useContext, useState } from 'react';

interface TaskNavigationContext {
  selectedTaskId: string | null;
  openTask: (id: string) => void;
  closeTask: () => void;
}

const TaskNavigationContext = createContext<TaskNavigationContext | undefined>(undefined);

export function TaskNavigationProvider({ children }: { children: React.ReactNode }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const openTask = (id: string) => setSelectedTaskId(id);
  const closeTask = () => setSelectedTaskId(null);

  return (
    <TaskNavigationContext.Provider value={{ selectedTaskId, openTask, closeTask }}>
      {children}
    </TaskNavigationContext.Provider>
  );
}

export function useTaskNavigation() {
  const context = useContext(TaskNavigationContext);
  if (!context) {
    throw new Error('useTaskNavigation must be used within a TaskNavigationProvider');
  }
  return context;
}
