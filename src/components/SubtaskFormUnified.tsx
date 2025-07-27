import { useState, useEffect, useRef } from "react";
import { createSubtask } from "../lib/queries/subtasks";
import { getTasks } from "../lib/queries/tasks";
import { getProjects } from "../lib/queries/projects";
import { useTaskStore } from "../stores/useTaskStore";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface SubtaskFormUnifiedProps {
  onClose: () => void;
}

// Locally-scoped styles for the form
const styles = `
  .subtask-form-input {
    background: transparent;
    border: none;
    color: var(--things-gray-500);
    width: 100%;
    padding: 4px 0;
  }
  .subtask-form-input:focus {
    outline: none;
    border-bottom: 1px solid var(--things-blue);
  }
`;

export function SubtaskFormUnified({ onClose }: SubtaskFormUnifiedProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const { refresh } = useTaskStore();

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [tasksData, projectsData] = await Promise.all([
          getTasks(),
          getProjects(),
        ]);
        // Filter out completed tasks for cleaner dropdown
        setTasks(tasksData.filter(task => !task.completed));
        setProjects(projectsData);
      } catch (error) {
        console.error("Failed to fetch tasks and projects:", error);
      }
    };
    fetchDropdownData();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!selectedTaskId) {
      alert("Please select a parent task for this subtask.");
      return;
    }

    try {
      const subtaskData = {
        task_id: selectedTaskId,
        title: title.trim(),
        notes: notes.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        priority: priority || null,
        tags: tags.trim() ? tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : [],
        duration: duration ? parseInt(duration) : null,
      };

      await createSubtask(subtaskData);
      refresh(); // Refresh the task store
      onClose();
    } catch (error) {
      console.error("Failed to create subtask:", error);
      alert(`Failed to create subtask: ${error.message}`);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">New Subtask</h2>
            
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="subtask-form-input text-lg font-medium"
                placeholder="Subtask title"
                autoFocus
                style={{ color: 'var(--things-gray-700)' }}
              />
            </div>

            {/* Notes */}
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="subtask-form-input resize-none"
                placeholder="Notes"
                rows={3}
                style={{ color: 'var(--things-gray-600)' }}
              />
            </div>

            {/* Due Date and Scheduled Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="subtask-form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Scheduled</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="subtask-form-input"
                />
              </div>
            </div>

            {/* Priority and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="subtask-form-input"
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="subtask-form-input"
                  placeholder="30"
                  min="1"
                />
              </div>
            </div>

            {/* Task and Project */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Task</label>
                <select
                  value={selectedTaskId || ''}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    // Auto-populate project based on selected task's project
                    if (e.target.value) {
                      const selectedTask = tasks.find(t => t.id === e.target.value);
                      if (selectedTask?.project_id) {
                        setSelectedProjectId(selectedTask.project_id);
                      }
                    }
                  }}
                  className="subtask-form-input"
                  required
                >
                  <option value="">Select task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="subtask-form-input"
                  disabled={!!selectedTaskId} // Disabled when task is selected (auto-populated)
                  style={{ opacity: selectedTaskId ? 0.6 : 1 }}
                >
                  <option value="">None</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="subtask-form-input"
                placeholder="work, urgent, meeting"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !selectedTaskId}
                className="things-button-primary disabled:opacity-50"
              >
                Create Subtask
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}