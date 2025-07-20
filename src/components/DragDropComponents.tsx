import React, { ReactNode } from 'react';
import { useDragDrop, type DragItem, type DropZone } from '../contexts/DragDropContext';

interface DraggableProps {
  item: DragItem;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Draggable({ item, children, className = '', disabled = false }: DraggableProps) {
  const { startDrag, endDrag, isDragging, dragItem } = useDragDrop();
  
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // For Firefox compatibility
    startDrag(item);
  };

  const handleDragEnd = () => {
    endDrag();
  };

  const isBeingDragged = isDragging && dragItem?.id === item.id;

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        ${className}
        ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isBeingDragged ? 'opacity-50 scale-95 transform' : ''}
        transition-all duration-150
      `}
      style={{
        touchAction: 'none', // Disable touch scrolling when dragging
      }}
    >
      {children}
    </div>
  );
}

interface DropZoneProps {
  zone: DropZone;
  children: ReactNode;
  className?: string;
  onDrop?: (dragItem: DragItem, dropZone: DropZone, event: React.DragEvent) => void;
  showDropIndicator?: boolean;
}

export function DropZone({ 
  zone, 
  children, 
  className = '', 
  onDrop,
  showDropIndicator = true 
}: DropZoneProps) {
  const { dragItem, dragOverZone, setDragOver, canDrop, endDrag } = useDragDrop();
  
  const isValidDropTarget = dragItem && canDrop(zone);
  const isDropTarget = dragOverZone === zone.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!isValidDropTarget) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(zone.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving this element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    
    if (!isValidDropTarget || !dragItem) return;
    
    onDrop?.(dragItem, zone, e);
    endDrag();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${className}
        ${isValidDropTarget && isDropTarget && showDropIndicator ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50' : ''}
        ${isValidDropTarget ? 'transition-all duration-150' : ''}
      `}
    >
      {children}
      
      {/* Drop indicator */}
      {isValidDropTarget && isDropTarget && showDropIndicator && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none opacity-75" />
      )}
    </div>
  );
}

interface DragHandleProps {
  className?: string;
}

export function DragHandle({ className = '' }: DragHandleProps) {
  return (
    <div className={`drag-handle ${className}`}>
      <svg 
        width="12" 
        height="12" 
        viewBox="0 0 12 12" 
        className="text-gray-400 hover:text-gray-600 transition-colors"
        fill="currentColor"
      >
        <circle cx="2" cy="2" r="1" />
        <circle cx="6" cy="2" r="1" />
        <circle cx="10" cy="2" r="1" />
        <circle cx="2" cy="6" r="1" />
        <circle cx="6" cy="6" r="1" />
        <circle cx="10" cy="6" r="1" />
        <circle cx="2" cy="10" r="1" />
        <circle cx="6" cy="10" r="1" />
        <circle cx="10" cy="10" r="1" />
      </svg>
    </div>
  );
}

interface DropIndicatorProps {
  position: 'before' | 'after';
  show: boolean;
}

export function DropIndicator({ position, show }: DropIndicatorProps) {
  if (!show) return null;
  
  return (
    <div className={`
      absolute left-0 right-0 h-0.5 bg-blue-400 rounded-full z-10
      ${position === 'before' ? '-top-0.5' : '-bottom-0.5'}
    `} />
  );
}

interface DragPreviewProps {
  children: ReactNode;
}

export function DragPreview({ children }: DragPreviewProps) {
  return (
    <div className="fixed pointer-events-none z-50 opacity-75 transform scale-95">
      {children}
    </div>
  );
}