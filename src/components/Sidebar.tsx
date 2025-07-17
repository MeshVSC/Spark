import { useState, useEffect } from "react";
import { getProjects, subscribeToProjects } from "../lib/queries/projects";
import { getAreas, subscribeToAreas } from "../lib/queries/areas";
import { getTaskStats, subscribeToTasks, getTasks } from "../lib/queries/tasks";
import { SignOutButton } from "../SignOutButton";
import { Settings } from "./Settings";
import { useSettings } from "../contexts/SettingsContext";
import { useTaskNavigation } from "../hooks/useTaskNavigation";
import type { Database } from "../lib/supabase";
import ProgressCircle from "./ui/ProgressCircle";

// Icon mapping for areas - returns JSX elements instead of emoji
const getAreaIcon = (iconName?: string | null) => {
  const iconStyle = "w-4 h-4 text-gray-500";
  
  switch (iconName) {
    case 'work':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,6V4H10V6H4V18H20V6M12,7A3,3 0 0,1 15,10A3,3 0 0,1 12,13A3,3 0 0,1 9,10A3,3 0 0,1 12,7Z" />
        </svg>
      );
    case 'home':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
        </svg>
      );
    case 'health':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M15.5,12L14,10.5L10.5,14L8.5,12L7,13.5L10.5,17L15.5,12Z" />
        </svg>
      );
    case 'money':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6.5A2,2 0 0,1 14,8.5V9.5A2,2 0 0,1 12,11.5A2,2 0 0,1 10,9.5V8.5A2,2 0 0,1 12,6.5M8.5,12H15.5V13.5H8.5V12M8.5,15H15.5V16.5H8.5V15Z" />
        </svg>
      );
    case 'education':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z" />
        </svg>
      );
    case 'shopping':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,18C17.56,18 18,18.44 18,19C18,19.56 17.56,20 17,20C16.44,20 16,19.56 16,19C16,18.44 16.44,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15C5,16.1 5.9,17 7,17H19V15H7.42C7.28,15 7.17,14.89 7.17,14.75L7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C7.56,18 8,18.44 8,19C8,19.56 7.56,20 7,20C6.44,20 6,19.56 6,19C6,18.44 6.44,18 7,18Z" />
        </svg>
      );
    case 'travel':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
        </svg>
      );
    case 'goals':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,10.5A1.5,1.5 0 0,1 13.5,12A1.5,1.5 0 0,1 12,13.5A1.5,1.5 0 0,1 10.5,12A1.5,1.5 0 0,1 12,10.5Z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
        </svg>
      );
    case 'heart':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
        </svg>
      );
    case 'creative':
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M13,11H14V13H13V11M12,7A5,5 0 0,0 7,12H9A3,3 0 0,1 12,9A3,3 0 0,1 15,12H17A5,5 0 0,0 12,7Z" />
        </svg>
      );
    case 'folder':
    default:
      return (
        <svg className={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-2l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
        </svg>
      );
  }
};

type Project = Database['public']['Tables']['projects']['Row'];
type Area = Database['public']['Tables']['areas']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type TaskStats = Awaited<ReturnType<typeof getTaskStats>>;

interface SidebarProps {
  currentView: "inbox" | "today" | "upcoming" | "someday" | "completed" | "calendar" | "timeblocking";
  onViewChange: (view: "inbox" | "today" | "upcoming" | "someday" | "completed" | "calendar" | "timeblocking") => void;
  selectedProjectId: string | null;
  selectedAreaId: string | null;
  onProjectSelect: (projectId: string) => void;
  onAreaSelect: (areaId: string) => void;
  onProjectEdit: (projectId: string) => void;
  onNewProject: () => void;
  onNewArea: () => void;
  onEditArea: (area: Area) => void;
  onNewTask: () => void;
  onQuickEntry: () => void;
  user: any;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  selectedProjectId,
  selectedAreaId,
  onProjectSelect,
  onAreaSelect,
  onProjectEdit,
  onNewProject,
  onNewArea,
  onEditArea,
  onNewTask,
  onQuickEntry,
  user,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<string, number>>({});
  const [projectTasks, setProjectTasks] = useState<Record<string, Task[]>>({});
  const [projectCompletionStats, setProjectCompletionStats] = useState<Record<string, { completed: number; total: number }>>({});
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();
  const { openTask } = useTaskNavigation();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [initialProjects, initialAreas, initialTaskStats, allTasks] = await Promise.all([
          getProjects(),
          getAreas(),
          getTaskStats(),
          getTasks({ view: "stats" }) // Get all tasks (completed and incomplete) for statistics
        ]);
        setProjects(initialProjects);
        setAreas(initialAreas);
        setTaskStats(initialTaskStats);
        
