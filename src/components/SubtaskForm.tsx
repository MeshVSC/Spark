import { useState, useRef, useEffect } from "react";
import { createSubtask } from "../lib/queries/subtasks";

interface SubtaskFormProps {
  isVisible: boolean;
  onClose: () => void;
  taskId: string;
  onSubtaskCreated?: () => void;
}

export function SubtaskForm({ isVisible, onClose, taskId, onSubtaskCreated }: SubtaskFormProps) {
  const [title, setTitle] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      console.log('🚀 Creating subtask...');
      await createSubtask({
        task_id: taskId,
        title: title.trim(),
      });
      console.log('✅ Subtask created successfully');
      
      if (onSubtaskCreated) {
        console.log('🔄 Triggering subtask refresh...');
        onSubtaskCreated();
      }
      
      setTitle("");
      onClose();
    } catch (error) {
      console.error("Failed to create subtask:", error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50">
      <div ref={modalRef} className="bg-white rounded-xl shadow-2xl p-4 w-80">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-0 py-2 text-base border-none outline-none placeholder-gray-400"
            placeholder="New Subtask"
            autoFocus
          />
          
          <div className="flex justify-end gap-2 mt-2 text-xs text-gray-500">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}