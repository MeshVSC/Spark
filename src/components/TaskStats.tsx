import { useState, useEffect } from "react";
import { getTasks, subscribeToTasks } from "../lib/queries/tasks";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskStatsProps {
  view: "inbox" | "today" | "upcoming" | "someday" | "completed";
  projectId?: string | null;
  areaId?: string | null;
}

export function TaskStats({ view, projectId, areaId }: TaskStatsProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getTasks({ view, projectId, areaId });
        setTasks(fetchedTasks);
        const fetchedCompletedTasks = await getTasks({ view: "completed", projectId, areaId });
        setCompletedTasks(fetchedCompletedTasks);
      } catch (error) {
        console.error("Failed to fetch tasks for stats:", error);
      }
    };

    fetchTasks();

    const taskSubscription = subscribeToTasks(async () => {
        const fetchedTasks = await getTasks({ view, projectId, areaId });
        setTasks(fetchedTasks);
        const fetchedCompletedTasks = await getTasks({ view: "completed", projectId, areaId });
        setCompletedTasks(fetchedCompletedTasks);
    });

    return () => {
      taskSubscription.unsubscribe();
    };
  }, [view, projectId, areaId]);

  const totalTasks = tasks.length + completedTasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = tasks.length;

  if (totalTasks === 0) return null;

  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Progress</h3>
        <span className="text-sm text-gray-500">{completionRate}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionRate}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{pendingCount} pending</span>
        <span>{completedCount} completed</span>
      </div>
    </div>
  );
}
