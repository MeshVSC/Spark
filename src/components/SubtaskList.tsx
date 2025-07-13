import { useState, useEffect } from "react";
import { getSubtasks, toggleSubtask, deleteSubtask, subscribeToSubtasks } from "../lib/queries/subtasks";
import type { Database } from "../lib/supabase";

type Subtask = Database['public']['Tables']['subtasks']['Row'];

interface SubtaskListProps {
  taskId: string;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  useEffect(() => {
    const fetchSubtasks = async () => {
      try {
        const initialSubtasks = await getSubtasks(taskId);
        setSubtasks(initialSubtasks);
      } catch (error) {
        console.error("Failed to fetch subtasks:", error);
      }
    };

    fetchSubtasks();

    const subtaskSubscription = subscribeToSubtasks(taskId, setSubtasks);

    return () => {
      subtaskSubscription.unsubscribe();
    };
  }, [taskId]);

  const handleToggle = async (id: string) => {
    try {
      await toggleSubtask(id);
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubtask(id);
    } catch (error) {
      console.error("Failed to delete subtask:", error);
    }
  };

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-3 group">
          <button
            onClick={() => handleToggle(subtask.id)}
            className={`things-checkbox ${subtask.completed ? 'completed' : ''}`}
            style={{ transform: 'scale(0.8)' }}
          >
            {subtask.completed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L4.5 8.5L10 3"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          
          <span className={`flex-1 text-sm ${
            subtask.completed ? "line-through text-gray-500" : "text-gray-700"
          }`}>
            {subtask.title}
          </span>
          
          <button
            onClick={() => handleDelete(subtask.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
            title="Delete subtask"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 1.152l.557 10.056A1.5 1.5 0 0 0 4.55 15h6.9a1.5 1.5 0 0 0 1.497-1.292l.557-10.056a.58.58 0 0 0-.01-1.152H11Z"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
