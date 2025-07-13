import { useState, useEffect } from "react";
import { getTasksForDate, subscribeToTasks } from "../lib/queries/tasks";
import { createTimeBlock, updateTimeBlock, deleteTimeBlock, getTimeBlocks, subscribeToTimeBlocks } from "../lib/queries/timeBlocks";
import type { Database } from "../lib/supabase";

type TimeBlock = Database['public']['Tables']['time_blocks']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

export function TimeBlockingView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTimeBlocks = async () => {
      try {
        const fetchedBlocks = await getTimeBlocks(selectedDate.getTime());
        setTimeBlocks(fetchedBlocks);
      } catch (error) {
        console.error("Failed to fetch time blocks:", error);
      }
    };

    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getTasksForDate(selectedDate.getTime());
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to fetch tasks for date:", error);
      }
    };

    fetchTimeBlocks();
    fetchTasks();

    const timeBlockSubscription = subscribeToTimeBlocks(selectedDate.getTime(), setTimeBlocks);
    const taskSubscription = subscribeToTasks(async () => {
        const updatedTasks = await getTasksForDate(selectedDate.getTime());
        setTasks(updatedTasks);
    });

    return () => {
      timeBlockSubscription.unsubscribe();
      taskSubscription.unsubscribe();
    };
  }, [selectedDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleCreateBlock = async (hour: number) => {
    const startTime = new Date(selectedDate);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);

    const title = prompt("Time block title:");
    if (!title) return;

    try {
      await createTimeBlock({
        title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });
    } catch (error) {
      console.error("Failed to create time block:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    if (!draggedBlock) return;

    const newStartTime = new Date(selectedDate);
    newStartTime.setHours(hour, 0, 0, 0);

    try {
      await updateTimeBlock(draggedBlock, {
        start_time: newStartTime.toISOString(),
      });
    } catch (error) {
      console.error("Failed to update time block:", error);
    }

    setDraggedBlock(null);
  };

  const formatTime = (hour: number) => {
    const time = new Date();
    time.setHours(hour, 0, 0, 0);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      hour12: true 
    });
  };

  const getBlocksForHour = (hour: number) => {
    return timeBlocks.filter(block => {
      const blockHour = new Date(block.start_time).getHours();
      return blockHour === hour;
    });
  };

  return (
    <div className="flex h-full">
      {/* Time Column */}
      <div className="w-20 border-r border-gray-200">
        <div className="h-12 border-b border-gray-200"></div>
        {hours.map((hour) => (
          <div
            key={hour}
            className="h-16 border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
          >
            <span className="text-xs text-gray-500">
              {formatTime(hour)}
            </span>
          </div>
        ))}
      </div>

      {/* Schedule Column */}
      <div className="flex-1">
        {/* Header */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
            
            <h3 className="font-medium">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Today
          </button>
        </div>

        {/* Time Slots */}
        <div className="relative">
          {hours.map((hour) => {
            const blocks = getBlocksForHour(hour);
            const isCurrentHour = new Date().getHours() === hour && 
                                 selectedDate.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={hour}
                className={`h-16 border-b border-gray-100 relative group ${
                  isCurrentHour ? "bg-blue-50" : ""
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, hour)}
                onDoubleClick={() => handleCreateBlock(hour)}
              >
                {/* Add block button */}
                <button
                  onClick={() => handleCreateBlock(hour)}
                  className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 hover:bg-gray-50 transition-opacity flex items-center justify-center"
                >
                  <span className="text-xs text-gray-400">+ Add time block</span>
                </button>

                {/* Time blocks */}
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block.id)}
                    className="absolute inset-x-2 top-1 bottom-1 rounded p-2 cursor-move shadow-sm border-l-4"
                    style={{ 
                      backgroundColor: block.color + "20",
                      borderLeftColor: block.color 
                    }}
                  >
                    <div className="text-sm font-medium truncate">
                      {block.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(block.start_time).toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true 
                      })} - {new Date(block.end_time).toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled Tasks Sidebar */}
      <div className="w-64 border-l border-gray-200 bg-gray-50">
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Unscheduled Tasks</h4>
          <div className="space-y-2">
            {tasks
              .filter(task => !task.scheduled_date && !task.completed)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  className="p-2 bg-white rounded border cursor-move hover:shadow-sm"
                >
                  <div className="text-sm font-medium">{task.title}</div>
                  {task.duration && (
                    <div className="text-xs text-gray-500 mt-1">
                      Est. {formatDuration(task.duration)}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  return `${mins}m`;
}
