export type TaskStatus = "todo" | "in-progress" | "in-review" | "done";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
}

export interface TaskFilters {
  search: string;
  statuses: TaskStatus[];
  priorities: Priority[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export type SortField = "title" | "priority" | "dueDate" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface TaskSort {
  field: SortField;
  direction: SortDirection;
}

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  todo: { label: "To Do", color: "bg-slate-500" },
  "in-progress": { label: "In Progress", color: "bg-blue-500" },
  "in-review": { label: "In Review", color: "bg-amber-500" },
  done: { label: "Done", color: "bg-emerald-500" },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string }
> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: {
    label: "Medium",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  urgent: {
    label: "Urgent",
    color: "bg-red-100 text-red-700 border-red-200",
  },
};

export const ALL_STATUSES: TaskStatus[] = [
  "todo",
  "in-progress",
  "in-review",
  "done",
];

export const ALL_PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
