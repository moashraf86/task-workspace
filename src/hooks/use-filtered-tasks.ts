import { useMemo } from "react";
import { isAfter, isBefore, startOfDay } from "date-fns";
import type { Task, TaskFilters, TaskSort, Priority } from "@/types/task";

const PRIORITY_ORDER: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

export function useFilteredTasks(
  tasks: Task[],
  filters: TaskFilters,
  sort: TaskSort,
): Task[] {
  return useMemo(() => {
    let result = [...tasks];

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query),
      );
    }

    if (filters.statuses.length > 0) {
      result = result.filter((task) => filters.statuses.includes(task.status));
    }

    if (filters.priorities.length > 0) {
      result = result.filter((task) =>
        filters.priorities.includes(task.priority),
      );
    }

    if (filters.dateRange.from) {
      const fromDate = startOfDay(new Date(filters.dateRange.from));
      result = result.filter((task) => {
        const taskDate = startOfDay(new Date(task.dueDate));
        return (
          isAfter(taskDate, fromDate) ||
          taskDate.getTime() === fromDate.getTime()
        );
      });
    }

    if (filters.dateRange.to) {
      const toDate = startOfDay(new Date(filters.dateRange.to));
      result = result.filter((task) => {
        const taskDate = startOfDay(new Date(task.dueDate));
        return (
          isBefore(taskDate, toDate) || taskDate.getTime() === toDate.getTime()
        );
      });
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case "dueDate":
          comparison =
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, filters, sort]);
}