        // Calculate task counts and group tasks per project
        const counts: Record<string, number> = {};
        const tasksByProject: Record<string, Task[]> = {};
        const completionStats: Record<string, { completed: number; total: number }> = {};
        
        allTasks.forEach(task => {
          if (task.project_id) {
            // Track incomplete tasks for count display
            if (!task.completed) {
              counts[task.project_id] = (counts[task.project_id] || 0) + 1;
              if (!tasksByProject[task.project_id]) {
                tasksByProject[task.project_id] = [];
              }
              tasksByProject[task.project_id].push(task);
            }
            
            // Track completion stats for progress circles
            if (!completionStats[task.project_id]) {
              completionStats[task.project_id] = { completed: 0, total: 0 };
            }
            completionStats[task.project_id].total++;
            if (task.completed) {
              completionStats[task.project_id].completed++;
            }
          }
        });
        
        setProjectTaskCounts(counts);
        setProjectTasks(tasksByProject);
        setProjectCompletionStats(completionStats);
        
        // Debug logging
        console.log('🎯 Initial project completion stats:', completionStats);
        console.log('📊 Initial project task counts:', counts);
      } catch (error) {
        console.error("Failed to fetch initial sidebar data:", error);
      }
    };

    fetchInitialData();

    const projectSubscription = subscribeToProjects(async () => {
      try {
        console.log('🔄 Project subscription triggered, fetching updated projects...');
        const updatedProjects = await getProjects();
        console.log('✅ Projects updated:', updatedProjects.length);
        setProjects(updatedProjects);
      } catch (error) {
        console.error("Failed to fetch updated projects:", error);
      }
    });
    
    const areaSubscription = subscribeToAreas(async () => {
      try {
        console.log('🔄 Area subscription triggered, fetching updated areas...');
        const updatedAreas = await getAreas();
        console.log('✅ Areas updated:', updatedAreas.length);
        setAreas(updatedAreas);
      } catch (error) {
        console.error("Failed to fetch updated areas:", error);
      }
    });
    
    // A bit inefficient to refetch all tasks for stats, but works for now.
    // A dedicated stats subscription would be better in a real app.
    const taskSubscription = subscribeToTasks(async () => {
      try {
        const stats = await getTaskStats();
        setTaskStats(stats);
        
        // Recalculate task counts and group tasks
        const allTasks = await getTasks({ view: "stats" }); // Get all tasks (completed and incomplete) for statistics
        const counts: Record<string, number> = {};
        const tasksByProject: Record<string, Task[]> = {};
        const completionStats: Record<string, { completed: number; total: number }> = {};
        
        allTasks.forEach(task => {
          if (task.project_id) {
            // Track incomplete tasks for count display
            if (!task.completed) {
              counts[task.project_id] = (counts[task.project_id] || 0) + 1;
              if (!tasksByProject[task.project_id]) {
                tasksByProject[task.project_id] = [];
              }
              tasksByProject[task.project_id].push(task);
            }
            
            // Track completion stats for progress circles
            if (!completionStats[task.project_id]) {
              completionStats[task.project_id] = { completed: 0, total: 0 };
            }
            completionStats[task.project_id].total++;
            if (task.completed) {
              completionStats[task.project_id].completed++;
            }
          }
        });
        
        setProjectTaskCounts(counts);
        setProjectTasks(tasksByProject);
        setProjectCompletionStats(completionStats);
        
        // Debug logging
        console.log('🔄 Updated project completion stats:', completionStats);
        console.log('📊 Updated project task counts:', counts);
      } catch (error) {
        console.error("Failed to fetch updated task stats:", error);
      }
    });

    return () => {
      projectSubscription.unsubscribe();
      areaSubscription.unsubscribe();
      taskSubscription.unsubscribe();
    };
  }, []);


  const views = [
    { 
      id: "inbox" as const, 
      name: "Inbox", 
      count: taskStats?.pending || 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
        </svg>
      )
    },
    { 
      id: "today" as const, 
      name: "Today", 
      count: taskStats?.dueToday || 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
        </svg>
      )
    },
    { 
      id: "upcoming" as const, 
      name: "Upcoming", 
      count: 0, // We'll calculate this differently
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    { 
      id: "someday" as const, 
      name: "Someday", 
      count: 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m8 3 4 8 5-5v11H6V3z"></path>
        </svg>
      )
    },
    { 
      id: "completed" as const, 
      name: "Completed", 
      count: taskStats?.completed || 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      )
    },
  ];

  const calendarViews = [
    {
      id: "calendar" as const,
      name: "Calendar",
      count: 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    {
      id: "timeblocking" as const,
      name: "Time Blocking",
      count: 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
      )
    },
    {
      id: "folders" as const,
      name: "Folders",
      count: 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-2l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
        </svg>
      )
    },
    {
      id: "all-projects" as const,
      name: "All Projects",
      count: 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      )
    },
  ];

  const toggleProjectCollapse = (projectId: string) => {
    const newCollapsed = new Set(collapsedProjects);
    if (newCollapsed.has(projectId)) {
      newCollapsed.delete(projectId);
    } else {
      newCollapsed.add(projectId);
    }
    setCollapsedProjects(newCollapsed);
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAreas = areas.filter(area => 
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} flex flex-col transition-all duration-300 md:relative fixed inset-y-0 left-0 z-50 md:z-auto ${collapsed ? 'md:w-16' : 'w-full md:w-64'}`} style={{ background: '#F5F5F5' }}>
      {/* Collapse button */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && <h2 className="text-lg font-semibold text-gray-900">Spark</h2>}
        <button 
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
      </div>

      {/* Smart Lists Section */}
      <div className="pt-4 pb-2">
        {/* Group 1: Inbox & Completed - slightly separated */}
        <div className="space-y-0" style={{ marginBottom: '12px' }}>
          {views.filter(view => view.id === 'inbox' || view.id === 'completed').map((view) => (
            <div
              key={view.id}
              className={`w-full ${
                currentView === view.id && !selectedProjectId && !selectedAreaId
                  ? 'bg-gray-300'
                  : 'hover:bg-gray-200'
              } transition-all duration-150`}
            >
              <button
                onClick={() => onViewChange(view.id)}
                className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-0.5 text-sm font-normal w-full text-gray-700 ${
                  currentView === view.id && !selectedProjectId && !selectedAreaId ? 'text-gray-900' : ''
                }`}
                title={collapsed ? view.name : undefined}
              >
                {view.icon}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{view.name}</span>
                    {settings.showViewCounts && view.count > 0 && (
                      <span className="text-xs text-gray-400 font-medium">
                        {view.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
        
        {/* Group 2: Today, Upcoming, Someday - close together */}
        <div className="space-y-0" style={{ marginBottom: '12px' }}>
          {views.filter(view => ['today', 'upcoming', 'someday'].includes(view.id)).map((view) => (
            <div
              key={view.id}
              className={`w-full ${
                currentView === view.id && !selectedProjectId && !selectedAreaId
                  ? 'bg-gray-300'
                  : 'hover:bg-gray-200'
              } transition-all duration-150`}
            >
              <button
                onClick={() => onViewChange(view.id)}
                className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-0.5 text-sm font-normal w-full text-gray-700 ${
                  currentView === view.id && !selectedProjectId && !selectedAreaId ? 'text-gray-900' : ''
                }`}
                title={collapsed ? view.name : undefined}
              >
                {view.icon}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{view.name}</span>
                    {settings.showViewCounts && view.count > 0 && (
                      <span className="text-xs text-gray-400 font-medium">
                        {view.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Group 3: Calendar and Time Blocking - close together */}
        <div className="space-y-0" style={{ marginBottom: '12px' }}>
          {calendarViews.filter(view => ['calendar', 'timeblocking'].includes(view.id)).map((view) => (
            <div
              key={view.id}
              className={`w-full ${
                currentView === view.id
                  ? 'bg-gray-300'
                  : 'hover:bg-gray-200'
              } transition-all duration-150`}
            >
              <button
                onClick={() => onViewChange(view.id)}
                className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-0.5 text-sm font-normal w-full text-gray-700 ${
                  currentView === view.id ? 'text-gray-900' : ''
                }`}
                title={collapsed ? view.name : undefined}
              >
                {view.icon}
                {!collapsed && <span className="flex-1 text-left">{view.name}</span>}
              </button>
            </div>
          ))}
        </div>

        {/* Group 4: Folders and All Projects - close together */}
        <div className="space-y-0">
          {calendarViews.filter(view => ['folders', 'all-projects'].includes(view.id)).map((view) => (
            <div
              key={view.id}
              className={`w-full ${
                currentView === view.id
                  ? 'bg-gray-300'
                  : 'hover:bg-gray-200'
              } transition-all duration-150`}
            >
              <button
                onClick={() => onViewChange(view.id)}
                className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-0.5 text-sm font-normal w-full text-gray-700 ${
                  currentView === view.id ? 'text-gray-900' : ''
                }`}
                title={collapsed ? view.name : undefined}
              >
                {view.icon}
                {!collapsed && <span className="flex-1 text-left">{view.name}</span>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Folders and Projects Section */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden pt-8">
          <div className="h-full overflow-y-auto overflow-x-hidden">
          {/* Areas with their projects nested underneath */}
          {areas.map((area) => {
            const areaProjects = projects.filter(project => project.area_id === area.id);
            const isAreaCollapsed = collapsedAreas.has(area.id);
            const hasProjects = areaProjects.length > 0;
            
            return (
              <div key={area.id} style={{ marginBottom: '12px' }}>
                {/* Area */}
                <div
                  className={`w-full group ${
                    selectedAreaId === area.id
                      ? 'bg-gray-300'
                      : 'hover:bg-gray-200'
                  } transition-all duration-150`}
                >
                  <div className="flex items-center w-full">
                    <button
                      onClick={() => onAreaSelect(area.id)}
                      className={`flex items-center gap-2 py-0.5 text-sm font-semibold flex-1 text-gray-700 ${
                        selectedAreaId === area.id ? 'text-gray-900' : ''
                      }`}
                      style={{ paddingLeft: '18px', paddingRight: '1rem' }}
                    >
                      {getAreaIcon(area.color)}
                      <span className="truncate">{area.name}</span>
                    </button>
                    <button
                      onClick={() => onEditArea(area)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-300 transition-all duration-150"
                    >
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </button>
                    {hasProjects && (
                      <button
                        onClick={() => {
                          const newCollapsed = new Set(collapsedAreas);
                          if (isAreaCollapsed) {
                            newCollapsed.delete(area.id);
                          } else {
                            newCollapsed.add(area.id);
                          }
                          setCollapsedAreas(newCollapsed);
                        }}
                        className="p-1 hover:bg-gray-300 rounded transition-all duration-150 mr-2"
                      >
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          className={`text-gray-500 transition-transform duration-150 ${isAreaCollapsed ? 'rotate-0' : 'rotate-90'}`}
                        >
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Projects under this area */}
                {!isAreaCollapsed && areaProjects.map((project, index) => {
                  const taskCount = projectTaskCounts[project.id] || 0;
                  const isCollapsed = collapsedProjects.has(project.id);
                  const hasItems = taskCount > 0;
                  const completionData = projectCompletionStats[project.id];
                  const isCompleted = completionData && completionData.total > 0 && completionData.completed === completionData.total;
                  
                  // Debug logging
                  console.log(`🎯 Project ${project.name}:`, {
                    id: project.id,
                    completionData,
                    taskCount,
                    hasCompletionData: !!completionData,
                    shouldShowProgress: completionData && completionData.total > 0
                  });
                  
                  return (
                    <div key={project.id} className="pl-0.5" style={{ marginBottom: '0px', marginTop: index === 0 ? '6px' : '0px' }}>
                      <div 
                        className={`flex items-center w-full ${
                          selectedProjectId === project.id 
                            ? 'bg-gray-300' 
                            : 'hover:bg-gray-200'
                        } transition-all duration-150`}
                      >
                        {/* Project button */}
                        <div
                          className={`flex items-center gap-3 py-0 text-sm font-light flex-1 text-gray-500 ${
                            selectedProjectId === project.id ? 'text-gray-900' : ''
                          }`}
                          style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {/* Progress Circle */}
                            <ProgressCircle 
                              completion={
                                completionData && completionData.total > 0 
                                  ? Math.round((completionData.completed / completionData.total) * 100)
                                  : 0
                              } 
                            />
                            <button
                              onClick={() => onProjectSelect(project.id)}
                              className="truncate text-left hover:text-blue-600 transition-colors flex-1"
                            >
                              {project.name}
                            </button>
                          </div>
                          {settings.showProjectCounts && taskCount > 0 && (
                            <span className="text-xs text-gray-400 font-medium">
                              {taskCount}
                            </span>
                          )}
                        </div>
                        
                        {/* Collapse/expand arrow - moved to right */}
                        {settings.showProjectDropdowns && hasItems && (
                          <button
                            onClick={() => toggleProjectCollapse(project.id)}
                            className="p-1 pr-2 transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className={`text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                            >
                              <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Tasks shown when expanded */}
                      {hasItems && settings.showProjectDropdowns && !isCollapsed && (
                        <div className="ml-5 border-l border-gray-200 pl-2 space-y-0">
                          {(projectTasks[project.id] || []).slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 py-0.5 text-xs text-gray-600 cursor-pointer"
                              onClick={() => openTask(task.id)}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className={`truncate leading-none ${task.completed ? 'line-through' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                          {(projectTasks[project.id]?.length || 0) > 5 && (
                            <div className="text-xs text-gray-400 pl-3 py-0.5">
                              +{(projectTasks[project.id]?.length || 0) - 5} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {/* Projects without areas */}
          {projects.filter(project => !project.area_id).map((project) => {
            const taskCount = projectTaskCounts[project.id] || 0;
            const isCollapsed = collapsedProjects.has(project.id);
            const hasItems = taskCount > 0;
            const completionData = projectCompletionStats[project.id];
            const isCompleted = completionData && completionData.total > 0 && completionData.completed === completionData.total;
            
            return (
              <div key={project.id} style={{ marginBottom: '0px' }}>
                <div 
                  className={`flex items-center w-full ${
                    selectedProjectId === project.id 
                      ? 'bg-gray-300' 
                      : 'hover:bg-gray-200'
                  } transition-all duration-150`}
                >
                  {/* Project button */}
                  <div
                    className={`flex items-center gap-3 py-0 text-sm font-light flex-1 text-gray-500 ${
                      selectedProjectId === project.id ? 'text-gray-900' : ''
                    }`}
                    style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {/* Progress Circle */}
                      <ProgressCircle 
                        completion={
                          completionData && completionData.total > 0 
                            ? Math.round((completionData.completed / completionData.total) * 100)
                            : 0
                        } 
                      />
                      <button
                        onClick={() => onProjectSelect(project.id)}
                        className="truncate text-left hover:text-blue-600 transition-colors flex-1"
                      >
                        {project.name}
                      </button>
                    </div>
                    {settings.showProjectCounts && taskCount > 0 && (
                      <span className="text-xs text-gray-400 font-medium">
                        {taskCount}
                      </span>
                    )}
                  </div>
                  
                  {/* Collapse/expand arrow - moved to right */}
                  {settings.showProjectDropdowns && hasItems && (
                    <button
                      onClick={() => toggleProjectCollapse(project.id)}
                      className="p-1 pr-2 transition-colors"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                      >
                        <polyline points="9,18 15,12 9,6"></polyline>
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Tasks shown when expanded */}
                {hasItems && settings.showProjectDropdowns && !isCollapsed && (
                  <div className="ml-5 border-l border-gray-200 pl-2 space-y-0">
                    {(projectTasks[project.id] || []).slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="text-xs text-gray-600 py-0.5 px-2 hover:bg-gray-100 rounded cursor-pointer"
                        title={task.title}
                        onClick={() => openTask(task.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            task.completed ? 'bg-blue-500' : 'border border-gray-300 bg-white'
                          }`} />
                          <span className="truncate leading-none">{task.title}</span>
                        </div>
                      </div>
                    ))}
                    {(projectTasks[project.id] || []).length > 5 && (
                      <div className="text-xs text-gray-400 px-2 py-0.5">
                        +{(projectTasks[project.id] || []).length - 5} more...
                      </div>
                    )}
                  </div>
                )}
                
                {/* Collapsed indicator */}
                {hasItems && settings.showProjectDropdowns && isCollapsed && (
                  <div className="ml-8 text-xs text-gray-400 pb-1">
                    {taskCount} item{taskCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Bottom Menu */}
      <div className="border-t border-gray-200 px-4 py-2">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <button
            onClick={onNewProject}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="New Section"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          {!collapsed && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
