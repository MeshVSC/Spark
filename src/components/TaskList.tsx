import { useState, useEffect, useMemo } from "react";
import { toggleTask, deleteTask } from "../lib/queries/tasks";
import { getProjects, subscribeToProjects } from "../lib/queries/projects";
import { TaskItem } from "./TaskItem";
import type { Database } from "../lib/supabase";
import ProgressCircle from "./ui/ProgressCircle";
import { useTaskStore } from "../stores/useTaskStore";

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
}

interface ProjectWithTasks extends Project {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
}

export function TaskList({ view, projectId, areaId, filters = {}, onEditTask }: TaskListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithTasks, setProjectsWithTasks] = useState<ProjectWithTasks[]>([]);
  const { tasks: allTasks } = useTaskStore();

  const tasks = useMemo(() => {
    let list = allTasks;

    if (projectId) {
      list = list.filter(t => t.project_id === projectId);
    } else if (areaId) {
      const areaProjectIds = projects.filter(p => p.area_id === areaId).map(p => p.id);
      list = list.filter(t =>
        t.area_id === areaId ||
        (t.project_id && areaProjectIds.includes(t.project_id))
      );
    }

    if (view === 'inbox' && !projectId && !areaId) {
      list = allTasks;
    } else if (view === 'today') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const todayEnd = today.getTime();
      list = list.filter(task =>
        !task.completed && (
          (task.scheduled_date && new Date(task.scheduled_date).getTime() <= todayEnd) ||
          (task.due_date && new Date(task.due_date).getTime() <= todayEnd)
        )
      );
    } else if (view === 'completed') {
      list = list.filter(task => task.completed);
    } else {
      list = list.filter(task => !task.completed);
    }

    return list;
  }, [allTasks, view, projectId, areaId, projects]);

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
    <div className="mb-6 group">
      <div className="flex items-center justify-between mb-3">
        {/* Project title with task stats */}
        <div className="flex items-center gap-3 flex-1">
          <ProgressCircle 
            completion={project.totalCount > 0 ? Math.round((project.completedCount / project.totalCount) * 100) : 0}
            size={20}
          />
          <h3 className="section-header">{project.name}</h3>
          <span className="task-metadata">
            {project.completedCount} of {project.totalCount}
          </span>
        </div>
        
        {/* Three dots menu */}
        <button 
          onClick={() => onEditTask(project.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all duration-150"
        >
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </button>
      </div>
      
      {/* Horizontal line */}
      <div className="border-b border-gray-200 mb-4"></div>
      
      {/* Project description */}
      {project.description && (
        <p className="project-description mb-4">{project.description}</p>
      )}
    </div>
  );

  // If viewing a specific project or area, show traditional task list
  if (projectId || areaId) {
    const filteredTasks = applyFilters(tasks);

    return (
      <div className="space-y-0">
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
            
            <div className="space-y-0">
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
