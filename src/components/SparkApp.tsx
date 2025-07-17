import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, signOut } from "../lib/auth";
import { getTaskStats } from "../lib/queries/tasks";
import { getProjects } from "../lib/queries/projects";
import { getAreas } from "../lib/queries/areas";
import { useTaskStore } from "../stores/useTaskStore";
import { SignOutButton } from "../SignOutButton";
import { Sidebar } from "./Sidebar";
import { TaskList } from "./TaskList";
import { TaskForm } from "./TaskForm";
import { ProjectForm } from "./ProjectForm";
import { AreaForm } from "./AreaForm";
import { QuickEntry } from "./QuickEntry";
import { TaskSearch } from "./TaskSearch";
import { TaskFilters } from "./TaskFilters";
import { CalendarView } from "./CalendarView";
import { TimeBlockingView } from "./TimeBlockingView";
import { RecurringTaskForm } from "./RecurringTaskForm";
import { TaskEditForm } from "./TaskEditForm"; // Import TaskEditForm
import { useTaskNavigation } from "../hooks/useTaskNavigation";
import { MockupDataButton } from "./MockupDataButton";
import type { Database } from "../lib/supabase";
import ProgressCircle from "./ui/ProgressCircle";

// Icon mapping for areas - copied from Sidebar
const getAreaIcon = (iconName?: string | null) => {
  const iconStyle = "w-6 h-6 text-gray-500";
  
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

// Inline mockup data button component for bottom bar
function MockupDataInlineButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddMockupData = async () => {
    setIsLoading(true);
    try {
      const { addMockupData } = await import('./MockupDataButton');
      await addMockupData();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error adding mockup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddMockupData}
      disabled={isLoading}
      className="text-xs text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-50"
      title="Add sample data to test the app"
    >
      {isLoading ? 'Adding...' : 'Add Mockup Data'}
    </button>
  );
}

type Project = Database['public']['Tables']['projects']['Row'];
type Area = Database['public']['Tables']['areas']['Row'];
type Task = Database['public']['Tables']['tasks']['Row']; // Single declaration

