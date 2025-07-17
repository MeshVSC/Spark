import { useState, useEffect, useRef } from "react";
import { createTask, updateTask } from "../lib/queries/tasks";
import { getProjects } from "../lib/queries/projects";
import { getAreas } from "../lib/queries/areas";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Area = Database['public']['Tables']['areas']['Row'];

interface TaskFormProps {
  onClose: () => void;
  projectId?: string | null;
  areaId?: string | null;
  task?: Task;
  onTaskCreated?: () => void;
}

// Locally-scoped styles for the test
const styles = `
  .task-form-input {
    background: transparent;
    border: none;
    color: var(--things-gray-500);
    width: 100%;
    padding: 4px 0;
  }
  .task-form-input:focus {
    outline: none;
    border-bottom: 1px solid var(--things-blue);
  }
`;

export function TaskForm({ onClose, projectId, areaId, task, onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [notes, setNotes] = useState(task?.notes || "");
  const [dueDate, setDueDate] = useState(
    task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ""
  );
  const [scheduledDate, setScheduledDate] = useState(
    task?.scheduled_date ? new Date(task.scheduled_date).toISOString().split('T')[0] : ""
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">(task?.priority || "");
  const [selectedProjectId, setSelectedProjectId] = useState(task?.project_id || projectId || "");
  const [selectedAreaId, setSelectedAreaId] = useState(task?.area_id || areaId || "");
  const [tags, setTags] = useState(task?.tags?.join(", ") || "");
  const [duration, setDuration] = useState(task?.duration?.toString() || "");

  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Calendar popup states
  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [scheduledDateSearch, setScheduledDateSearch] = useState("");
  const [dueDateSearch, setDueDateSearch] = useState("");
  const [currentScheduledDate, setCurrentScheduledDate] = useState(new Date());
  const [currentDueDate, setCurrentDueDate] = useState(new Date());

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [projectsData, areasData] = await Promise.all([
          getProjects(),
          getAreas(),
        ]);
        setProjects(projectsData);
        setAreas(areasData);
      } catch (error) {
        console.error("Failed to fetch projects and areas:", error);
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

  // Calendar helper functions
  const generateCalendarDays = (currentDate: Date) => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    const days = [];
    
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }
    
    return days;
  };

  const getFilteredDates = (currentDate: Date, searchQuery: string) => {
    const allDays = generateCalendarDays(currentDate);
    if (!searchQuery) return allDays;

    const query = searchQuery.toLowerCase();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    return allDays.map(date => {
      if (!date) return null;
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayNumber = date.getDate().toString();
      
      const matchesDayName = dayName.startsWith(query);
      const matchesDayNumber = dayNumber.includes(query);
      const matchesToday = 'today'.startsWith(query) && date.toDateString() === today.toDateString();
      const matchesTomorrow = 'tomorrow'.startsWith(query) && date.toDateString() === tomorrow.toDateString();
      const matchesYesterday = 'yesterday'.startsWith(query) && date.toDateString() === yesterday.toDateString();
      
      return (matchesDayName || matchesDayNumber || matchesToday || matchesTomorrow || matchesYesterday) ? date : null;
    });
  };

  const getSuggestion = (searchQuery: string) => {
    if (!searchQuery) return "";
    
    const query = searchQuery.toLowerCase();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const relativeDates = ['today', 'tomorrow', 'yesterday'];
    
    const matchingRelativeDate = relativeDates.find(date => date.startsWith(query));
    if (matchingRelativeDate) {
      return matchingRelativeDate.charAt(0).toUpperCase() + matchingRelativeDate.slice(1);
    }
    
    const matchingDay = days.find(day => day.startsWith(query));
    return matchingDay ? matchingDay.charAt(0).toUpperCase() + matchingDay.slice(1) : "";
  };

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDateSelect = (date: Date, type: 'scheduled' | 'due') => {
    const selectedDate = date.toISOString().split('T')[0];
    if (type === 'scheduled') {
      setScheduledDate(selectedDate);
      setShowScheduledDatePicker(false);
    } else {
      setDueDate(selectedDate);
      setShowDueDatePicker(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      notes: notes.trim() || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      priority: priority || null,
      project_id: selectedProjectId || null,
      area_id: selectedAreaId || null,
      tags: tags.trim() ? tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : [],
      duration: duration ? parseInt(duration) : null,
    };

    try {
      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }
      
      // Manually refresh task cache immediately
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error.message);
    }
  };

  return (
    <div className="things-modal">
      <style>{styles}</style>
      <div ref={modalRef} className="things-modal-content max-w-2xl">
        <form id="taskForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-1 py-2 text-xl font-medium border-none outline-none placeholder-gray-400 bg-transparent"
            placeholder="New To-Do"
            autoFocus
          />

          {/* Notes */}
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-1 py-2 text-sm border-none outline-none placeholder-gray-400 bg-transparent resize-none"
              placeholder="Notes"
              rows={3}
            />
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                <div className="flex items-center gap-2 py-2">
                  <button
                    type="button"
                    onClick={() => setShowDueDatePicker(!showDueDatePicker)}
                    className={`p-1 rounded transition-colors ${
                      dueDate ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Set due date"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </button>
                  
                  {!dueDate ? (
                    <div className="relative flex items-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" 
                           className="absolute left-1 pointer-events-none" 
                           style={{ color: 'var(--things-gray-400)' }}>
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                      <input
                        type="text"
                        value={dueDateSearch}
                        onChange={(e) => setDueDateSearch(e.target.value)}
                        className="w-20 pl-5 pr-1 py-0 text-xs border-none outline-none bg-transparent"
                        placeholder=""
                        style={{ color: 'var(--things-gray-600)' }}
                      />
                      {getSuggestion(dueDateSearch) && (
                        <span className="text-xs font-medium ml-1" style={{ color: 'var(--things-gray-600)' }}>
                          {getSuggestion(dueDateSearch)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDueDate("");
                        setDueDateSearch("");
                        setShowDueDatePicker(true);
                      }}
                      className="text-xs font-medium hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                      style={{ color: 'var(--things-gray-600)' }}
                    >
                      {formatSelectedDate(dueDate)}
                    </button>
                  )}
                </div>

                {showDueDatePicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 z-60 w-48">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => setCurrentDueDate(new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() - 1, 1))}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--things-gray-500)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                      </button>
                      <div className="text-xs font-medium" style={{ color: 'var(--things-gray-700)' }}>
                        {currentDueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentDueDate(new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 1, 1))}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--things-gray-500)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} className="text-xs text-center py-1" style={{ color: 'var(--things-gray-500)' }}>
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-0.5">
                      {getFilteredDates(currentDueDate, dueDateSearch).map((date, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => date && handleDateSelect(date, 'due')}
                          disabled={!date}
                          className={`
                            h-6 w-6 text-xs rounded transition-all
                            ${!date ? 'invisible' : ''}
                            ${dueDateSearch && !date ? 'opacity-20' : ''}
                            ${date && date.toDateString() === new Date().toDateString() 
                              ? 'bg-blue-100 text-blue-600 font-medium' 
                              : 'hover:bg-gray-100'
                            }
                            ${date && dueDate && date.toISOString().split('T')[0] === dueDate
                              ? 'text-white font-medium'
                              : 'text-gray-700'
                            }
                          `}
                          style={{
                            backgroundColor: date && dueDate && date.toISOString().split('T')[0] === dueDate ? '#90B1F6' : undefined,
                            color: date && dueDate && date.toISOString().split('T')[0] === dueDate ? 'white' : undefined
                          }}
                        >
                          {date?.getDate()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Scheduled</label>
                <div className="flex items-center gap-2 py-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduledDatePicker(!showScheduledDatePicker)}
                    className={`p-1 rounded transition-colors ${
                      scheduledDate ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Set scheduled date"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </button>
                  
                  {!scheduledDate ? (
                    <div className="relative flex items-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" 
                           className="absolute left-1 pointer-events-none" 
                           style={{ color: 'var(--things-gray-400)' }}>
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                      <input
                        type="text"
                        value={scheduledDateSearch}
                        onChange={(e) => setScheduledDateSearch(e.target.value)}
                        className="w-20 pl-5 pr-1 py-0 text-xs border-none outline-none bg-transparent"
                        placeholder=""
                        style={{ color: 'var(--things-gray-600)' }}
                      />
                      {getSuggestion(scheduledDateSearch) && (
                        <span className="text-xs font-medium ml-1" style={{ color: 'var(--things-gray-600)' }}>
                          {getSuggestion(scheduledDateSearch)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledDate("");
                        setScheduledDateSearch("");
                        setShowScheduledDatePicker(true);
                      }}
                      className="text-xs font-medium hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                      style={{ color: 'var(--things-gray-600)' }}
                    >
                      {formatSelectedDate(scheduledDate)}
                    </button>
                  )}
                </div>

                {showScheduledDatePicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 z-60 w-48">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => setCurrentScheduledDate(new Date(currentScheduledDate.getFullYear(), currentScheduledDate.getMonth() - 1, 1))}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--things-gray-500)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                      </button>
                      <div className="text-xs font-medium" style={{ color: 'var(--things-gray-700)' }}>
                        {currentScheduledDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentScheduledDate(new Date(currentScheduledDate.getFullYear(), currentScheduledDate.getMonth() + 1, 1))}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--things-gray-500)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} className="text-xs text-center py-1" style={{ color: 'var(--things-gray-500)' }}>
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-0.5">
                      {getFilteredDates(currentScheduledDate, scheduledDateSearch).map((date, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => date && handleDateSelect(date, 'scheduled')}
                          disabled={!date}
                          className={`
                            h-6 w-6 text-xs rounded transition-all
                            ${!date ? 'invisible' : ''}
                            ${scheduledDateSearch && !date ? 'opacity-20' : ''}
                            ${date && date.toDateString() === new Date().toDateString() 
                              ? 'bg-blue-100 text-blue-600 font-medium' 
                              : 'hover:bg-gray-100'
                            }
                            ${date && scheduledDate && date.toISOString().split('T')[0] === scheduledDate
                              ? 'text-white font-medium'
                              : 'text-gray-700'
                            }
                          `}
                          style={{
                            backgroundColor: date && scheduledDate && date.toISOString().split('T')[0] === scheduledDate ? '#90B1F6' : undefined,
                            color: date && scheduledDate && date.toISOString().split('T')[0] === scheduledDate ? 'white' : undefined
                          }}
                        >
                          {date?.getDate()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Priority and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="task-form-input"
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
                  className="task-form-input"
                  placeholder="30"
                  min="1"
                />
              </div>
            </div>

            {/* Project and Area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    if (e.target.value) setSelectedAreaId("");
                  }}
                  className="task-form-input"
                >
                  <option value="">None</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Area</label>
                <select
                  value={selectedAreaId || ''}
                  onChange={(e) => {
                    setSelectedAreaId(e.target.value);
                    if (e.target.value) setSelectedProjectId("");
                  }}
                  className="task-form-input"
                >
                  <option value="">None</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
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
                className="task-form-input"
                placeholder="work, urgent (comma separated)"
              />
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="border-t border-gray-200">
          <div className="px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="taskForm"
              disabled={!title.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50"
            >
              {task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
