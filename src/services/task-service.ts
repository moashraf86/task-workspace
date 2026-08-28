import type { Task, TaskFormData } from "@/types/task";

const STORAGE_KEY = "task-workspace-tasks";

const generateId = (): string =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const now = (): string => new Date().toISOString();

const seedTasks: Task[] = [
  {
    id: generateId(),
    title: "Design system component audit",
    description:
      "Review all existing UI components and document inconsistencies in spacing, colors, and typography across the application.",
    priority: "high",
    status: "todo",
    dueDate: "2026-09-05",
    position: 0,
    createdAt: "2026-08-25T10:00:00.000Z",
    updatedAt: "2026-08-25T10:00:00.000Z",
  },
  {
    id: generateId(),
    title: "Implement user authentication flow",
    description:
      "Build login, registration, and password reset screens with form validation and error handling.",
    priority: "urgent",
    status: "in-progress",
    dueDate: "2026-09-01",
    position: 0,
    createdAt: "2026-08-24T09:00:00.000Z",
    updatedAt: "2026-08-26T14:30:00.000Z",
  },
  {
    id: generateId(),
    title: "API integration for dashboard metrics",
    description:
      "Connect the analytics dashboard to the backend API endpoints and handle loading, error, and empty states.",
    priority: "medium",
    status: "in-review",
    dueDate: "2026-09-03",
    position: 0,
    createdAt: "2026-08-23T11:00:00.000Z",
    updatedAt: "2026-08-27T08:15:00.000Z",
  },
  {
    id: generateId(),
    title: "Set up CI/CD pipeline",
    description:
      "Configure GitHub Actions for automated testing, linting, and deployment to staging environment.",
    priority: "medium",
    status: "done",
    dueDate: "2026-08-28",
    position: 0,
    createdAt: "2026-08-20T08:00:00.000Z",
    updatedAt: "2026-08-27T16:45:00.000Z",
  },
  {
    id: generateId(),
    title: "Write unit tests for utility functions",
    description:
      "Add comprehensive test coverage for date formatting, validation helpers, and data transformation utilities.",
    priority: "low",
    status: "todo",
    dueDate: "2026-09-10",
    position: 1,
    createdAt: "2026-08-26T13:00:00.000Z",
    updatedAt: "2026-08-26T13:00:00.000Z",
  },
  {
    id: generateId(),
    title: "Optimize image loading performance",
    description:
      "Implement lazy loading, responsive images, and WebP format conversion for the media gallery.",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-09-02",
    position: 1,
    createdAt: "2026-08-25T15:00:00.000Z",
    updatedAt: "2026-08-27T10:20:00.000Z",
  },
  {
    id: generateId(),
    title: "Refactor state management to Zustand",
    description:
      "Migrate from Context API to Zustand for better performance and simpler API across the application.",
    priority: "medium",
    status: "todo",
    dueDate: "2026-09-08",
    position: 2,
    createdAt: "2026-08-27T09:00:00.000Z",
    updatedAt: "2026-08-27T09:00:00.000Z",
  },
  {
    id: generateId(),
    title: "Accessibility audit and fixes",
    description:
      "Run WCAG 2.1 AA compliance checks and fix all critical accessibility issues including keyboard navigation and screen reader support.",
    priority: "high",
    status: "in-review",
    dueDate: "2026-09-04",
    position: 1,
    createdAt: "2026-08-22T10:00:00.000Z",
    updatedAt: "2026-08-27T11:00:00.000Z",
  },
];

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Task[];
    }
  } catch {
    // corrupted data, reset to seed
  }
  saveTasks(seedTasks);
  return seedTasks;
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const taskService = {
  async getAll(): Promise<Task[]> {
    await delay(400);
    return loadTasks();
  },

  async getById(id: string): Promise<Task | undefined> {
    await delay(200);
    const tasks = loadTasks();
    return tasks.find((t) => t.id === id);
  },

  async create(data: TaskFormData): Promise<Task> {
    await delay(300);
    const tasks = loadTasks();
    const maxPosition = tasks
      .filter((t) => t.status === data.status)
      .reduce((max, t) => Math.max(max, t.position), -1);
    const newTask: Task = {
      id: generateId(),
      ...data,
      position: maxPosition + 1,
      createdAt: now(),
      updatedAt: now(),
    };
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
  },

  async update(id: string, data: Partial<TaskFormData>): Promise<Task> {
    await delay(300);
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    tasks[index] = {
      ...tasks[index],
      ...data,
      updatedAt: now(),
    };
    saveTasks(tasks);
    return tasks[index];
  },

  async delete(id: string): Promise<void> {
    await delay(300);
    const tasks = loadTasks();
    const task = tasks.find((t) => t.id === id);
    const filtered = tasks.filter((t) => t.id !== id);
    if (task) {
      filtered.forEach((t) => {
        if (t.status === task.status && t.position > task.position) {
          t.position -= 1;
        }
      });
    }
    saveTasks(filtered);
  },

  async updateStatus(id: string, status: Task["status"]): Promise<Task> {
    return taskService.update(id, { status });
  },

  async reorder(
    updates: Array<{ id: string; position: number; status: Task["status"] }>
  ): Promise<Task[]> {
    await delay(200);
    const tasks = loadTasks();
    const timestamp = now();
    for (const update of updates) {
      const task = tasks.find((t) => t.id === update.id);
      if (task) {
        task.position = update.position;
        task.status = update.status;
        task.updatedAt = timestamp;
      }
    }
    saveTasks(tasks);
    return tasks;
  },
};
