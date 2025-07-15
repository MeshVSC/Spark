import { useState, useEffect } from "react";
import { getSubtasks, subscribeToSubtasks } from "../lib/queries/subtasks";
import { SubtaskList } from "./SubtaskList";
import { SubtaskForm } from "./SubtaskForm";
import { CustomCheckbox } from "./CustomCheckbox";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];
type Subtask = Database['public']['Tables']['subtasks']['Row'];

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEditTask: (taskId: string) => void; // New prop
}

export function TaskItem({ task, onToggle, onDelete, onEditTask }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  useEffect(() => {
    const fetchSubtasks = async () => {
      try {
        const initialSubtasks = await getSubtasks(task.id);
        setSubtasks(initialSubtasks);
      } catch (error) {
        console.error("Failed to fetch subtasks:", error);
      }
    };

    fetchSubtasks();

    const subtaskSubscription = subscribeToSubtasks(task.id, setSubtasks);

    return () => {
      subtaskSubscription.unsubscribe();
    };
  }, [task.id]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };


  const handleAddSubtask = () => {
    setShowSubtaskForm(true);
  };

  const handleSubtaskCreated = async () => {
    try {
      // Manually refresh subtasks to ensure they're up to date
      const updatedSubtasks = await getSubtasks(task.id);
      setSubtasks(updatedSubtasks);
      setShowSubtasks(true);
    } catch (error) {
      console.error("Failed to refresh subtasks:", error);
      // Still show subtasks section even if refresh fails
      setShowSubtasks(true);
    }
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;

  return (
    <>
      <div className={`things-task-item group ${task.completed ? "opacity-60" : ""}`}>
        <div className="flex items-start gap-3">
          {/* Completion Checkbox */}
          <div className="flex-shrink-0">
            <CustomCheckbox 
              checked={task.completed}
              onChange={() => onToggle()}
              className="mt-1"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Title with prefixes */}
                <button
                  onClick={() => onEditTask(task.id)}
                  className={`text-left font-medium text-gray-900 hover:text-blue-600 transition-colors ${task.completed ? "line-through text-gray-500" : ""}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Task title - comes first */}
                    <span className="task-title">{task.title}</span>
                    
                    {/* Document/sheet icon - comes after title */}
                    {task.notes && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                      </svg>
                    )}
                    
                    {/* Tags - come after title */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="task-metadata things-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Dates - come after title */}
                    {task.due_date && (
                      <span className="task-metadata things-date-badge things-date-due">
                        Due {formatDate(task.due_date)}
                      </span>
                    )}
                    
                    {task.scheduled_date && (
                      <span className="task-metadata things-date-badge things-date-scheduled">
                        {formatDate(task.scheduled_date)}
                      </span>
                    )}
                  </div>
                </button>

                {/* Notes */}
                {task.notes && (
                  <p className="task-metadata mt-1 leading-relaxed">
                    {task.notes}
                  </p>
                )}

                {/* Subtask progress */}
                {totalSubtasks > 0 && (
                  <button
                    onClick={() => setShowSubtasks(!showSubtasks)}
                    className="task-metadata text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1"
                  >
                    <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
                    <span className={`transform transition-transform ${showSubtasks ? 'rotate-90' : ''}`}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9,18 15,12 9,6"></polyline>
                      </svg>
                    </span>
                  </button>
                )}

              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleAddSubtask}
                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                  title="Add subtask"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subtasks */}
        {showSubtasks && totalSubtasks > 0 && (
          <div className="mt-3 ml-8">
            <SubtaskList taskId={task.id} />
          </div>
        )}
      </div>

      {/* Subtask Form */}
      <SubtaskForm
        isVisible={showSubtaskForm}
        onClose={() => setShowSubtaskForm(false)}
        taskId={task.id}
        onSubtaskCreated={handleSubtaskCreated}
      />
    </>
  );
}

