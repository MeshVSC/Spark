import { useDragDrop } from '../contexts/DragDropContext';

export function DragDebugInfo() {
  const { dragItem, isDragging, dragOverZone } = useDragDrop();
  
  // Only show debug info in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 bg-black text-white text-xs p-2 rounded z-50 opacity-75">
      <div>Dragging: {isDragging ? 'Yes' : 'No'}</div>
      {dragItem && (
        <div>
          <div>Item ID: {dragItem.id}</div>
          <div>Item Type: {dragItem.type}</div>
        </div>
      )}
      {dragOverZone && <div>Over Zone: {dragOverZone}</div>}
    </div>
  );
}