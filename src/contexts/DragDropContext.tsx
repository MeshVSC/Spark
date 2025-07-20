import React, { createContext, useContext, useState } from 'react';

export type DragItem = {
  id: string;
  type: 'task' | 'project' | 'area' | 'subtask';
  sourceContainer?: string;
  sourceIndex?: number;
  data?: any;
};

export type DropZone = {
  id: string;
  type: 'task-list' | 'project-list' | 'area-list' | 'project' | 'area' | 'trash';
  accepts: Array<'task' | 'project' | 'area' | 'subtask'>;
  sectionRestriction?: 'views' | 'folders' | 'none'; // Sidebar section restrictions
};

interface DragDropContextType {
  dragItem: DragItem | null;
  dragOverZone: string | null;
  isDragging: boolean;
  startDrag: (item: DragItem) => void;
  endDrag: () => void;
  setDragOver: (zoneId: string | null) => void;
  canDrop: (zone: DropZone) => boolean;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  const startDrag = (item: DragItem) => {
    setDragItem(item);
  };

  const endDrag = () => {
    setDragItem(null);
    setDragOverZone(null);
  };

  const setDragOver = (zoneId: string | null) => {
    setDragOverZone(zoneId);
  };

  const canDrop = (zone: DropZone): boolean => {
    if (!dragItem) return false;
    
    // Check if the item type is accepted by the zone
    if (!zone.accepts.includes(dragItem.type)) return false;
    
    // Sidebar section restrictions
    if (zone.sectionRestriction) {
      // Views section (top) - only allows view-related items
      if (zone.sectionRestriction === 'views') {
        return false; // Views are not draggable
      }
      
      // Folders section (bottom) - allows tasks, projects, areas
      if (zone.sectionRestriction === 'folders') {
        return ['task', 'project', 'area', 'subtask'].includes(dragItem.type);
      }
    }
    
    // Prevent dropping on self
    if (dragItem.sourceContainer === zone.id) return false;
    
    return true;
  };

  return (
    <DragDropContext.Provider
      value={{
        dragItem,
        dragOverZone,
        isDragging: !!dragItem,
        startDrag,
        endDrag,
        setDragOver,
        canDrop,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}