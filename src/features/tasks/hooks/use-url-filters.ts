import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { TaskFilters, TaskStatus, Priority } from "@/types/task";
import { useTaskStore } from "@/store/task-store";

const STATUS_VALUES: TaskStatus[] = ["todo", "in-progress", "in-review", "done"];
const PRIORITY_VALUES: Priority[] = ["low", "medium", "high", "urgent"];

function parseFiltersFromParams(
  params: URLSearchParams
): Partial<TaskFilters> {
  const filters: Partial<TaskFilters> = {};

  const search = params.get("search");
  if (search) filters.search = search;

  const statuses = params.get("statuses");
  if (statuses) {
    filters.statuses = statuses
      .split(",")
      .filter((s): s is TaskStatus => STATUS_VALUES.includes(s as TaskStatus));
  }

  const priorities = params.get("priorities");
  if (priorities) {
    filters.priorities = priorities
      .split(",")
      .filter((p): p is Priority => PRIORITY_VALUES.includes(p as Priority));
  }

  const from = params.get("from");
  const to = params.get("to");
  if (from || to) {
    filters.dateRange = {
      from: from ?? null,
      to: to ?? null,
    };
  }

  return filters;
}

function updateSearchParams(
  params: URLSearchParams,
  filters: TaskFilters
): URLSearchParams {
  const next = new URLSearchParams(params);

  if (filters.search) {
    next.set("search", filters.search);
  } else {
    next.delete("search");
  }

  if (filters.statuses.length > 0) {
    next.set("statuses", filters.statuses.join(","));
  } else {
    next.delete("statuses");
  }

  if (filters.priorities.length > 0) {
    next.set("priorities", filters.priorities.join(","));
  } else {
    next.delete("priorities");
  }

  if (filters.dateRange.from) {
    next.set("from", filters.dateRange.from);
  } else {
    next.delete("from");
  }

  if (filters.dateRange.to) {
    next.set("to", filters.dateRange.to);
  } else {
    next.delete("to");
  }

  return next;
}

export function useUrlFilters(): void {
  const { filters, setFilters } = useTaskStore();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const parsed = parseFiltersFromParams(searchParams);
    if (Object.keys(parsed).length > 0) {
      setFilters(parsed);
    }
  }, [searchParams, setFilters]);

  const updateUrl = useCallback(
    (newFilters: TaskFilters) => {
      const next = updateSearchParams(searchParams, newFilters);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    updateUrl(filters);
  }, [filters, updateUrl]);
}
