import { useState, useEffect } from "react";
import { getTasks, toggleTask, deleteTask, subscribeToTasks } from "../lib/queries/tasks";
import { getProjects, subscribeToProjects } from "../lib/queries/projects";
import { TaskItem } from "./TaskItem";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface TaskListProps {
  view: "inbox" | "today" | "upcoming" | "someday" | "completed";
  projectId?: string | null;
  areaId?: string | null;
  filters?: {
    priority?: "low" | "medium" | "high";
    tags?: string[];
    dateRange?: "today" | "week" | "month";
  };
  onEditTask: (taskId: string) => void;
  tasks: Task[];
}

interface ProjectWithTasks extends Project {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
}

export function TaskList({ view, projectId, areaId, filters = {}, onEditTask, tasks }: TaskListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithTasks, setProjectsWithTasks] = useState<ProjectWithTasks[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const initialProjects = await getProjects();
        setProjects(initialProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchProjects();

    const projectSubscription = subscribeToProjects(async () => {
      try {
        const updatedProjects = await getProjects();
        setProjects(updatedProjects);
      } catch (error) {
        console.error("Failed to fetch updated projects:", error);
      }
    });

    return () => {
      projectSubscription.unsubscribe();
    };
  }, []);

  // Group tasks by project when not viewing a specific project
  useEffect(() => {
    console.log('TaskList useEffect - tasks:', tasks);
    console.log('TaskList useEffect - projects:', projects);
    console.log('TaskList useEffect - projectId:', projectId, 'areaId:', areaId);
    
    if (projectId || areaId || !projects.length) {
      setProjectsWithTasks([]);
      return;
    }

    const projectTaskMap = new Map<string, Task[]>();
    const unassignedTasks: Task[] = [];

    tasks.forEach(task => {
      if (task.project_id) {
        const projectTasks = projectTaskMap.get(task.project_id) || [];
        projectTasks.push(task);
        projectTaskMap.set(task.project_id, projectTasks);
      } else {
        unassignedTasks.push(task);
      }
    });

    const organized = projects.map(project => {
      const projectTasks = projectTaskMap.get(project.id) || [];
      const completedCount = projectTasks.filter(t => t.completed).length;
      return {
        ...project,
        tasks: projectTasks,
        completedCount,
        totalCount: projectTasks.length
      };
    }).filter(p => p.totalCount > 0);

    // Add unassigned tasks as a special "Inbox" project if any exist
    if (unassignedTasks.length > 0) {
      organized.unshift({
        id: 'unassigned',
        name: 'Inbox',
        description: null,
        color: '#8E8E93',
        user_id: '',
        is_archived: false,
        sort_order: 0,
        created_at: '',
        updated_at: '',
        tasks: unassignedTasks,
        completedCount: unassignedTasks.filter(t => t.completed).length,
        totalCount: unassignedTasks.length
      });
    }

    setProjectsWithTasks(organized);
  }, [tasks, projects, projectId, areaId]);

  const handleToggle = async (id: string) => {
    try {
      await toggleTask(id);
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Apply client-side filters
  const applyFilters = (taskList: Task[]) => {
    return taskList.filter(task => {
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        
        let rangeEnd = todayStart;
        
        switch (filters.dateRange) {
          case "today":
            today.setHours(23, 59, 59, 999);
            rangeEnd = today.getTime();
            break;
          case "week":
            rangeEnd = todayStart + (7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            rangeEnd = todayStart + (30 * 24 * 60 * 60 * 1000);
            break;
        }

        const taskDateStr = task.due_date || task.scheduled_date;
        if (!taskDateStr) return false;
        
        const taskDate = new Date(taskDateStr).getTime();
        if (taskDate < todayStart || taskDate > rangeEnd) {
          return false;
        }
      }

      return true;
    });
  };

  const ProjectHeader = ({ project }: { project: ProjectWithTasks }) => (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        {/* Completion circle */}
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          project.completedCount === project.totalCount && project.totalCount > 0
            ? 'bg-blue-500 border-blue-500'
            : 'border-gray-300'
        }`}>
          {project.completedCount === project.totalCount && project.totalCount > 0 && (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
              <polyline points="20,6 9,17 4,12" stroke="white" strokeWidth="3" fill="none"/>
            </svg>
          )}
        </div>
        
        {/* Project title */}
        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
        
        {/* Three dots menu */}
        <button className="p-1 rounded hover:bg-gray-100 transition-colors">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </button>
      </div>
      
      {/* Project description */}
      {project.description && (
        <p className="text-sm text-gray-500 mb-2 ml-7">{project.description}</p>
      )}
      
      {/* Filter tags placeholder */}
      <div className="ml-7 mb-3">
        <div className="flex gap-2">
          <span className="things-tag">
            Important
          </span>
          <span className="things-tag" style={{ background: 'rgba(0, 122, 255, 0.1)', color: 'var(--things-blue)' }}>
            Work
          </span>
        </div>
      </div>
    </div>
  );

  // If viewing a specific project or area, show traditional task list
  if (projectId || areaId) {
    const filteredTasks = applyFilters(tasks);

    return (
      <div className="space-y-1">
        {filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={() => handleToggle(task.id)}
            onDelete={() => handleDelete(task.id)}
            onEditTask={onEditTask}
          />
        ))}
      </div>
    );
  }

  // Project-organized view
  if (projectsWithTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="text-6xl mb-4 opacity-50">📝</div>
        <h3 className="text-lg font-medium mb-2 text-gray-500">No to-dos</h3>
        <p className="text-sm text-gray-400">
          Tap the + button to add your first to-do
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {projectsWithTasks.map((project, index) => {
        const filteredTasks = applyFilters(project.tasks);
        console.log(`Project ${project.name}:`, project.tasks);
        console.log(`Filtered tasks for project ${project.name}:`, filteredTasks);
        console.log('Current filters:', filters);
        if (filteredTasks.length === 0) return null;
        
        return (
          <div key={project.id} className="space-y-3">
            <ProjectHeader project={project} />
            
            <div className="space-y-1 ml-7">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggle(task.id)}
                  onDelete={() => handleDelete(task.id)}
                  onEditTask={onEditTask}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
