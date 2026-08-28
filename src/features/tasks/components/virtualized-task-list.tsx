import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { Task } from "@/types/task";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VirtualizedTaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

function SortableRow({
  task,
  onEditTask,
  onDeleteTask,
}: {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const statusConfig = TASK_STATUS_CONFIG[task.status];
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== "done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "px-4 py-3 border-b bg-card flex items-center gap-3 touch-none",
        isDragging ? "z-50 opacity-80 shadow-lg" : "hover:bg-accent/50 cursor-pointer",
      )}
      onClick={() => !isDragging && onEditTask(task)}
    >
      <button
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <DotsSixVerticalIcon className="size-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">
            {task.title}
          </h3>
          <Badge variant="outline" className={priorityConfig.color}>
            {priorityConfig.label}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary">{statusConfig.label}</Badge>
        <span
          className={
            isOverdue
              ? "text-xs text-destructive font-medium"
              : "text-xs text-muted-foreground"
          }
        >
          {format(dueDate, "MMM d")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={(e) => {
            e.stopPropagation();
            onEditTask(task);
          }}
        >
          <PencilIcon className="size-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(task);
          }}
        >
          <TrashIcon className="size-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}

export function VirtualizedTaskList({
  tasks,
  onEditTask,
  onDeleteTask,
  onReorder,
}: VirtualizedTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const allIds = tasks.map((t) => t.id);

  const estimateSize = useCallback(() => 88, []);
  const getItemKey = useCallback(
    (index: number) => tasks[index]?.id ?? index,
    [tasks],
  );

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
    gap: 12,
    getItemKey,
  });

  const items = virtualizer.getVirtualItems();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (_event: DragStartEvent) => {
    if (parentRef.current) {
      parentRef.current.style.overflowY = "hidden";
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (parentRef.current) {
      parentRef.current.style.overflowY = "auto";
    }

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allIds.indexOf(active.id as string);
    const newIndex = allIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(oldIndex, newIndex);
  };

  const handleDragCancel = () => {
    if (parentRef.current) {
      parentRef.current.style.overflowY = "auto";
    }
  };

  if (tasks.length === 0) {
    return (
      <div
        className="h-[calc(100vh-220px)] rounded-lg border flex items-center justify-center"
        aria-label="Task list"
      >
        <p className="text-center text-sm text-muted-foreground py-12">
          No tasks found
        </p>
      </div>
    );
  }

  const paddingTop = items.length > 0 ? items[0].start : 0;
  const paddingBottom =
    items.length > 0
      ? virtualizer.getTotalSize() - items[items.length - 1].end
      : 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        <div
          ref={parentRef}
          className="h-[calc(100vh-220px)] overflow-auto rounded-lg border"
          aria-label="Task list"
        >
          <div style={{ paddingTop, paddingBottom }}>
            <div className="flex flex-col gap-3">
              {items.map((virtualItem) => {
                const task = tasks[virtualItem.index];
                if (!task) return null;

                return (
                  <SortableRow
                    key={virtualItem.key}
                    task={task}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
