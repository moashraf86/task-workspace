import { create } from "zustand";
import type {
  Task,
  TaskFormData,
  TaskFilters,
  TaskSort,
  TaskStatus,
} from "@/types/task";
import { taskService } from "@/services/task-service";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  sort: TaskSort;
}

interface TaskActions {
  fetchTasks: () => Promise<void>;
  createTask: (data: TaskFormData) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<Task>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: TaskSort) => void;
  clearError: () => void;
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
  tasks: [],
  isLoading: false,
  error: null,
  filters: defaultFilters,
  sort: defaultSort,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getAll();
      set({ tasks, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch tasks",
        isLoading: false,
      });
    }
  },

  createTask: async (data) => {
    try {
      const task = await taskService.create(data);
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create task";
      set({ error: message });
      throw new Error(message);
    }
  },

  updateTask: async (id, data) => {
    try {
      const task = await taskService.update(id, data);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? task : t)),
      }));
      return task;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update task";
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteTask: async (id) => {
    try {
      await taskService.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete task";
      set({ error: message });
      throw new Error(message);
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      const task = await taskService.updateStatus(id, status);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? task : t)),
      }));
      return task;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update task status";
      set({ error: message });
      throw new Error(message);
    }
  },

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

  clearError: () => {
    set({ error: null });
  },
}));
