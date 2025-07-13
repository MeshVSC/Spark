import { useState, useEffect } from "react";
import { searchTasks } from "../lib/queries/tasks";
import { TaskItem } from "./TaskItem";
import type { Database } from "../lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskSearchProps {
  isVisible: boolean;
  onClose: () => void;
}

export function TaskSearch({ isVisible, onClose }: TaskSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Task[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim()) {
        try {
          const results = await searchTasks(debouncedQuery.trim());
          setSearchResults(results);
        } catch (error) {
          console.error("Failed to search tasks:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center pt-32 z-50">
      {/* Fixed search input area */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-base border-none outline-none placeholder-gray-400"
              placeholder="Search tasks..."
              autoFocus
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Expandable results area */}
        {debouncedQuery.trim() && (
          <div className="px-6 pb-6">
            <div className="border-t border-gray-200 pt-4">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No tasks found for "{debouncedQuery}"</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => {}} // Toggle and Delete functionality not directly handled in search results
                      onDelete={() => {}} // but passed to TaskItem for consistency
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
