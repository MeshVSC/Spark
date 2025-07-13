# Spark Project Memory & Tracker

## 🧠 Context Memory Summary

**START HERE:** Quick reference for beginning any session on the Spark project.

### 📋 Essential Reading Order:
1. **Read this summary first** (you're here!)
2. **Check global memory file** (`/Users/kira/.claude/CLAUDE.md`) for conversation rules and general guidelines
3. **Scan this file's sections** as needed for detailed project information

### 🎯 Project Overview:
**Spark** = Advanced task management app that surpasses Things 3 with intelligent automation and comprehensive productivity features.

### 📊 Current Status:
- ✅ **Core foundation** complete with task management, projects, areas, subtasks
- ✅ **Real-time updates** and task caching system working
- ✅ **Basic UI** established with Things 3-inspired design
- 🔄 **Smart time grouping** currently in design phase
- 📅 **Calendar & time management** features (Phase 1) reportedly completed

### 🗂️ File Structure (What's Below):
- **Feature Status** - Complete roadmap with 27+ planned features organized by category
- **Style Guide** - Established design system with colors, typography, components
- **Technical Architecture** - Component structure, data flow, database schema
- **Open Questions** - Design decisions needed (especially time grouping logic)
- **Decision Log** - What we've tried, learned, and decided
- **Development Phases** - 4-phase roadmap for advanced features
- **Next Steps** - Current priorities and action items

### ⚠️ Key Rules & Reminders:
- **Visual design**: My interpretation skills are poor - use established style guide
- **Time estimates**: Be realistic, avoid "30 seconds" promises
- **User feedback**: Priority over assumptions - ask before major changes
- **Existing code**: Don't break what's working - make incremental changes
- **Memory file**: This file is the authoritative source - keep it updated

### 🔧 Quick Technical Reference:
- **Main components**: SparkApp, QuickEntry, TaskForm, TaskEditForm, TaskItem
- **Key pattern**: Manual cache refresh + subscription updates for real-time data
- **Style reference**: QuickEntry component represents current design standard
- **Database**: Tasks, projects, areas, subtasks + planned timeBlocks, recurringTasks

---

## Feature Status Overview

### ✅ Completed Features
- **Subtask Creation Popup** - Custom SubtaskForm component (replaced browser prompt)
- **Task Edit Form Cache Refresh** - Added onTaskUpdated callback for real-time updates
- **QuickEntry Border Removal** - Removed visible border for cleaner look

### 🔄 In Progress Features
- **Smart Time Grouping** - Context-aware task organization by time periods

### 📋 Planned Features (Things 3 Inspired)

#### Core Functionality
1. **Smart Time Grouping** - Intelligently group tasks by natural time periods (This Morning, This Afternoon, This Evening, Tomorrow, This Weekend, This Week, etc.)
2. **Headings within Projects** - Section headers to organize tasks within projects  
3. **Natural Language Date Input** - "tomorrow", "next week", "in 3 days" parsing
4. **Drag & Drop Rescheduling** - Easy date changes in upcoming view
5. **Quick Find** - Enhanced search with keyboard shortcuts (⌘K already implemented)
6. **Multi-select & Batch Operations** - Select multiple tasks for bulk actions
7. **Recurring Tasks** - Flexible patterns (daily, weekly, monthly, custom), advanced scheduling with specific days, end conditions (never-ending, end by date, after X occurrences)
8. **Checklist Conversion** - Turn bulleted lists into actionable tasks
9. **Duration Tracking** - Set estimated time for tasks and time management
10. **Time Blocking View** - Hour-by-hour schedule management with drag & drop scheduling
11. **Calendar Views** - Multiple views (monthly, weekly, daily, agenda) with real-time sync

#### Advanced Features
12. **Progress Indicators** - Visual progress pies/bars for projects and areas
13. **Calendar Integration** - Show calendar events alongside tasks

#### Time Management Features
14. **Pomodoro Timer** - Built-in focus timer for task execution
15. **Habit Tracker** - Flexible tracking for regular activities and habits
16. **Location-based Reminders** - Trigger reminders based on location

#### Advanced Views & Interfaces
17. **Kanban View** - Board-style task management with columns
18. **Board View** - Visual project management interface
19. **Timeline View** - Gantt-style project timeline visualization
20. **Eisenhower Matrix** - Priority matrix for task categorization

#### AI & Intelligence Features
21. **AI-powered Task Assistance** - Smart suggestions and task optimization
22. **Natural Language Processing** - Advanced time and date recognition from text input

#### Enhanced Organization
23. **Labels System** - Enhanced filtering and categorization beyond tags
24. **Project Folders** - Hierarchical project organization

#### Productivity & Analytics
25. **Statistics Tracking** - Comprehensive productivity visualizations
26. **Motivation Systems** - Gamification elements for user engagement
27. **Advanced Analytics** - Detailed completion tracking and insights

#### ❌ Excluded Features
- Multiple Windows - Platform specific
- Handoff Support - Platform specific  
- Siri Integration - Platform specific
- Shortcuts Integration - Platform specific

---

## Current Style Guide

### Color Palette (CSS Custom Properties)
**Primary Colors:**
- `--things-blue: #87CEEB` - Soft Sky Blue (primary accent)
- `--things-blue-hover: #6495ED` - Muted Royal Blue (hover states)

**Gray Hierarchy:**
- `--things-gray-900: #333333` - Main titles, most important text
- `--things-gray-800: #555555` - Darker gray
- `--things-gray-700: #777777` - Task titles, prominent labels  
- `--things-gray-600: #999999` - Notes, descriptions, secondary text
- `--things-gray-500: #BBBBBB` - Subtle elements, placeholders
- `--things-gray-400: #CCCCCC` - Even lighter gray
- `--things-gray-300: #DDDDDD` - Borders, dividers
- `--things-gray-200: #EEEEEE` - Light backgrounds
- `--things-gray-100: #F5F5F5` - Off-white backgrounds, filter elements
- `--things-gray-50: #FAFAFA` - Main app background

**Priority Colors:**
- High: `#FF3B30` (red)
- Medium: `#FF9500` (orange)  
- Low: `#34C759` (green)

### Typography Standards
**Base Font:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
**Base Size:** 14px
**Line Height:** 1.4

**Hierarchy:**
- Task titles: `text-base` (14px) using `--things-gray-700`
- Form inputs: `text-base` with `--things-gray-900` for values, `--things-gray-400` for placeholders
- Labels: `text-xs font-medium` with `--things-gray-500`
- Buttons: `text-xs font-medium`

### Button Standards
**Primary Buttons:**
- Background: `#90B1F6` (specific blue for primary actions)
- Text: White
- Padding: `px-3 py-1` 
- Border radius: `rounded`
- Hover: `--things-blue-hover`

**Secondary Buttons:**
- Color: `--things-gray-500`
- Hover: `--things-gray-700` with `--things-gray-200` background
- Padding: `px-2 py-1`

### Input Standards
**Text Inputs:**
- No borders (`border-none`)
- Transparent background
- Color: `--things-gray-900` for text
- Placeholder: `--things-gray-400`
- Focus: Blue outline with subtle shadow

### Modal/Popup Standards (QuickEntry Reference)
**Container:**
- Background: White
- Border radius: `rounded-xl`
- Shadow: `shadow-2xl` (subtle, no harsh borders)
- Padding: `p-4`
- Width: `w-96`

**Key Design Principles:**
- **No visible borders** on main containers (use shadows instead)
- **Subtle shadows** over harsh lines
- **Consistent spacing** with Tailwind classes
- **Clear visual hierarchy** through typography and color

### Component-Specific Styles
**Sidebar:**
- Background: `#F5F5F5`
- Items: `py-1.5` with `--things-gray-700` text
- Hover: `--things-gray-200` background
- Active: `--things-gray-300` background

**Task Items:**
- Transparent background
- Hover: `bg-gray-50`
- Padding: `p-3`
- Transitions: `duration-150`

**Checkboxes:**
- Circular (`rounded-full`)
- Border: `--things-gray-300`
- Completed: `--things-blue` background
- Hover: `--things-blue` border

**Tags:**
- Background: `--things-gray-100`
- Text: `--things-gray-600`  
- Size: `text-xs`
- Padding: `px-2 py-1`

---

## Current Technical Architecture

### Key Components
- **SparkApp.tsx** - Main app with task caching and real-time subscriptions
- **QuickEntry.tsx** - Floating task creation popup (recently updated design)
- **TaskForm.tsx** - "New To-Do" modal form
- **TaskEditForm.tsx** - Task editing modal with cache refresh
- **TaskItem.tsx** - Individual task display with subtask support
- **SubtaskForm.tsx** - Custom subtask creation popup
- **TaskList.tsx** - Task display with project grouping
- **Sidebar.tsx** - Navigation with project/area organization

### Data Flow
- **Task Caching** - SparkApp maintains `allTasks` state for instant filtering
- **Real-time Updates** - Dual system: manual cache refresh + subscription updates
- **Instant Task Switching** - Client-side filtering eliminates loading delays

### Database Schema Extensions
- **timeBlocks table** - For time blocking functionality with hour-by-hour scheduling
- **recurringTasks table** - For recurring task patterns and scheduling rules
- **Enhanced task queries** - For calendar and date-based filtering
- **Duration field** - Task time estimation and management

### Keyboard Shortcuts
- **⌘⇧N** - Quick Entry (already implemented)
- **⌘K** - Global Search (already implemented)  
- **⌘N** - New Task
- **⌘R** - Create Recurring Task
- **Escape** - Close modals

---

## Open Questions & Design Decisions Needed

### Smart Time Grouping Logic
**Current Discussion:** How to determine which time periods appear in each view

**Today View Logic (Decided):**
- Show time periods based on current time of day
- Morning (6am-12pm): Show This Morning, This Afternoon, This Evening
- Afternoon (12pm-5pm): Show This Afternoon, This Evening  
- Evening (5pm-10pm): Show This Evening, Tomorrow
- Late Night (10pm+): Show Tomorrow

**Still Need to Decide:**
- Exact time boundaries for morning/afternoon/evening
- Logic for Upcoming view time groupings
- How to handle tasks without specific times
- Whether to show empty sections or hide them

### Natural Language Date Parsing
**Questions:**
- Which phrases to support? ("tomorrow", "next week", "in 3 days", "friday")
- Integration with existing calendar search functionality
- Fallback behavior for unrecognized phrases

### Project Headings Implementation
**Questions:**
- Database schema changes needed?
- UI for creating/managing headings
- How headings interact with existing project structure

---

## Design Decisions Log

### QuickEntry Design Experiment (Failed)
**Attempted:** Things 3 inspired design with larger typography, better spacing
**Result:** User feedback - "looks nothing like Things 3", buttons too big
**Lesson:** My visual design interpretation skills are poor
**Resolution:** Reverted to original design, kept only border removal
**Key Insight:** Need better tools for visual design analysis (researched MCP options)

### Visual Design Analysis Tools Research
**Found MCP Tools:**
- Screenshot MCP Server - captures and analyzes screen content with OCR
- Webpage Screenshot MCP - takes screenshots with Puppeteer  
- Glasses MCP - web screenshots and visual analysis
**Conclusion:** These could help with more accurate design interpretation

### Things 3 Feature Analysis Correction
**Original Misunderstanding:** Thought "Today vs Evening Separation" meant separate views
**Actual Implementation:** "This Evening" is a section within Today view
**Further Discovery:** Things 3 only has basic date grouping + manual "This Evening"
**Our Decision:** Build smarter automatic time grouping that surpasses Things 3

---

## Technical Implementation Notes

### Task Caching System (SparkApp.tsx)
```typescript
const [allTasks, setAllTasks] = useState<Task[]>([]);
const refreshTaskCache = async () => {
  const updatedTasks = await getTasks({ view: 'all' });
  setAllTasks(updatedTasks);
};
```
**Purpose:** Instant task filtering without API calls
**Components with cache refresh:** QuickEntry, TaskForm, TaskEditForm

### Real-time Updates Pattern
**Manual Refresh:** `onTaskCreated/onTaskUpdated` callbacks trigger immediate cache refresh
**Background Sync:** Task subscriptions update cache for changes from other sources
**Result:** Tasks appear instantly after creation/editing

### QuickEntry Component Structure
**Visual:** Clean popup with subtle shadow, no border
**Functionality:** Title input, calendar picker with search, date suggestions
**Interaction:** Click-outside-to-close, escape key support

---

## Lessons Learned

1. **Time Estimates Are Unreliable** - "30 seconds" became much longer with breaking/fixing
2. **Visual Design Interpretation** - Need better tools/methods for accurate design analysis  
3. **Feature Research Importance** - Understanding actual vs perceived functionality crucial
4. **Incremental Changes** - Small visual tweaks safer than major redesigns
5. **User Feedback Critical** - Quick feedback prevents extended wrong directions

---

## Development Phases

### Phase 1: Calendar & Time Management
- ✅ **Calendar Views** - Monthly, weekly, daily, agenda views
- ✅ **Time Blocking** - Hour-by-hour schedule management  
- ✅ **Recurring Tasks** - Flexible recurring patterns
- ✅ **Duration Tracking** - Task time estimation
- ✅ **Enhanced Scheduling** - Drag & drop task scheduling

### Phase 2: Advanced Views & Interfaces  
- **Kanban View** - Board-style task management
- **Timeline View** - Gantt-style project visualization
- **Eisenhower Matrix** - Priority-based task categorization
- **Enhanced Project Organization** - Project folders and headings

### Phase 3: AI & Intelligence
- **Natural Language Processing** - Advanced date/time recognition
- **AI-powered Assistance** - Smart task suggestions
- **Intelligent Time Grouping** - Context-aware task organization
- **Smart Scheduling** - AI-suggested time blocking

### Phase 4: Gamification & Analytics
- **Productivity Analytics** - Comprehensive visualizations  
- **Habit Tracker** - Regular activity tracking
- **Motivation Systems** - Gamification elements
- **Advanced Statistics** - Detailed insights and trends

## Next Steps Priority

### Immediate (High Priority)
1. **Complete Smart Time Grouping Design** - Finalize logic for all views
2. **Implement Time Grouping** - Start with Today view context-aware sections

### Medium Priority  
3. **Project Headings** - Design and implement section headers within projects
4. **Kanban View** - Visual board interface for task management
5. **Enhanced Analytics** - Productivity visualizations and statistics

### Later
6. **AI Features** - Natural language processing and smart assistance
7. **Gamification** - Motivation systems and habit tracking
8. **Advanced Views** - Timeline and matrix views

---

## Key Project Insights

**Goal:** Build a task management app that surpasses Things 3 with smarter automation
**Approach:** Take inspiration from Things 3 but implement more intelligent features
**Challenge:** Balancing feature complexity with implementation feasibility
**Success Metric:** Create genuinely useful improvements over existing solutions

**Current Status:** Solid foundation with task management, projects, areas, subtasks, and real-time updates. Ready to add intelligent time grouping and advanced features.