export function SparkApp() {
  const [currentView, setCurrentView] = useState<"inbox" | "today" | "upcoming" | "someday" | "completed" | "calendar" | "timeblocking">("inbox");
  const [calendarViewType, setCalendarViewType] = useState<"month" | "week">("month");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const { selectedTaskId, openTask, closeTask } = useTaskNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [taskFilters, setTaskFilters] = useState<{
    priority?: "low" | "medium" | "high";
    tags?: string[];
    dateRange?: "today" | "week" | "month";
  }>({});

  const [user, setUser] = useState<User | null>(null);
  const [taskStats, setTaskStats] = useState(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const { tasks: allTasks, refresh: refreshTaskCache } = useTaskStore();



  useEffect(() => {
    getCurrentUser().then(setUser);
    getTaskStats().then(setTaskStats).catch(() => setTaskStats(null));
    getProjects().then(setProjects).catch(() => setProjects([]));
    getAreas().then(setAreas).catch(() => setAreas([]));
  }, []);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N for new task
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setShowTaskForm(true);
      }
      // Cmd/Ctrl + Shift + N for quick entry
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setShowQuickEntry(true);
      }
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Cmd/Ctrl + R for recurring task
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        setShowRecurringForm(true);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowQuickEntry(false);
        setShowSearch(false);
        setShowRecurringForm(false);
        closeTask(); // Close TaskEditForm on escape
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getViewTitle = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      return project ? project.name : "Project";
    }
    if (selectedAreaId) {
      const area = areas.find(a => a.id === selectedAreaId);
      return area ? area.name : "Area";
    }
    if (currentView === "calendar") return "Calendar";
    if (currentView === "timeblocking") return "Time Blocking";
    return currentView.charAt(0).toUpperCase() + currentView.slice(1);
  };

  const getViewSubtitle = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        // Get task count for this project
        const projectTaskCount = taskStats ? taskStats.pending : 0; // This would need to be project-specific
        const subtitle = `${projectTaskCount} tasks`;
        return project.description ? `${subtitle} • ${project.description}` : subtitle;
      }
      return "";
    }
    
    if (selectedAreaId) {
      const area = areas.find(a => a.id === selectedAreaId);
      if (area) {
        const areaTaskCount = taskStats ? taskStats.pending : 0; // This would need to be area-specific
        const subtitle = `${areaTaskCount} tasks`;
        return area.description ? `${subtitle} • ${area.description}` : subtitle;
      }
      return "";
    }
    
    if (!taskStats) return "";
    
    switch (currentView) {
      case "inbox":
        return `${taskStats.pending} tasks`;
      case "today":
        return `${taskStats.dueToday} due today`;
      case "completed":
        return `${taskStats.completed} completed`;
      case "calendar":
        return `${calendarViewType} view`;
      case "timeblocking":
        return "Schedule your day";
      default:
        return "";
    }
  };

  const handleOpenTaskEditForm = (taskId: string) => {
    openTask(taskId);
  };

  const handleCloseTaskEditForm = () => {
    closeTask();
  };

  return (
    <div className="h-screen flex" style={{ background: '#FAFAFA' }}>
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedProjectId(null);
          setSelectedAreaId(null);
        }}
        selectedProjectId={selectedProjectId}
        selectedAreaId={selectedAreaId}
        onProjectSelect={(projectId) => {
          setSelectedProjectId(projectId);
          setSelectedAreaId(null);
          setCurrentView("inbox");
        }}
        onAreaSelect={async (areaId) => {
          setSelectedAreaId(areaId);
          setSelectedProjectId(null);
          setCurrentView("inbox");
          // Force refresh projects and tasks
          await refreshTaskCache();
        }}
        onProjectEdit={(projectId) => {
          setEditingProjectId(projectId);
          setShowProjectForm(true);
        }}
        onNewProject={() => {
          setShowAreaForm(true);
        }}
        onNewArea={() => {
          setShowAreaForm(true);
        }}
        onEditArea={(area) => {
          setEditingAreaId(area.id);
          setShowAreaForm(true);
        }}
        onNewTask={() => setShowTaskForm(true)}
        onQuickEntry={() => setShowQuickEntry(true)}
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white md:ml-0 ml-0">
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            {/* Progress circle for selected project */}
            {selectedProjectId && (
              <ProgressCircle 
                completion={(() => {
                  const projectTasks = allTasks.filter(t => t.project_id === selectedProjectId);
                  const completedTasks = projectTasks.filter(t => t.completed).length;
                  const totalTasks = projectTasks.length;
                  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                })()}
                size={24}
              />
            )}
            <div>
              <h1 className="project-title">{getViewTitle()}</h1>
              {getViewSubtitle() && (
                <p className="project-description mt-1">{getViewSubtitle()}</p>
              )}
            </div>
          </div>
          
          {/* Calendar View Toggle */}
          {currentView === "calendar" && (
            <div className="flex bg-gray-100 rounded-lg p-1 mt-3 w-fit">
              <button
                onClick={() => setCalendarViewType("month")}
                className={`px-3 py-1 text-sm rounded ${
                  calendarViewType === "month" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setCalendarViewType("week")}
                className={`px-3 py-1 text-sm rounded ${
                  calendarViewType === "week" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Week
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="p-6">
            {currentView === "calendar" ? (
              <CalendarView 
                view={calendarViewType} 
                onTaskClick={handleOpenTaskEditForm} // Use handleOpenTaskEditForm
              />
            ) : currentView === "timeblocking" ? (
              <TimeBlockingView />
            ) : currentView === "folders" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => (
                    <div
                      key={area.id}
                      onClick={async () => {
                        setSelectedAreaId(area.id);
                        setSelectedProjectId(null);
                        setCurrentView("inbox");
                        await refreshTaskCache();
                      }}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <ProgressCircle 
                            completion={(() => {
                              const areaProjects = projects.filter(p => p.area_id === area.id);
                              const areaTasks = allTasks.filter(t => t.area_id === area.id);
                              const completedTasks = areaTasks.filter(t => t.completed).length;
                              const totalTasks = areaTasks.length;
                              return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                            })()}
                            size={20}
                          />
                          {getAreaIcon(area.color)}
                          <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAreaId(area.id);
                            setShowAreaForm(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all duration-150"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                      </div>
                      <p className="text-gray-600 mb-4">{area.description}</p>
                      <div className="text-sm text-gray-500">
                        {projects.filter(p => p.area_id === area.id).length} projects
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : currentView === "all-projects" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setSelectedAreaId(null);
                        setCurrentView("inbox");
                      }}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <ProgressCircle 
                            completion={(() => {
                              const projectTasks = allTasks.filter(t => t.project_id === project.id);
                              const completedTasks = projectTasks.filter(t => t.completed).length;
                              const totalTasks = projectTasks.length;
                              return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                            })()}
                            size={20}
                          />
                          {(() => {
                            const area = areas.find(a => a.id === project.area_id);
                            return getAreaIcon(area?.color);
                          })()}
                          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectId(project.id);
                            setShowProjectForm(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all duration-150"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                      </div>
                      <p className="text-gray-600 mb-4">{project.description}</p>
                      <div className="text-sm text-gray-500">
                        {allTasks.filter(t => t.project_id === project.id && !t.completed).length} active tasks
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Filters */}
                <TaskFilters onFilterChange={setTaskFilters} />

                {/* Task List */}
                <TaskList
                  view={currentView}
                  projectId={selectedProjectId}
                  areaId={selectedAreaId}
                  filters={taskFilters}
                  onEditTask={handleOpenTaskEditForm}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Bottom Toolbar */}
        <div className="border-t border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Center buttons */}
            <div className="flex items-center justify-center gap-8 flex-1">
              <button
                onClick={() => setShowSearch(true)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Search (⌘K)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>

              {/* Option 1: Lightning Arrow */}
              <button
                onClick={() => setShowQuickEntry(true)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Option 1: Lightning Arrow"
              >
                <svg width="18" height="18" viewBox="0 0 352.169 352.169" fill="currentColor" stroke="currentColor" strokeWidth="12" className="text-gray-600">
                  <polygon points="245.281,293.778 177.643,323.046 245.821,171.551 249.712,162.961 129.725,162.961 211.378,8.437 195.394,0 99.701,181.032 221.718,181.032 160.487,317.132 130.764,248.467 114.157,255.637 155.951,352.169 252.469,310.388"/>
                </svg>
              </button>

              
              <button
                onClick={() => setShowTaskForm(true)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="New To-Do (⌘N)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              
              <button
                onClick={() => setShowProjectForm(true)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="New Project"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </button>
              
              <button
                onClick={() => signOut()}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Sign Out"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                </svg>
              </button>
            </div>

            {/* Right corner - Mockup Data Button for guest users only */}
            {user?.is_anonymous && (
              <MockupDataInlineButton />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          projectId={selectedProjectId}
          areaId={selectedAreaId}
        />
      )}

      {showProjectForm && (
        <ProjectForm 
          onClose={() => {
            setShowProjectForm(false);
            setEditingProjectId(null);
          }} 
          areaId={selectedAreaId}
          projectId={editingProjectId}
        />
      )}

      {showAreaForm && (
        <AreaForm 
          editingAreaId={editingAreaId}
          onClose={() => {
            setShowAreaForm(false);
            setEditingAreaId(null);
          }} 
        />
      )}

      {showRecurringForm && (
        <RecurringTaskForm 
          isVisible={showRecurringForm}
          onClose={() => setShowRecurringForm(false)}
          taskId={selectedTaskId || undefined}
        />
      )}

      {selectedTaskId && (
        <TaskEditForm
          task={allTasks.find(t => t.id === selectedTaskId)!}
          onClose={handleCloseTaskEditForm}
        />
      )}

      {/* Search */}
      <TaskSearch
        isVisible={showSearch}
        onClose={() => setShowSearch(false)}
      />

      {/* Quick Entry */}
      <QuickEntry
        isVisible={showQuickEntry}
        onClose={() => setShowQuickEntry(false)}
        projectId={null}
        areaId={null}
      />

    </div>
  );
}
