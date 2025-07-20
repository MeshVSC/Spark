import { updateTaskOrder, updateTask } from './queries/tasks';
import { updateProjectOrder } from './queries/projects';
import { updateAreaOrder } from './queries/areas';
import { updateSubtaskOrder } from './queries/subtasks';
import type { DragItem, DropZone } from '../contexts/DragDropContext';

export interface DragDropHandlers {
  onTaskDrop: (taskId: string, targetProjectId?: string, targetAreaId?: string, newIndex?: number) => Promise<void>;
  onProjectDrop: (projectId: string, targetAreaId?: string, newIndex?: number) => Promise<void>;
  onAreaDrop: (areaId: string, newIndex?: number) => Promise<void>;
  onSubtaskDrop: (subtaskId: string, targetTaskId?: string, newIndex?: number) => Promise<void>;
}

// Calculate new sort order based on position
export function calculateSortOrder(
  items: Array<{ id: string; sort_order: number | null }>,
  targetIndex: number,
  draggedItemId?: string
): number {
  // Filter out the dragged item if it's already in the list
  const filteredItems = items.filter(item => item.id !== draggedItemId);
  
  if (filteredItems.length === 0) {
    return 1000; // Default sort order for first item
  }
  
  // If dropping at the beginning
  if (targetIndex === 0) {
    const firstItem = filteredItems[0];
    const firstOrder = firstItem.sort_order || 1000;
    return Math.max(1, firstOrder - 1000);
  }
  
  // If dropping at the end
  if (targetIndex >= filteredItems.length) {
    const lastItem = filteredItems[filteredItems.length - 1];
    const lastOrder = lastItem.sort_order || 1000;
    return lastOrder + 1000;
  }
  
  // If dropping between items
  const prevItem = filteredItems[targetIndex - 1];
  const nextItem = filteredItems[targetIndex];
  const prevOrder = prevItem.sort_order || 1000;
  const nextOrder = nextItem.sort_order || 1000;
  
  // Create a sort order between the two items
  return Math.floor((prevOrder + nextOrder) / 2);
}

// Handle task drops
export async function handleTaskDrop(
  dragItem: DragItem,
  dropZone: DropZone,
  targetIndex?: number,
  allTasks?: Array<{ id: string; sort_order: number | null }>,
  targetProjectId?: string,
  targetAreaId?: string
): Promise<void> {
  if (dragItem.type !== 'task') return;
  
  const taskId = dragItem.id;
  
  // Calculate new sort order if provided
  let newSortOrder: number | undefined;
  if (typeof targetIndex === 'number' && allTasks) {
    newSortOrder = calculateSortOrder(allTasks, targetIndex, taskId);
  }
  
  // Handle different drop targets
  switch (dropZone.type) {
    case 'project':
      // Moving task to a project
      await updateTask(taskId, {
        project_id: targetProjectId || null,
        area_id: targetAreaId || null,
        ...(newSortOrder && { sort_order: newSortOrder })
      });
      break;
      
    case 'area':
      // Moving task to an area
      await updateTask(taskId, {
        area_id: targetAreaId || null,
        project_id: null, // Clear project when moving to area
        ...(newSortOrder && { sort_order: newSortOrder })
      });
      break;
      
    case 'task-list':
      // Reordering within the same list
      if (newSortOrder) {
        await updateTaskOrder(taskId, newSortOrder);
      }
      break;
  }
}

// Handle project drops
export async function handleProjectDrop(
  dragItem: DragItem,
  dropZone: DropZone,
  targetIndex?: number,
  allProjects?: Array<{ id: string; sort_order: number | null }>,
  targetAreaId?: string
): Promise<void> {
  if (dragItem.type !== 'project') return;
  
  const projectId = dragItem.id;
  
  // Calculate new sort order if provided
  let newSortOrder: number | undefined;
  if (typeof targetIndex === 'number' && allProjects) {
    newSortOrder = calculateSortOrder(allProjects, targetIndex, projectId);
  }
  
  switch (dropZone.type) {
    case 'area':
      // Moving project to an area
      await updateProjectOrder(projectId, newSortOrder || Date.now(), targetAreaId);
      break;
      
    case 'project-list':
      // Reordering projects within the same area
      if (newSortOrder) {
        await updateProjectOrder(projectId, newSortOrder);
      }
      break;
  }
}

// Handle area drops
export async function handleAreaDrop(
  dragItem: DragItem,
  dropZone: DropZone,
  targetIndex?: number,
  allAreas?: Array<{ id: string; sort_order: number | null }>
): Promise<void> {
  if (dragItem.type !== 'area') return;
  
  const areaId = dragItem.id;
  
  // Calculate new sort order if provided
  let newSortOrder: number | undefined;
  if (typeof targetIndex === 'number' && allAreas) {
    newSortOrder = calculateSortOrder(allAreas, targetIndex, areaId);
  }
  
  if (dropZone.type === 'area-list' && newSortOrder) {
    await updateAreaOrder(areaId, newSortOrder);
  }
}

// Handle subtask drops
export async function handleSubtaskDrop(
  dragItem: DragItem,
  dropZone: DropZone,
  targetIndex?: number,
  allSubtasks?: Array<{ id: string; sort_order: number | null }>,
  targetTaskId?: string
): Promise<void> {
  if (dragItem.type !== 'subtask') return;
  
  const subtaskId = dragItem.id;
  
  // Calculate new sort order if provided
  let newSortOrder: number | undefined;
  if (typeof targetIndex === 'number' && allSubtasks) {
    newSortOrder = calculateSortOrder(allSubtasks, targetIndex, subtaskId);
  }
  
  if (newSortOrder) {
    await updateSubtaskOrder(subtaskId, newSortOrder, targetTaskId);
  }
}

// Generic drop handler
export async function handleDrop(
  dragItem: DragItem,
  dropZone: DropZone,
  context: {
    targetIndex?: number;
    targetProjectId?: string;
    targetAreaId?: string;
    targetTaskId?: string;
    allTasks?: Array<{ id: string; sort_order: number | null }>;
    allProjects?: Array<{ id: string; sort_order: number | null }>;
    allAreas?: Array<{ id: string; sort_order: number | null }>;
    allSubtasks?: Array<{ id: string; sort_order: number | null }>;
  }
): Promise<void> {
  try {
    switch (dragItem.type) {
      case 'task':
        await handleTaskDrop(
          dragItem,
          dropZone,
          context.targetIndex,
          context.allTasks,
          context.targetProjectId,
          context.targetAreaId
        );
        break;
        
      case 'project':
        await handleProjectDrop(
          dragItem,
          dropZone,
          context.targetIndex,
          context.allProjects,
          context.targetAreaId
        );
        break;
        
      case 'area':
        await handleAreaDrop(
          dragItem,
          dropZone,
          context.targetIndex,
          context.allAreas
        );
        break;
        
      case 'subtask':
        await handleSubtaskDrop(
          dragItem,
          dropZone,
          context.targetIndex,
          context.allSubtasks,
          context.targetTaskId
        );
        break;
    }
  } catch (error) {
    console.error('Error handling drop:', error);
    throw error;
  }
}