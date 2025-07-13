import { useState, useEffect } from "react";
import { getTasksForCalendar, updateTask } from "../lib/queries/tasks";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];

interface CalendarViewProps {
  view: "month" | "week";
  onTaskClick: (taskId: string) => void;
}

export function CalendarView({ view, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const startDate = getCalendarStartDate(currentDate, view).getTime();
        const endDate = getCalendarEndDate(currentDate, view).getTime();
        const fetchedTasks = await getTasksForCalendar(startDate, endDate);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to fetch calendar tasks:", error);
        setTasks([]);
      }
    };

    fetchTasks();
  }, [currentDate, view]);


  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedTask) return;

    const newScheduledDate = new Date(date);
    newScheduledDate.setHours(9, 0, 0, 0); // Default to 9 AM

    try {
        await updateTask(draggedTask, {
            scheduled_date: newScheduledDate.toISOString(),
        });
        // Refetch tasks after update
        const startDate = getCalendarStartDate(currentDate, view).getTime();
        const endDate = getCalendarEndDate(currentDate, view).getTime();
        const fetchedTasks = await getTasksForCalendar(startDate, endDate);
        setTasks(fetchedTasks);
    } catch (error) {
        console.error("Failed to update task:", error);
    }


    setDraggedTask(null);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return tasks.filter(task => {
      if (task.scheduled_date) {
        return new Date(task.scheduled_date).toDateString() === dateStr;
      }
      if (task.due_date) {
        return new Date(task.due_date).toDateString() === dateStr;
      }
      return false;
    });
  };

  const renderMonthView = () => {
    const startDate = getCalendarStartDate(currentDate, "month");
    const endDate = getCalendarEndDate(currentDate, "month");
    const days = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayTasks = getTasksForDate(date);
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={date.toISOString()}
          className={`min-h-24 p-2 border border-gray-200 ${
            !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
          } ${isToday ? "bg-blue-50 border-blue-200" : ""}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, new Date(date))}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
            {date.getDate()}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => onTaskClick(task.id)}
                className={`text-xs p-1 rounded cursor-pointer truncate ${
                  task.completed 
                    ? "bg-gray-100 text-gray-500 line-through" 
                    : task.priority === "high"
                    ? "bg-red-100 text-red-700"
                    : task.priority === "medium"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700"
                }`}
                title={task.title}
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayTasks.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-gray-100 p-3 text-center text-sm font-medium text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = getCalendarStartDate(currentDate, "week");
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayTasks = getTasksForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div key={date.toISOString()} className="flex-1 border-r border-gray-200 last:border-r-0">
          <div className={`p-3 text-center border-b border-gray-200 ${isToday ? "bg-blue-50" : "bg-gray-50"}`}>
            <div className="text-xs text-gray-500 uppercase">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-lg font-semibold ${isToday ? "text-blue-600" : ""}`}>
              {date.getDate()}
            </div>
          </div>
          <div
            className="p-2 min-h-96 space-y-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, date)}
          >
            {dayTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => onTaskClick(task.id)}
                className={`p-2 rounded cursor-pointer text-sm ${
                  task.completed 
                    ? "bg-gray-100 text-gray-500 line-through" 
                    : task.priority === "high"
                    ? "bg-red-100 text-red-700 border-l-4 border-red-400"
                    : task.priority === "medium"
                    ? "bg-orange-100 text-orange-700 border-l-4 border-orange-400"
                    : "bg-blue-100 text-blue-700 border-l-4 border-blue-400"
                }`}
              >
                <div className="font-medium">{task.title}</div>
                {task.duration && (
                  <div className="text-xs opacity-75 mt-1">
                    {formatDuration(task.duration)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric',
              ...(view === "week" ? { day: 'numeric' } : {})
            })}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate("next")}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === "month" ? renderMonthView() : renderWeekView()}
    </div>
  );
}

function getCalendarStartDate(date: Date, view: "month" | "week"): Date {
  if (view === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setDate(start.getDate() - start.getDay());
    return start;
  } else {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }
}

function getCalendarEndDate(date: Date, view: "month" | "week"): Date {
  if (view === "month") {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setDate(end.getDate() + (6 - end.getDay()));
    return end;
  } else {
    const end = new Date(date);
    end.setDate(end.getDate() + (6 - end.getDay()));
    return end;
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  return `${mins}m`;
}
