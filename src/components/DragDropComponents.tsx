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
    console.log('🚨 DRAG START ATTEMPT:', { target: e.target, disabled });
    
    if (disabled) {
      console.log('❌ Drag disabled');
      e.preventDefault();
      return;
    }
    
    // Check if drag started from drag handle
    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    
    // Check if any drag handle was marked during mousedown
    const isDragHandleMarked = Array.from(currentTarget.querySelectorAll('.drag-handle')).some(
      handle => (handle as any).__isDragHandle
    );
    
    // Traditional detection as fallback
    const isDragHandle = target.closest('.drag-handle');
    
    console.log('🔍 Handle check:', { 
      target: target, 
      targetClass: target.className,
      targetTagName: target.tagName,
      isDragHandleMarked,
      isDragHandle: !!isDragHandle,
      // Additional debugging
      targetHTML: target.outerHTML?.substring(0, 100),
      closestDragHandle: isDragHandle?.outerHTML?.substring(0, 100)
    });
    
    // Check if drag originated from handle using marker or traditional detection
    const isFromHandle = isDragHandleMarked || isDragHandle;
    
    if (!isFromHandle) {
      console.log('❌ No drag handle found, preventing drag');
      e.preventDefault();
      return;
    }
    
    // Clear the marker
    Array.from(currentTarget.querySelectorAll('.drag-handle')).forEach(
      handle => delete (handle as any).__isDragHandle
    );
    
    console.log('✅ Drag handle detected, allowing drag');
    
    console.log('✅ Starting drag for:', item);
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
    // Insert at the beginning - use first element's top or container top
    const firstElement = draggableElements[0] as HTMLElement;
    if (firstElement) {
      const containerRect = container.getBoundingClientRect();
      const firstRect = firstElement.getBoundingClientRect();
      topPosition = Math.max(0, firstRect.top - containerRect.top);
    }
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
      topPosition = Math.max(0, targetRect.top - containerRect.top);
    }
  }
  
  return (
    <div 
      className="absolute left-0 right-0 h-px bg-gray-400 z-10"
      style={{ top: topPosition }}
    />
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
      let insertionIndex = 0;
      
      // Find the correct insertion point by comparing with each element
      for (let i = 0; i < draggableElements.length; i++) {
        const element = draggableElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementMiddle = rect.top + rect.height / 2;
        
        if (mouseY < elementMiddle) {
          insertionIndex = i;
          break;
        } else {
          insertionIndex = i + 1;
        }
      }
      
      setInsertionIndex(insertionIndex);
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
    console.log('🎯 DROP EVENT FIRED!', { 
      zone: zone.id, 
      dragItem, 
      isValidDropTarget,
      dragOverZone,
      eventTarget: e.target,
      eventCurrentTarget: e.currentTarget 
    });
    
    e.preventDefault();
    setDragOver(null);
    
    if (!isValidDropTarget || !dragItem) {
      console.log('❌ Drop rejected:', { isValidDropTarget, dragItem, dragOverZone });
      return;
    }
    
    // Use the calculated insertion index from drag over
    const targetIndex = insertionIndex ?? 0;
    
    console.log('📍 Drop details:', { targetIndex, zone, dragItem });
    
    // Clear insertion indicator
    setInsertionIndex(null);
    setDropContainer(null);
    
    console.log('🚀 Calling onDrop handler');
    onDrop?.(dragItem, zone, targetIndex);
    endDrag();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className} relative`}
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
    </div>
  );
}

interface DragHandleProps {
  className?: string;
}

export function DragHandle({ className = '' }: DragHandleProps) {
  return (
    <div 
      className={`drag-handle ${className} cursor-grab active:cursor-grabbing`}
      style={{
        // Make the clickable area much larger while keeping visual appearance
        minWidth: '20px',
        minHeight: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseDown={(e) => {
        // Mark this element as the drag handle for event bubbling
        (e.currentTarget as any).__isDragHandle = true;
      }}
    >
      <svg 
        width="6" 
        height="12" 
        viewBox="0 0 6 12" 
        className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-none"
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