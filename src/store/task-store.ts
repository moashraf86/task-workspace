import { create } from "zustand";
import type { TaskFilters, TaskSort } from "@/types/task";

interface TaskState {
  filters: TaskFilters;
  sort: TaskSort;
}

interface TaskActions {
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: TaskSort) => void;
}

const defaultFilters: TaskFilters = {
  search: "",
  statuses: [],
  priorities: [],
  dateRange: {
    from: null,
    to: null,
  },
};

const defaultSort: TaskSort = {
  field: "createdAt",
  direction: "desc",
};

export const useTaskStore = create<TaskState & TaskActions>((set) => ({
  filters: defaultFilters,
  sort: defaultSort,

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  setSort: (sort) => {
    set({ sort });
  },
}));
