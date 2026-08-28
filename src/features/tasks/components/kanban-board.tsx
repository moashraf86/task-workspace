import {
  DndContext,
  DragOverlay,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { PlusIcon, KanbanIcon, ListIcon, DatabaseIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  lazy,
  Suspense,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { flushSync } from "react-dom";
import { useTaskStore } from "@/store/task-store";
import { useFilteredTasks } from "@/features/tasks/hooks/use-filtered-tasks";
import {
  useTasks,
  useDeleteTask,
  useReorderTasks,
  useBulkCreateTasks,
  useResetToSeed,
} from "@/features/tasks/hooks/use-tasks";
import { ALL_STATUSES } from "@/types/task";
import type { Task, TaskStatus } from "@/types/task";
import { KanbanColumn } from "./kanban-column";
import { Button } from "@/components/ui/button";
import { TaskCardPresentation } from "./task-card";

const TaskFormModal = lazy(() =>
  import("./task-form-modal").then((m) => ({ default: m.TaskFormModal })),
);
const DeleteConfirmDialog = lazy(() =>
  import("./delete-confirm-dialog").then((m) => ({
    default: m.DeleteConfirmDialog,
  })),
);
const VirtualizedTaskList = lazy(() =>
  import("./virtualized-task-list").then((m) => ({
    default: m.VirtualizedTaskList,
  })),
);

function sortTasksByPosition(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.position - b.position);
}

export function KanbanBoard() {
  const { filters, sort } = useTaskStore();
  const { data: tasks = [], isLoading, error, refetch } = useTasks();
  const deleteTask = useDeleteTask();
  const reorderTasks = useReorderTasks();
  const bulkCreate = useBulkCreateTasks();
  const resetToSeed = useResetToSeed();

  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [view, setView] = useState<"board" | "list">("board");
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    const tasksKey = tasks.map((t) => `${t.id}:${t.position}:${t.status}:${t.updatedAt}`).join("|");
    if (tasksKey !== lastSyncedRef.current) {
      lastSyncedRef.current = tasksKey;
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const filteredTasks = useFilteredTasks(localTasks, filters, sort);
  const listTasks = useMemo(
    () => [...filteredTasks].sort((a, b) => a.position - b.position),
    [filteredTasks],
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleLoadDemoData = useCallback(() => {
    bulkCreate.mutate(1000, {
      onSuccess: () => {
        setView("list");
        toast.success("Demo data loaded", {
          description: "1000 tasks generated - switched to List view for better performance",
        });
      },
      onError: (err) => toast.error("Failed to load demo data", {
        description: err instanceof Error ? err.message : undefined,
      }),
    });
  }, [bulkCreate]);

  const handleResetData = useCallback(() => {
    resetToSeed.mutate(undefined, {
      onSuccess: () => toast.success("Data reset to seed tasks"),
      onError: (err) => toast.error("Failed to reset data", {
        description: err instanceof Error ? err.message : undefined,
      }),
    });
  }, [resetToSeed]);

  const handleListReorder = useCallback(
    (oldIndex: number, newIndex: number) => {
      const reordered = [...listTasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updates = reordered.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      flushSync(() => {
        setLocalTasks((prev) =>
          prev.map((t) => {
            const update = updates.find((u) => u.id === t.id);
            return update
              ? { ...t, position: update.position }
              : t;
          }),
        );
      });

      reorderTasks.mutate(updates, {
        onError: (err) =>
          toast.error("Failed to reorder task", {
            description: err instanceof Error ? err.message : undefined,
          }),
      });
    },
    [listTasks, reorderTasks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksByStatus = (status: TaskStatus) =>
    sortTasksByPosition(filteredTasks.filter((t) => t.status === status));

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);

  const handleDeleteTask = useCallback((task: Task) => {
    setDeletingTask(task);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask.mutateAsync(deletingTask.id);
      toast.success("Task deleted", { description: deletingTask.title });
      setDeletingTask(null);
    } catch (err) {
      toast.error("Failed to delete task", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTask(null);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTaskData = active.data.current?.task as Task | undefined;
    if (!activeTaskData) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const isOverColumn = ALL_STATUSES.includes(overId as TaskStatus);

    if (isOverColumn) {
      const targetStatus = overId as TaskStatus;
      if (activeTaskData.status === targetStatus) {
        setActiveTask(null);
        return;
      }

      const targetTasks = localTasks
        .filter((t) => t.status === targetStatus)
        .sort((a, b) => a.position - b.position);
      const renumberedTarget = [...targetTasks, { ...activeTaskData, status: targetStatus }];
      const targetUpdates = renumberedTarget.map((t, index) => ({
        id: t.id,
        position: index,
        status: targetStatus,
      }));

      const sourceTasks = localTasks
        .filter((t) => t.status === activeTaskData.status && t.id !== activeId)
        .sort((a, b) => a.position - b.position);
      const sourceUpdates = sourceTasks.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      const allUpdates = [...targetUpdates, ...sourceUpdates];

      flushSync(() => {
        setLocalTasks((prev) =>
          prev.map((t) => {
            const update = allUpdates.find((u) => u.id === t.id);
            return update
              ? { ...t, position: update.position, status: update.status }
              : t;
          }),
        );
      });

      reorderTasks.mutate(allUpdates, {
        onSuccess: () =>
          toast.success("Task moved", {
            description: `${activeTaskData.title} moved to ${targetStatus.replace("-", " ")}`,
          }),
        onError: (err) =>
          toast.error("Failed to move task", {
            description: err instanceof Error ? err.message : undefined,
          }),
      });
      setActiveTask(null);
      return;
    }

    const overTask = localTasks.find((t) => t.id === overId);
    if (!overTask) {
      setActiveTask(null);
      return;
    }

    if (activeTaskData.status === overTask.status) {
      const columnTasks = localTasks
        .filter((t) => t.status === activeTaskData.status)
        .sort((a, b) => a.position - b.position);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setActiveTask(null);
        return;
      }

      const reordered = [...columnTasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updates = reordered.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      flushSync(() => {
        setLocalTasks((prev) =>
          prev.map((t) => {
            const update = updates.find((u) => u.id === t.id);
            return update
              ? { ...t, position: update.position, status: update.status }
              : t;
          }),
        );
      });

      reorderTasks.mutate(updates, {
        onError: (err) =>
          toast.error("Failed to reorder task", {
            description: err instanceof Error ? err.message : undefined,
          }),
      });
      setActiveTask(null);
    } else {
      const targetTasks = localTasks
        .filter((t) => t.status === overTask.status)
        .sort((a, b) => a.position - b.position);
      const insertIndex = targetTasks.findIndex((t) => t.id === overId);

      const updatedTarget = [...targetTasks];
      updatedTarget.splice(insertIndex, 0, {
        ...activeTaskData,
        status: overTask.status,
      });

      const targetUpdates = updatedTarget.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      const sourceTasks = localTasks
        .filter((t) => t.status === activeTaskData.status && t.id !== activeId)
        .sort((a, b) => a.position - b.position);
      const sourceUpdates = sourceTasks.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      const allUpdates = [...targetUpdates, ...sourceUpdates];

      flushSync(() => {
        setLocalTasks((prev) =>
          prev.map((t) => {
            const update = allUpdates.find((u) => u.id === t.id);
            return update
              ? { ...t, position: update.position, status: update.status }
              : t;
          }),
        );
      });

      reorderTasks.mutate(allUpdates, {
        onSuccess: () =>
          toast.success("Task moved", {
            description: `${activeTaskData.title} moved to ${overTask.status.replace("-", " ")}`,
          }),
        onError: (err) =>
          toast.error("Failed to move task", {
            description: err instanceof Error ? err.message : undefined,
          }),
      });
      setActiveTask(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-10 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ALL_STATUSES.map((s) => (
            <div key={s} className="rounded-lg border bg-card p-4 min-h-100">
              <div className="h-6 w-24 bg-muted rounded animate-pulse mb-4" />
              <div className="flex flex-col gap-3">
                <div className="h-28 w-full bg-muted rounded-lg animate-pulse" />
                <div className="h-28 w-full bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to fetch tasks"}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 mt-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <span className="text-sm text-muted-foreground">
            {filteredTasks.length}
            {filteredTasks.length !== localTasks.length && ` of ${localTasks.length}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-7"
              onClick={() => setView("board")}
            >
              <KanbanIcon className="size-4" />
              Board
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7"
              onClick={() => setView("list")}
            >
              <ListIcon className="size-4" />
              List
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemoData}
            disabled={bulkCreate.isPending || localTasks.length > 500}
          >
            <DatabaseIcon className="size-4" />
            Load 1000
          </Button>
          {localTasks.length > 50 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetData}
              disabled={resetToSeed.isPending}
            >
              <ArrowCounterClockwiseIcon className="size-4" />
              Reset
            </Button>
          )}

          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <PlusIcon className="size-4" />
            New Task
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg border bg-muted" />}>
          <VirtualizedTaskList
            tasks={listTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onReorder={handleListReorder}
          />
        </Suspense>
      ) : (
        <>
          {localTasks.length > 100 && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              You have {localTasks.length} tasks. Board view may be slow with large datasets. Consider using <button className="font-medium underline" onClick={() => setView("list")}>List view</button> for better performance.
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ALL_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus(status)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 rotate-2">
                <TaskCardPresentation
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        </>
      )}

      <Suspense fallback={null}>
        <TaskFormModal
          open={isFormOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseForm();
          }}
          task={editingTask}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DeleteConfirmDialog
          open={!!deletingTask}
          onOpenChange={(open) => !open && setDeletingTask(null)}
          task={deletingTask}
          onConfirm={handleConfirmDelete}
        />
      </Suspense>
    </>
  );
}
