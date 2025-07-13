import { useState, useEffect } from "react";
import { getProjects, subscribeToProjects } from "../lib/queries/projects";
import { getAreas, subscribeToAreas } from "../lib/queries/areas";
import { getTaskStats, subscribeToTasks, getTasks } from "../lib/queries/tasks";
import { SignOutButton } from "../SignOutButton";
import { Settings } from "./Settings";
import type { Database } from "../lib/supabase";

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
  onNewProject: () => void;
  onNewArea: () => void;
  onNewTask: () => void;
  onQuickEntry: () => void;
  user: any;
}

export function Sidebar({
  currentView,
  onViewChange,
  selectedProjectId,
  selectedAreaId,
  onProjectSelect,
  onAreaSelect,
  onNewProject,
  onNewArea,
  onNewTask,
  onQuickEntry,
  user,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<string, number>>({});
  const [projectTasks, setProjectTasks] = useState<Record<string, Task[]>>({});
  const [projectCompletionStats, setProjectCompletionStats] = useState<Record<string, { completed: number; total: number }>>({});
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [initialProjects, initialAreas, initialTaskStats, allTasks] = await Promise.all([
          getProjects(),
          getAreas(),
          getTaskStats(),
          getTasks({ view: "inbox" })
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
      } catch (error) {
        console.error("Failed to fetch initial sidebar data:", error);
      }
    };

    fetchInitialData();

    const projectSubscription = subscribeToProjects(async () => {
      try {
        const updatedProjects = await getProjects();
        setProjects(updatedProjects);
      } catch (error) {
        console.error("Failed to fetch updated projects:", error);
      }
    });
    
    const areaSubscription = subscribeToAreas(async () => {
      try {
        const updatedAreas = await getAreas();
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
        const allTasks = await getTasks({ view: "inbox" });
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
    <div className="w-64 flex flex-col border-r border-gray-200" style={{ background: '#F5F5F5' }}>

      {/* Smart Lists Section */}
      <div className="pt-6 pb-4">
        <div className="space-y-0">
          {views.map((view) => (
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
                className={`flex items-center gap-3 py-1.5 text-sm font-medium w-full px-4 text-gray-700 ${
                  currentView === view.id && !selectedProjectId && !selectedAreaId ? 'text-gray-900' : ''
                }`}
              >
                {view.icon}
                <span className="flex-1 text-left">{view.name}</span>
                {view.count > 0 && (
                  <span className="things-count-badge">
                    {view.count}
                  </span>
                )}
              </button>
            </div>
          ))}
          {calendarViews.map((view) => (
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
                className={`flex items-center gap-3 py-1.5 text-sm font-medium w-full px-4 text-gray-700 ${
                  currentView === view.id ? 'text-gray-900' : ''
                }`}
              >
                {view.icon}
                <span className="flex-1 text-left">{view.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="pb-4">
        <div className="space-y-0 max-h-48 overflow-y-auto">
          {projects.map((project) => {
            const taskCount = projectTaskCounts[project.id] || 0;
            const isCollapsed = collapsedProjects.has(project.id);
            const hasItems = taskCount > 0;
            const completionData = projectCompletionStats[project.id];
            const isCompleted = completionData && completionData.total > 0 && completionData.completed === completionData.total;
            
            return (
              <div key={project.id}>
                <div 
                  className={`flex items-center w-full ${
                    selectedProjectId === project.id 
                      ? 'bg-gray-300' 
                      : 'hover:bg-gray-200'
                  } transition-all duration-150`}
                >
                  {/* Collapse/expand arrow */}
                  {hasItems && (
                    <button
                      onClick={() => toggleProjectCollapse(project.id)}
                      className="p-1 pl-2 transition-colors"
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
                  
                  {/* Project button */}
                  <button
                    onClick={() => onProjectSelect(project.id)}
                    className={`flex items-center gap-3 py-1.5 text-sm font-medium flex-1 text-gray-700 ${
                      selectedProjectId === project.id ? 'text-gray-900' : ''
                    }`}
                    style={{ paddingLeft: hasItems ? '0.5rem' : '1rem', paddingRight: '1rem' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || "#8E8E93" }}
                      />
                      {completionData && completionData.total > 0 && (
                        <div className={`w-2 h-2 rounded-full border flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isCompleted && (
                            <svg width="6" height="6" viewBox="0 0 24 24" fill="none">
                              <polyline points="20,6 9,17 4,12" stroke="white" strokeWidth="4" fill="none"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="truncate flex-1 text-left">{project.name}</span>
                    {taskCount > 0 && (
                      <span className="things-count-badge">
                        {taskCount}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Tasks shown when expanded */}
                {hasItems && !isCollapsed && (
                  <div className="ml-8 border-l border-gray-200 pl-2">
                    {(projectTasks[project.id] || []).slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="text-xs text-gray-600 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
                        title={task.title}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            task.completed ? 'bg-blue-500' : 'border border-gray-300 bg-white'
                          }`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    ))}
                    {(projectTasks[project.id] || []).length > 5 && (
                      <div className="text-xs text-gray-400 px-2 py-1">
                        +{(projectTasks[project.id] || []).length - 5} more...
                      </div>
                    )}
                  </div>
                )}
                
                {/* Collapsed indicator */}
                {hasItems && isCollapsed && (
                  <div className="ml-8 text-xs text-gray-400 pb-1">
                    {taskCount} item{taskCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Folders Section */}
      <div className="flex-1">
        <div className="space-y-0 max-h-48 overflow-y-auto">
          {areas.map((area) => (
            <div
              key={area.id}
              className={`w-full ${
                selectedAreaId === area.id
                  ? 'bg-gray-300'
                  : 'hover:bg-gray-200'
              } transition-all duration-150`}
            >
              <button
                onClick={() => onAreaSelect(area.id)}
                className={`flex items-center gap-3 py-1.5 text-sm font-medium w-full px-4 text-gray-700 ${
                  selectedAreaId === area.id ? 'text-gray-900' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: area.color || "#8E8E93" }}
                />
                <span className="truncate">{area.name}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
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
        </div>
      </div>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
