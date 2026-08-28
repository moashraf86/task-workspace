import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { taskService } from "@/services/task-service";
import type { Task, TaskFormData, TaskStatus } from "@/types/task";

const TASKS_KEY = ["tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: taskService.getAll,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskFormData) => taskService.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY);

      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        ...data,
        position: previousTasks?.filter((t) => t.status === data.status).length ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) => [
        ...(old ?? []),
        optimisticTask,
      ]);

      return { previousTasks };
    },
    onError: (_err, _data, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TaskFormData>;
    }) => taskService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        (old ?? []).map((t) =>
          t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
        )
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        (old ?? []).filter((t) => t.id !== id)
      );

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      updates: Array<{ id: string; position: number; status: TaskStatus }>
    ) => taskService.reorder(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY);

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        (old ?? []).map((t) => {
          const update = updates.find((u) => u.id === t.id);
          return update
            ? { ...t, position: update.position, status: update.status }
            : t;
        })
      );

      return { previousTasks };
    },
    onError: (_err, _updates, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useBulkCreateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number) => taskService.bulkCreate(count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useResetToSeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.resetToSeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}
