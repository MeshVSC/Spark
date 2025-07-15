import { useState, useEffect } from "react";
import { getCurrentUser, signOut } from "../lib/auth";
import { getTaskStats, getTasks, subscribeToTasks } from "../lib/queries/tasks";
import { getProjects } from "../lib/queries/projects";
import { getAreas } from "../lib/queries/areas";
import { SignOutButton } from "../SignOutButton";
import { Sidebar } from "./Sidebar";
import { TaskList } from "./TaskList";
import { TaskForm } from "./TaskForm";
import { ProjectForm } from "./ProjectForm";
import { AreaForm } from "./AreaForm";
import { QuickEntry } from "./QuickEntry";
import { TaskSearch } from "./TaskSearch";
import { TaskStats } from "./TaskStats";
import { TaskFilters } from "./TaskFilters";
import { CalendarView } from "./CalendarView";
import { TimeBlockingView } from "./TimeBlockingView";
import { RecurringTaskForm } from "./RecurringTaskForm";
import { TaskEditForm } from "./TaskEditForm"; // Import TaskEditForm
import { MockupDataButton } from "./MockupDataButton";
import type { Database } from "../lib/supabase";

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskEditForm, setShowTaskEditForm] = useState(false); // Corrected single declaration
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [taskFilters, setTaskFilters] = useState<{
    priority?: "low" | "medium" | "high";
    tags?: string[];
    dateRange?: "today" | "week" | "month";
  }>({});

  const [user, setUser] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // Add tasks state to SparkApp
  const [allTasks, setAllTasks] = useState<Task[]>([]); // Cache all tasks for instant filtering

  // Function to manually refresh the task cache
  const refreshTaskCache = async () => {
    try {
      console.log('📝 Manually refreshing task cache...');
      const updatedTasks = await getTasks({ view: 'all' });
      console.log('📝 Manual cache refresh:', updatedTasks.length, 'tasks');
      setAllTasks(updatedTasks);
    } catch (error) {
      console.error('Error manually refreshing task cache:', error);
    }
  };

  useEffect(() => {
    getCurrentUser().then(setUser);
    getTaskStats().then(setTaskStats).catch(() => setTaskStats(null));
    getProjects().then(setProjects).catch(() => setProjects([]));
    getAreas().then(setAreas).catch(() => setAreas([]));
    
    // Fetch ALL tasks once and cache them
    getTasks({ view: 'all' })
      .then((fetchedTasks) => {
        console.log('All tasks cached on startup:', fetchedTasks.length, 'tasks');
        setAllTasks(fetchedTasks);
      })
      .catch((error) => {
        console.error('Error fetching all tasks:', error);
        setAllTasks([]);
      });

    // Subscribe to task changes to keep cache updated
    console.log('Setting up task subscription...');
    const taskSubscription = subscribeToTasks(async () => {
      try {
        console.log('🔥 Task change detected, updating cache...');
        const updatedTasks = await getTasks({ view: 'all' });
        console.log('🔥 Cache updated with:', updatedTasks.length, 'tasks');
        setAllTasks(updatedTasks);
      } catch (error) {
        console.error('Error updating task cache:', error);
      }
    });

    return () => {
      taskSubscription.unsubscribe();
    };
  }, []); // Only run once on component mount

  // Filter cached tasks instantly when view/project changes
  useEffect(() => {
    const filterTasks = () => {
      console.log('Filtering tasks instantly for:', { currentView, selectedProjectId, selectedAreaId });
      
      let filteredTasks = allTasks;
      
      // Filter by project/area first
      if (selectedProjectId) {
        filteredTasks = allTasks.filter(task => task.project_id === selectedProjectId);
      } else if (selectedAreaId) {
        filteredTasks = allTasks.filter(task => task.area_id === selectedAreaId);
      }
      
      // Then apply view filters
      if (currentView === 'inbox' && !selectedProjectId && !selectedAreaId) {
        // For inbox view without specific project, show all tasks for grouping
        filteredTasks = allTasks;
      } else if (currentView === 'today') {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const todayEnd = today.getTime();
        filteredTasks = filteredTasks.filter(task => 
          !task.completed && (
            (task.scheduled_date && new Date(task.scheduled_date).getTime() <= todayEnd) ||
            (task.due_date && new Date(task.due_date).getTime() <= todayEnd)
          )
        );
      } else if (currentView === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
      } else {
        // For other views or project-specific views, show non-completed tasks
        filteredTasks = filteredTasks.filter(task => !task.completed);
      }
      
      console.log('Filtered tasks result:', filteredTasks);
      console.log('Setting tasks to:', filteredTasks.length, 'tasks');
      setTasks(filteredTasks);
    };
    
    if (allTasks.length > 0) {
      filterTasks();
    }
  }, [currentView, selectedProjectId, selectedAreaId, allTasks]);

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
        setShowTaskEditForm(false); // Close TaskEditForm on escape
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
    setSelectedTaskId(taskId);
    setShowTaskEditForm(true);
  };

  const handleCloseTaskEditForm = () => {
    setSelectedTaskId(null);
    setShowTaskEditForm(false);
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
          console.log('Project selected:', projectId);
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
          console.log("New folder/area clicked");
          setShowAreaForm(true);
        }}
        onNewArea={() => {
          console.log("New area clicked");
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
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 pb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getViewTitle()}</h1>
            {getViewSubtitle() && (
              <p className="text-sm text-gray-500 mt-1">{getViewSubtitle()}</p>
            )}
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
                      onClick={() => handleAreaSelect(area.id)}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: area.color || '#6B7280' }}
                          ></div>
                          <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditArea(area);
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
                      onClick={() => handleProjectSelect(project.id)}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color || '#6B7280' }}
                          ></div>
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
                {/* Stats */}
                <TaskStats
                  view={currentView}
                  projectId={selectedProjectId}
                  areaId={selectedAreaId}
                />

                {/* Filters */}
                <TaskFilters onFilterChange={setTaskFilters} />

                {/* Task List */}
                <TaskList
                  view={currentView}
                  projectId={selectedProjectId}
                  areaId={selectedAreaId}
                  filters={taskFilters}
                  onEditTask={handleOpenTaskEditForm}
                  tasks={tasks}
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
          onTaskCreated={refreshTaskCache}
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

      {showTaskEditForm && selectedTaskId && (
        <TaskEditForm
          task={tasks.find(t => t.id === selectedTaskId)}
          onClose={handleCloseTaskEditForm}
          onTaskUpdated={refreshTaskCache}
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
        onTaskCreated={refreshTaskCache}
      />

    </div>
  );
}
