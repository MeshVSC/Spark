import { useState, useEffect, useRef } from "react";
import { updateTask } from "../lib/queries/tasks";
import { getProjects } from "../lib/queries/projects";
import { getAreas } from "../lib/queries/areas";
import { useTaskStore } from "../stores/useTaskStore";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Area = Database['public']['Tables']['areas']['Row'];

interface TaskEditFormProps {
  task: Task;
  onClose: () => void;
}

export function TaskEditForm({ task, onClose }: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || "");
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ""
  );
  const [scheduledDate, setScheduledDate] = useState(
    task.scheduled_date ? new Date(task.scheduled_date).toISOString().split('T')[0] : ""
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">(task.priority || "");
  const [selectedProjectId, setSelectedProjectId] = useState(task.project_id || "");
  const [selectedAreaId, setSelectedAreaId] = useState(task.area_id || "");
  const [tags, setTags] = useState(task.tags?.join(", ") || "");

  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  // Calendar popup states
  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [scheduledDateSearch, setScheduledDateSearch] = useState("");
  const [dueDateSearch, setDueDateSearch] = useState("");
  const [currentScheduledDate, setCurrentScheduledDate] = useState(new Date());
  const [currentDueDate, setCurrentDueDate] = useState(new Date());
  const modalRef = useRef<HTMLDivElement>(null);
  const { refresh } = useTaskStore();

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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // Add all days of the month
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

    try {
      await updateTask(task.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        priority: priority || null,
        project_id: selectedProjectId || null,
        area_id: selectedAreaId || null,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()) : [],
      });
      

      await refresh();

      
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  return (
    <div className="things-modal">
      <div ref={modalRef} className="things-modal-content">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="things-input text-lg"
                placeholder="What do you want to do?"
                autoFocus
              />
            </div>

            {/* Notes */}
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="things-input resize-none"
                rows={3}
                placeholder="Add some notes..."
              />
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--things-gray-600)' }}>
                  When
                </label>
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
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--things-gray-400)' }}>
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                      <input
                        type="text"
                        value={scheduledDateSearch}
                        onChange={(e) => setScheduledDateSearch(e.target.value)}
                        className="w-16 px-1 py-0 text-xs border-none outline-none bg-transparent"
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
              
              <div className="relative">
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--things-gray-600)' }}>
                  Deadline
                </label>
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
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--things-gray-400)' }}>
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                      <input
                        type="text"
                        value={dueDateSearch}
                        onChange={(e) => setDueDateSearch(e.target.value)}
                        className="w-16 px-1 py-0 text-xs border-none outline-none bg-transparent"
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
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--things-gray-600)' }}>
                Priority
              </label>
              <div className="flex gap-2">
                {[
                  { value: "", label: "None", color: "transparent" },
                  { value: "low", label: "Low", color: "#34C759" },
                  { value: "medium", label: "Medium", color: "#FF9500" },
                  { value: "high", label: "High", color: "#FF3B30" },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value as any)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      priority === p.value
                        ? "text-white"
                        : "hover:bg-gray-100"
                    }`}
                    style={{
                      backgroundColor: priority === p.value ? '#90B1F6' : 'var(--things-gray-100)',
                      color: priority === p.value ? 'white' : 'var(--things-gray-600)'
                    }}
                  >
                    {p.value && (
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: p.color }}
                      />
                    )}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project and Area */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--things-gray-600)' }}>
                  Project
                </label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    if (e.target.value) setSelectedAreaId("");
                  }}
                  className="things-input"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--things-gray-600)' }}>
                  Area
                </label>
                <select
                  value={selectedAreaId || ''}
                  onChange={(e) => {
                    setSelectedAreaId(e.target.value);
                    if (e.target.value) setSelectedProjectId("");
                  }}
                  className="things-input"
                >
                  <option value="">No area</option>
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
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--things-gray-600)' }}>
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="things-input"
                placeholder="work, personal, urgent"
              />
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="things-button-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="things-button-primary disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>

            {/* Helper text */}
            <p className="text-xs text-center" style={{ color: 'var(--things-gray-500)' }}>
              Press Escape to cancel
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
