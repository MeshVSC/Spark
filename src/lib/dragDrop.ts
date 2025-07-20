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
  console.log('calculateSortOrder called:', { 
    itemsLength: items.length, 
    targetIndex, 
    draggedItemId,
    items: items.map(i => ({ id: i.id, sort_order: i.sort_order }))
  });
  
  // Filter out the dragged item if it's already in the list
  const filteredItems = items.filter(item => item.id !== draggedItemId);
  
  // Sort items by their current sort_order to ensure correct positioning
  filteredItems.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  console.log('Filtered and sorted items:', filteredItems.map(i => ({ id: i.id, sort_order: i.sort_order })));
  
  if (filteredItems.length === 0) {
    console.log('No items, using default sort order: 1000');
    return 1000; // Default sort order for first item
  }
  
  // If dropping at the beginning
  if (targetIndex === 0) {
    const firstItem = filteredItems[0];
    const firstOrder = firstItem.sort_order || 1000;
    const newOrder = Math.max(1, firstOrder - 1000);
    console.log('Dropping at beginning, new order:', newOrder);
    return newOrder;
  }
  
  // If dropping at the end
  if (targetIndex >= filteredItems.length) {
    const lastItem = filteredItems[filteredItems.length - 1];
    const lastOrder = lastItem.sort_order || 1000;
    const newOrder = lastOrder + 1000;
    console.log('Dropping at end, new order:', newOrder);
    return newOrder;
  }
  
  // If dropping between items
  const prevItem = filteredItems[targetIndex - 1];
  const nextItem = filteredItems[targetIndex];
  const prevOrder = prevItem?.sort_order || 0;
  const nextOrder = nextItem?.sort_order || 2000;
  
  // Ensure we have enough space between items
  let newOrder: number;
  if (nextOrder - prevOrder <= 1) {
    // Items are too close, use timestamp-based approach
    newOrder = Date.now();
  } else {
    // Create a sort order between the two items
    newOrder = Math.floor((prevOrder + nextOrder) / 2);
  }
  
  console.log('Dropping between items:', { 
    prevOrder, 
    nextOrder, 
    newOrder,
    prevItem: prevItem?.id,
    nextItem: nextItem?.id
  });
  
  return newOrder;
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
  
  console.log('handleTaskDrop called:', {
    taskId,
    dropZoneType: dropZone.type,
    targetIndex,
    targetProjectId,
    targetAreaId,
    allTasksCount: allTasks?.length
  });
  
  // Calculate new sort order if provided
  let newSortOrder: number | undefined;
  if (typeof targetIndex === 'number' && allTasks) {
    newSortOrder = calculateSortOrder(allTasks, targetIndex, taskId);
    console.log('Calculated sort order:', newSortOrder);
  }
  
  // Handle different drop targets
  switch (dropZone.type) {
    case 'project':
      // Moving task to a project
      console.log('Moving task to project:', { taskId, targetProjectId, targetAreaId, newSortOrder });
      await updateTask(taskId, {
        project_id: targetProjectId || null,
        area_id: targetAreaId || null,
        ...(newSortOrder && { sort_order: newSortOrder })
      });
      break;
      
    case 'area':
      // Moving task to an area
      console.log('Moving task to area:', { taskId, targetAreaId, newSortOrder });
      await updateTask(taskId, {
        area_id: targetAreaId || null,
        project_id: null, // Clear project when moving to area
        ...(newSortOrder && { sort_order: newSortOrder })
      });
      break;
      
    case 'task-list':
      // Reordering within the same list
      console.log('Reordering task in list:', { taskId, newSortOrder, targetIndex, allTasksCount: allTasks?.length });
      if (newSortOrder) {
        console.log('Updating task order with calculated sort order:', newSortOrder);
        await updateTaskOrder(taskId, newSortOrder);
      } else {
        console.warn('No sort order calculated for task reordering, using timestamp fallback');
        // If no sort order calculated, use current timestamp as fallback
        await updateTaskOrder(taskId, Date.now());
      }
      break;
      
    default:
      console.warn('Unknown drop zone type:', dropZone.type);
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