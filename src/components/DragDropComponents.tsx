import React, { ReactNode, useState } from 'react';
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
  onDrop?: (dragItem: DragItem, dropZone: DropZone, targetIndex?: number) => void;
  showDropIndicator?: boolean;
}

interface InsertionIndicatorProps {
  position: number;
  container: HTMLElement;
  show: boolean;
}

function InsertionIndicator({ position, container, show }: InsertionIndicatorProps) {
  if (!show) return null;
  
  const draggableElements = Array.from(container.querySelectorAll('[draggable="true"]'));
  let topPosition = 0;
  
  if (position === 0) {
    // Insert at the beginning
    topPosition = 0;
  } else if (position >= draggableElements.length) {
    // Insert at the end
    const lastElement = draggableElements[draggableElements.length - 1] as HTMLElement;
    if (lastElement) {
      const containerRect = container.getBoundingClientRect();
      const lastRect = lastElement.getBoundingClientRect();
      topPosition = lastRect.bottom - containerRect.top;
    }
  } else {
    // Insert between elements
    const targetElement = draggableElements[position] as HTMLElement;
    if (targetElement) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      topPosition = targetRect.top - containerRect.top;
    }
  }
  
  return (
    <div 
      className="absolute left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10 shadow-lg"
      style={{ top: topPosition - 1 }}
    >
      <div className="absolute left-2 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
    </div>
  );
}

export function DropZone({ 
  zone, 
  children, 
  className = '', 
  onDrop,
  showDropIndicator = true 
}: DropZoneProps) {
  const { dragItem, dragOverZone, setDragOver, canDrop, endDrag } = useDragDrop();
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [dropContainer, setDropContainer] = useState<HTMLElement | null>(null);
  
  const isValidDropTarget = dragItem && canDrop(zone);
  const isDropTarget = dragOverZone === zone.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!isValidDropTarget) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(zone.id);
    
    // Calculate insertion position for visual feedback
    const container = e.currentTarget as HTMLElement;
    setDropContainer(container);
    const draggableElements = Array.from(container.querySelectorAll('[draggable="true"]'));
    
    if (draggableElements.length > 0) {
      const mouseY = e.clientY;
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      draggableElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const elementCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(mouseY - elementCenterY);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = mouseY < elementCenterY ? index : index + 1;
        }
      });
      
      setInsertionIndex(closestIndex);
    } else {
      setInsertionIndex(0);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving this element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(null);
      setInsertionIndex(null);
      setDropContainer(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    
    if (!isValidDropTarget || !dragItem) return;
    
    // Use the calculated insertion index from drag over
    const targetIndex = insertionIndex ?? 0;
    
    // Clear insertion indicator
    setInsertionIndex(null);
    setDropContainer(null);
    
    onDrop?.(dragItem, zone, targetIndex);
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
      
      {/* Insertion indicator */}
      {isValidDropTarget && isDropTarget && showDropIndicator && insertionIndex !== null && dropContainer && (
        <InsertionIndicator 
          position={insertionIndex}
          container={dropContainer}
          show={true}
        />
      )}
      
      {/* Drop indicator */}
      {isValidDropTarget && isDropTarget && showDropIndicator && !insertionIndex && (
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
        width="6" 
        height="12" 
        viewBox="0 0 6 12" 
        className="text-gray-400 hover:text-gray-600 transition-colors"
        fill="currentColor"
      >
        <circle cx="3" cy="2" r="1" />
        <circle cx="3" cy="6" r="1" />
        <circle cx="3" cy="10" r="1" />
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