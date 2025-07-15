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
  onProjectEdit: (projectId: string) => void;
  onNewProject: () => void;
  onNewArea: () => void;
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
    <div className={`${collapsed ? 'w-16' : 'w-64'} flex flex-col border-r border-gray-200 transition-all duration-300`} style={{ background: '#F5F5F5' }}>
      {/* Collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
                className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-1.5 text-sm font-medium w-full text-gray-700 ${
                  currentView === view.id && !selectedProjectId && !selectedAreaId ? 'text-gray-900' : ''
                }`}
                title={collapsed ? view.name : undefined}
              >
                {view.icon}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{view.name}</span>
                    {view.count > 0 && (
                      <span className="things-count-badge">
                        {view.count}
                      </span>
                    )}
                  </>
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
                className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-1.5 text-sm font-medium w-full text-gray-700 ${
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
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-hidden">
          {/* Areas with their projects nested underneath */}
          {areas.map((area) => {
            const areaProjects = projects.filter(project => project.area_id === area.id);
            const isAreaCollapsed = collapsedAreas.has(area.id);
            const hasProjects = areaProjects.length > 0;
            
            return (
              <div key={area.id} className="mb-4">
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
                      className={`flex items-center gap-3 py-1.5 text-sm font-medium flex-1 px-4 text-gray-700 ${
                        selectedAreaId === area.id ? 'text-gray-900' : ''
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                        <path d="M20 6h-2l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                      </svg>
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
                {!isAreaCollapsed && areaProjects.map((project) => {
                  const taskCount = projectTaskCounts[project.id] || 0;
                  const isCollapsed = collapsedProjects.has(project.id);
                  const hasItems = taskCount > 0;
                  const completionData = projectCompletionStats[project.id];
                  const isCompleted = completionData && completionData.total > 0 && completionData.completed === completionData.total;
                  
                  return (
                    <div key={project.id} className="pl-0.5 mb-1">
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
                        <div
                          className={`flex items-center gap-3 py-1.5 text-sm font-medium flex-1 text-gray-700 ${
                            selectedProjectId === project.id ? 'text-gray-900' : ''
                          }`}
                          style={{ paddingLeft: hasItems ? '0.5rem' : '1rem', paddingRight: '1rem' }}
                        >
                          <button
                            onClick={() => onProjectSelect(project.id)}
                            className="flex items-center gap-2"
                          >
                            {/* Progress completion indicator */}
                            {completionData && completionData.total > 0 && (
                              <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {isCompleted && (
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                                    <polyline points="20,6 9,17 4,12" stroke="white" strokeWidth="4" fill="none"/>
                                  </svg>
                                )}
                              </div>
                            )}
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            {/* Progress Circle */}
                            <div className="relative w-4 h-4">
                              <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="3"
                                />
                                {completionData && completionData.total > 0 && (
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={isCompleted ? "#10b981" : "#3b82f6"}
                                    strokeWidth="3"
                                    strokeDasharray={`${(completionData.completed / completionData.total) * 100}, 100`}
                                  />
                                )}
                              </svg>
                            </div>
                            <button
                              onClick={() => onProjectSelect(project.id)}
                              className="truncate text-left hover:text-blue-600 transition-colors"
                            >
                              {project.name}
                            </button>
                          </div>
                          {taskCount > 0 && (
                            <span className="things-count-badge">
                              {taskCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Tasks shown when expanded */}
                      {hasItems && !isCollapsed && (
                        <div className="ml-5 border-l border-gray-200 pl-2 space-y-0">
                          {(projectTasks[project.id] || []).slice(0, 5).map((task) => (
                            <div key={task.id} className="flex items-center gap-2 py-0.5 text-xs text-gray-600">
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
                  <div
                    className={`flex items-center gap-3 py-1.5 text-sm font-medium flex-1 text-gray-700 ${
                      selectedProjectId === project.id ? 'text-gray-900' : ''
                    }`}
                    style={{ paddingLeft: hasItems ? '0.5rem' : '1rem', paddingRight: '1rem' }}
                  >
                    <button
                      onClick={() => onProjectSelect(project.id)}
                      className="flex items-center gap-2"
                    >
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
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                      {/* Progress Circle */}
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                          />
                          {completionData && completionData.total > 0 && (
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={isCompleted ? "#10b981" : "#3b82f6"}
                              strokeWidth="3"
                              strokeDasharray={`${(completionData.completed / completionData.total) * 100}, 100`}
                            />
                          )}
                        </svg>
                      </div>
                      <button
                        onClick={() => onProjectSelect(project.id)}
                        className="truncate text-left hover:text-blue-600 transition-colors"
                      >
                        {project.name}
                      </button>
                    </div>
                    {taskCount > 0 && (
                      <span className="things-count-badge">
                        {taskCount}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Tasks shown when expanded */}
                {hasItems && !isCollapsed && (
                  <div className="ml-5 border-l border-gray-200 pl-2 space-y-0">
                    {(projectTasks[project.id] || []).slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="text-xs text-gray-600 py-0.5 px-2 hover:bg-gray-100 rounded cursor-pointer"
                        title={task.title}
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
