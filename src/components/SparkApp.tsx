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
import type { Database } from "../lib/supabase";

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
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskEditForm, setShowTaskEditForm] = useState(false); // Corrected single declaration
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
        onAreaSelect={(areaId) => {
          setSelectedAreaId(areaId);
          setSelectedProjectId(null);
          setCurrentView("inbox");
        }}
        onNewProject={() => {
          console.log("New folder/area clicked");
          setShowAreaForm(true);
        }}
        onNewArea={() => {
          console.log("New area clicked");
          setShowAreaForm(true);
        }}
        onNewTask={() => setShowTaskForm(true)}
        onQuickEntry={() => setShowQuickEntry(true)}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h1>
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
          <div className="flex items-center justify-center gap-8">
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

            {/* Option 1: Different Lightning */}
            <button
              onClick={() => setShowQuickEntry(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Option 1: Different Lightning"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </button>

            {/* Option 2: Flash */}
            <button
              onClick={() => setShowQuickEntry(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Option 2: Flash"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <polygon points="6 2 15 11 10 11 14 22 5 13 10 13"/>
              </svg>
            </button>

            {/* Option 3: Star */}
            <button
              onClick={() => setShowQuickEntry(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Option 3: Star"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            </button>

            {/* Option 4: Plus in Circle */}
            <button
              onClick={() => setShowQuickEntry(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Option 4: Plus in Circle"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>

            {/* Option 5: Pen/Edit */}
            <button
              onClick={() => setShowQuickEntry(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Option 5: Pen/Edit"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            {/* Option 6: Feather */}
            <button
              onClick={() => setShowQuickEntry(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Option 6: Feather"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                <line x1="16" y1="8" x2="2" y2="22"/>
                <line x1="17.5" y1="15" x2="9" y2="15"/>
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
          onClose={() => setShowProjectForm(false)} 
          areaId={selectedAreaId}
        />
      )}

      {showAreaForm && (
        <AreaForm onClose={() => setShowAreaForm(false)} />
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
