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
import { PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useTaskStore } from "@/store/task-store";
import { useFilteredTasks } from "@/features/tasks/hooks/use-filtered-tasks";
import { ALL_STATUSES } from "@/types/task";
import type { Task, TaskStatus } from "@/types/task";
import { KanbanColumn } from "./kanban-column";
import { TaskFormModal } from "./task-form-modal";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TaskCardPresentation } from "./task-card";

function sortTasksByPosition(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.position - b.position);
}

export function KanbanBoard() {
  const {
    tasks,
    isLoading,
    error,
    filters,
    sort,
    fetchTasks,
    deleteTask,
    reorderTasks,
  } = useTaskStore();
  const filteredTasks = useFilteredTasks(tasks, filters, sort);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksByStatus = (status: TaskStatus) =>
    sortTasksByPosition(filteredTasks.filter((t) => t.status === status));

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      toast.success("Task deleted", { description: deletingTask.title });
      setDeletingTask(null);
    } catch (err) {
      toast.error("Failed to delete task", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskData = active.data.current?.task as Task | undefined;
    if (!activeTaskData) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isOverColumn = ALL_STATUSES.includes(overId as TaskStatus);

    if (isOverColumn) {
      const targetStatus = overId as TaskStatus;
      if (activeTaskData.status === targetStatus) return;

      const targetTasks = tasks
        .filter((t) => t.status === targetStatus)
        .sort((a, b) => a.position - b.position);
      const newPosition = targetTasks.length;

      const sourceTasks = tasks
        .filter((t) => t.status === activeTaskData.status && t.id !== activeId)
        .sort((a, b) => a.position - b.position);
      const sourceUpdates = sourceTasks.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      try {
        await reorderTasks([
          { id: activeId, position: newPosition, status: targetStatus },
          ...sourceUpdates,
        ]);
        toast.success("Task moved", {
          description: `${activeTaskData.title} moved to ${targetStatus.replace("-", " ")}`,
        });
      } catch (err) {
        toast.error("Failed to move task", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    if (activeTaskData.status === overTask.status) {
      const columnTasks = tasks
        .filter((t) => t.status === activeTaskData.status)
        .sort((a, b) => a.position - b.position);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = [...columnTasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updates = reordered.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      try {
        await reorderTasks(updates);
      } catch (err) {
        toast.error("Failed to reorder task", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    } else {
      const targetTasks = tasks
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

      const sourceTasks = tasks
        .filter((t) => t.status === activeTaskData.status && t.id !== activeId)
        .sort((a, b) => a.position - b.position);
      const sourceUpdates = sourceTasks.map((t, index) => ({
        id: t.id,
        position: index,
        status: t.status,
      }));

      try {
        await reorderTasks([...targetUpdates, ...sourceUpdates]);
        toast.success("Task moved", {
          description: `${activeTaskData.title} moved to ${overTask.status.replace("-", " ")}`,
        });
      } catch (err) {
        toast.error("Failed to move task", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
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
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchTasks}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 mt-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

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

      <TaskFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseForm();
        }}
        task={editingTask}
      />

      <DeleteConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        task={deletingTask}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
