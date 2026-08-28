import { MagnifyingGlassIcon, FunnelIcon, XIcon } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/task-store";
import { useUrlFilters } from "@/features/tasks/hooks/use-url-filters";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ALL_STATUSES,
  ALL_PRIORITIES,
  TASK_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/types/task";
import type { TaskStatus, Priority } from "@/types/task";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export function FilterBar() {
  const { filters, setFilters, resetFilters } = useTaskStore();
  useUrlFilters();

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, setFilters]);

  useEffect(() => {
    if (filters.search !== searchInput && filters.search !== debouncedSearch) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  const toggleStatus = (status: TaskStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    setFilters({ statuses: newStatuses });
  };

  const togglePriority = (priority: Priority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    setFilters({ priorities: newPriorities });
  };

  const activeFilterCount =
    filters.statuses.length +
    filters.priorities.length +
    (filters.dateRange.from ? 1 : 0) +
    (filters.dateRange.to ? 1 : 0);

  const clearAllFilters = () => {
    resetFilters();
    setSearchInput("");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search tasks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" className="relative">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-72" align="end">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {activeFilterCount > 0
                  ? `${activeFilterCount} active`
                  : "No filters"}
              </span>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={clearAllFilters}
                >
                  Clear all
                </Button>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-sm mb-3">Status</h3>
              <div className="flex flex-col gap-2">
                {ALL_STATUSES.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    {TASK_STATUS_CONFIG[status].label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-sm mb-3">Priority</h3>
              <div className="flex flex-col gap-2">
                {ALL_PRIORITIES.map((priority) => (
                  <label
                    key={priority}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={filters.priorities.includes(priority)}
                      onCheckedChange={() => togglePriority(priority)}
                    />
                    {PRIORITY_CONFIG[priority].label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-sm mb-3">Due Date Range</h3>
              <DateRangePicker
                value={filters.dateRange}
                onChange={(range) => setFilters({ dateRange: range })}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
