import { useState, useEffect } from "react";
import { createRecurringTask, updateRecurringTask, updateTask } from "../lib/queries/tasks";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";

type RecurringTask = Database['public']['Tables']['recurring_tasks']['Row'];

interface RecurringTaskFormProps {
  isVisible: boolean;
  onClose: () => void;
  taskId?: string;
}

export function RecurringTaskForm({ isVisible, onClose, taskId }: RecurringTaskFormProps) {
  const [pattern, setPattern] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [endDate, setEndDate] = useState("");
  const [occurrences, setOccurrences] = useState<number | null>(null);
  const [recurringTask, setRecurringTask] = useState<RecurringTask | null>(null);

  useEffect(() => {
    const fetchRecurringTask = async () => {
      if (taskId) {
        const { data: task } = await supabase
          .from('tasks')
          .select('recurring_rule_id')
          .eq('id', taskId)
          .single();

        if (task && task.recurring_rule_id) {
          const { data: recurringTaskData } = await supabase
            .from('recurring_tasks')
            .select('*')
            .eq('id', task.recurring_rule_id)
            .single();
          
          if (recurringTaskData) {
            setRecurringTask(recurringTaskData);
            setPattern(recurringTaskData.pattern as any);
            setInterval(recurringTaskData.interval_value || 1);
            setDaysOfWeek(recurringTaskData.days_of_week || []);
            setEndDate(recurringTaskData.end_date ? new Date(recurringTaskData.end_date).toISOString().split('T')[0] : "");
            setOccurrences(recurringTaskData.occurrences || null);
          }
        }
      }
    };

    fetchRecurringTask();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const recurringData = {
      pattern,
      interval_value: interval,
      days_of_week: pattern === "weekly" ? daysOfWeek : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      occurrences: occurrences || undefined,
    };

    if (recurringTask) {
      // Update existing recurring task
      await updateRecurringTask(recurringTask.id, recurringData);
    } else if (taskId) {
      // Create new recurring task and link it to the existing task
      const newRecurringTask = await createRecurringTask(recurringData);
      if (newRecurringTask) {
        await updateTask(taskId, { recurring_rule_id: newRecurringTask.id, is_recurring: true });
      }
    }

    onClose();
  };

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!isVisible) return null;

  return (
    <div className="things-modal">
      <div className="things-modal-content">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recurring Task</h3>

          {/* Pattern Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repeat Pattern
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "custom", label: "Custom" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPattern(option.value as any)}
                  className={`p-2 text-sm rounded border ${
                    pattern === option.value
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="things-input w-20"
              />
              <span className="text-sm text-gray-600">
                {pattern === "daily" ? "day(s)" : 
                 pattern === "weekly" ? "week(s)" : 
                 pattern === "monthly" ? "month(s)" : "interval(s)"}
              </span>
            </div>
          </div>

          {/* Days of Week (for weekly pattern) */}
          {pattern === "weekly" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                On these days
              </label>
              <div className="flex gap-1">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDayOfWeek(index)}
                    className={`w-10 h-10 text-xs rounded-full ${
                      daysOfWeek.includes(index)
                        ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                        : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Condition */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Condition
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!endDate && !occurrences}
                  onChange={() => {
                    setEndDate("");
                    setOccurrences(null);
                  }}
                />
                <span className="text-sm">Never</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!endDate}
                  onChange={() => {
                    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                    setOccurrences(null);
                  }}
                />
                <span className="text-sm">On date:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="things-input text-sm"
                  disabled={!endDate}
                />
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!occurrences}
                  onChange={() => {
                    setOccurrences(10);
                    setEndDate("");
                  }}
                />
                <span className="text-sm">After:</span>
                <input
                  type="number"
                  min="1"
                  value={occurrences || ""}
                  onChange={(e) => setOccurrences(parseInt(e.target.value) || null)}
                  className="things-input w-20 text-sm"
                  disabled={!occurrences}
                />
                <span className="text-sm">occurrences</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="things-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="things-button-primary"
            >
              {taskId ? "Update" : "Create"} Recurring Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}