import { useState } from "react";

interface TaskFiltersProps {
  onFilterChange: (filters: {
    priority?: "low" | "medium" | "high";
    tags?: string[];
    dateRange?: "today" | "week" | "month";
  }) => void;
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const handleFilterChange = (filterValue: string) => {
    setSelectedFilter(filterValue);
    
    // Reset filters first
    let newFilters: any = {};
    
    // Apply the selected filter
    switch (filterValue) {
      case "important":
        newFilters.priority = "high";
        break;
      case "today":
        newFilters.dateRange = "today";
        break;
      case "week":
        newFilters.dateRange = "week";
        break;
      default:
        // "all" case - no filters applied
        break;
    }
    
    onFilterChange(newFilters);
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "important", label: "Important" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
  ];

  return (
    <div className="mb-4">
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            className={`things-filter-badge ${
              selectedFilter === filter.id ? "active" : "inactive"
            } hover:bg-gray-150`}
          >
            {filter.label}
          </button>
        ))}
        <button className="things-filter-badge inactive hover:bg-gray-150">
          ...
        </button>
      </div>
    </div>
  );
}
