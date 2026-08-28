import { useDroppable, useDndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "@/types/task";
import { TASK_STATUS_CONFIG } from "@/types/task";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function KanbanColumn({
  status,
  tasks,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const { over, active } = useDndContext();
  const config = TASK_STATUS_CONFIG[status];
  const taskIds = tasks.map((t) => t.id);

  const activeTask = active?.data.current?.task as Task | undefined;
  const isCrossColumn = activeTask && activeTask.status !== status;

  const isOverColumn =
    isCrossColumn &&
    (over?.id === status || (over && taskIds.includes(over.id as string)));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border bg-card transition-colors",
        isOverColumn && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2 border-b p-4">
        <div className={cn("h-2 w-2 rounded-full", config.color)} />
        <h2 className="font-semibold">{config.label}</h2>
        <Badge variant="secondary" className="ml-auto">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex-1 flex flex-col gap-3 p-4 overflow-auto min-h-50">
        {tasks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No tasks
          </p>
        ) : (
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
