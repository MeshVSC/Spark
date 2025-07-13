import { useState, useEffect, useRef } from "react";
import { createProject, updateProject, getProject } from "../lib/queries/projects";
import { getAreas } from "../lib/queries/areas";
import type { Database } from "../lib/supabase";

type Area = Database['public']['Tables']['areas']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectFormProps {
  onClose: () => void;
  areaId?: string | null;
  projectId?: string | null;
}


export function ProjectForm({ onClose, areaId, projectId }: ProjectFormProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [selectedAreaId, setSelectedAreaId] = useState(areaId || "");
  const [tags, setTags] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calendar popup states (copying from TaskForm)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [dueDateSearch, setDueDateSearch] = useState("");
  const [currentDueDate, setCurrentDueDate] = useState(new Date());

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const areasData = await getAreas();
        setAreas(areasData);
        
        if (projectId) {
          const projectData = await getProject(projectId);
          if (projectData) {
            setProject(projectData);
            setName(projectData.name);
            setDescription(projectData.description || "");
            setDueDate(projectData.due_date ? new Date(projectData.due_date).toISOString().split('T')[0] : "");
            setPriority(projectData.priority || "");
            setSelectedAreaId(projectData.area_id || areaId || "");
            setTags(projectData.tags?.join(", ") || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, [projectId, areaId]);

  // Calendar helper functions (copied from TaskForm)
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

  const handleDateSelect = (date: Date) => {
    const selectedDate = date.toISOString().split('T')[0];
    setDueDate(selectedDate);
    setShowDueDatePicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const projectData = {
      name: name.trim(),
      description: description.trim() || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority: priority || undefined,
      area_id: selectedAreaId || undefined,
      tags: tags.trim() ? tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : undefined,
    };

    try {
      if (projectId && project) {
        await updateProject(projectId, projectData);
      } else {
        await createProject(projectData);
      }
      onClose();
    } catch (error) {
      console.error(`Failed to ${projectId ? 'update' : 'create'} project:`, error);
    }
  };

  return (
    <div className="things-modal">
      <div ref={modalRef} className="things-modal-content max-w-lg">
        <form id="projectForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-1 py-2 text-xl font-medium border-none outline-none placeholder-gray-400 bg-transparent"
            placeholder={projectId ? "Edit Project" : "New Project"}
            autoFocus
          />

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-1 py-2 text-sm border-none outline-none placeholder-gray-400 bg-transparent resize-none"
              placeholder="What is this project about?"
              rows={1}
            />
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Due Date */}
            <div className="relative">
              <div className="flex items-center gap-2 py-2">
                <span className="text-xs font-medium text-gray-500">Due Date</span>
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
                        onClick={() => date && handleDateSelect(date)}
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

            {/* Priority and Folder */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 py-2">
                <span className="text-xs font-medium text-gray-500">Priority</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="flex-1 px-1 py-2 text-sm border-none outline-none bg-transparent"
                  style={{ color: 'var(--things-gray-600)' }}
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-center gap-2 py-2">
                <span className="text-xs font-medium text-gray-500">Folder</span>
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="flex-1 px-1 py-2 text-sm border-none outline-none bg-transparent"
                  style={{ color: 'var(--things-gray-600)' }}
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

          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Tags */}
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs font-medium text-gray-500">Tags</span>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="flex-1 px-1 py-2 text-sm border-none outline-none bg-transparent"
                placeholder="work, urgent (comma separated)"
                style={{ color: 'var(--things-gray-600)' }}
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
              form="projectForm"
              disabled={!name.trim()}
              className="px-3 py-1 rounded text-xs disabled:opacity-50"
              style={{ background: "#90B1F6", color: "white" }}
            >
              {projectId ? "Update Project" : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}