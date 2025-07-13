import { useState, useEffect, useRef } from "react";
import { createTask } from "../lib/queries/tasks";

interface QuickEntryProps {
  isVisible: boolean;
  onClose: () => void;
  projectId?: string | null;
  areaId?: string | null;
  onTaskCreated?: () => void;
}

export function QuickEntry({ isVisible, onClose, projectId, areaId, onTaskCreated }: QuickEntryProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const generateCalendarDays = () => {
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

  const handleDateSelect = (date: Date) => {
    const selectedDate = date.toISOString().split('T')[0];
    setDueDate(selectedDate);
    setShowDatePicker(false);
  };

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getFilteredDates = () => {
    const allDays = generateCalendarDays();
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
      
      // Check if search matches day name (f for friday, w for wednesday, etc.)
      const matchesDayName = dayName.startsWith(query);
      
      // Check if search matches day number (1, 2, 15, etc.)
      const matchesDayNumber = dayNumber.includes(query);
      
      // Check if search matches relative dates
      const matchesToday = 'today'.startsWith(query) && date.toDateString() === today.toDateString();
      const matchesTomorrow = 'tomorrow'.startsWith(query) && date.toDateString() === tomorrow.toDateString();
      const matchesYesterday = 'yesterday'.startsWith(query) && date.toDateString() === yesterday.toDateString();
      
      return (matchesDayName || matchesDayNumber || matchesToday || matchesTomorrow || matchesYesterday) ? date : null;
    });
  };

  const getSuggestion = () => {
    if (!searchQuery) return "";
    
    const query = searchQuery.toLowerCase();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const relativeDates = ['today', 'tomorrow', 'yesterday'];
    
    // Check relative dates first
    const matchingRelativeDate = relativeDates.find(date => date.startsWith(query));
    if (matchingRelativeDate) {
      return matchingRelativeDate.charAt(0).toUpperCase() + matchingRelativeDate.slice(1);
    }
    
    // Then check day names
    const matchingDay = days.find(day => day.startsWith(query));
    return matchingDay ? matchingDay.charAt(0).toUpperCase() + matchingDay.slice(1) : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      console.log('🚀 Creating task...');
      await createTask({
        title: title.trim(),
        project_id: projectId,
        area_id: areaId,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      console.log('✅ Task created successfully');
      
      // Manually refresh task cache immediately
      if (onTaskCreated) {
        console.log('🔄 Triggering cache refresh...');
        onTaskCreated();
      }
      
      setTitle("");
      setDueDate("");
      setShowDatePicker(false);
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
      // Optionally, display an error to the user
    }
  };

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

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50">
      <div ref={modalRef} className="bg-white rounded-xl shadow-2xl p-4 w-96">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-0 py-2 text-base border-none outline-none placeholder-gray-400"
            placeholder="New To-Do"
            autoFocus
          />
          
          {showDatePicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 z-60 w-48">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  style={{ color: 'var(--things-gray-500)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                </button>
                <div className="text-xs font-medium" style={{ color: 'var(--things-gray-700)' }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <button
                  type="button"
                  onClick={goToNextMonth}
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
                {getFilteredDates().map((date, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => date && handleDateSelect(date)}
                    disabled={!date}
                    className={`
                      h-6 w-6 text-xs rounded transition-all
                      ${!date ? 'invisible' : ''}
                      ${searchQuery && !date ? 'opacity-20' : ''}
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
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Calendar button clicked', showDatePicker);
                  setShowDatePicker(!showDatePicker);
                }}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-16 px-1 py-0 text-xs border-none outline-none bg-transparent"
                    placeholder=""
                    style={{ color: 'var(--things-gray-600)' }}
                  />
                  {getSuggestion() && (
                    <span className="text-xs font-medium ml-1" style={{ color: 'var(--things-gray-600)' }}>
                      {getSuggestion()}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDueDate("");
                    setSearchQuery("");
                    setShowDatePicker(true);
                  }}
                  className="text-xs font-medium hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                  style={{ color: 'var(--things-gray-600)' }}
                >
                  {formatSelectedDate(dueDate)}
                </button>
              )}
            </div>
            <div className="flex gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
}