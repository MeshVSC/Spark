# Components Need Manual Update

The following components still import from Convex and need to be updated to use Supabase:

1. AreaForm.tsx
2. CalendarView.tsx
3. ProjectForm.tsx
4. QuickEntry.tsx
5. RecurringTaskForm.tsx
6. Sidebar.tsx
7. SubtaskList.tsx
8. TaskEditForm.tsx
9. TaskForm.tsx
10. TaskItem.tsx
11. TaskList.tsx
12. TaskSearch.tsx
13. TaskStats.tsx
14. TimeBlockingView.tsx

Each needs:

- Replace with appropriate Supabase query imports
- Update component logic to use async/await instead of Convex hooks

This is a significant refactor that requires understanding each component's functionality.