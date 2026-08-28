import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarIcon } from "@phosphor-icons/react";
import { format, isToday, isTomorrow } from "date-fns";
import type { Task } from "@/types/task";
import { PRIORITY_CONFIG } from "@/types/task";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { TaskActionsMenu } from "./task-actions-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function formatDueDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

export const TaskCardPresentation = memo(function TaskCardPresentation({
  task,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== "done";
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <Card className="relative group hover:shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 py-(--card-spacing) cursor-grab active:cursor-grabbing">
      <CardContent>
        <div className="flex items-center justify-between gap-1.5">
          <Badge variant="outline" className={priorityConfig.color}>
            {priorityConfig.label}
          </Badge>
          <div className="z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <TaskActionsMenu
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
            />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-sm leading-snug line-clamp-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center">
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs tabular-nums",
            isOverdue
              ? "text-destructive font-medium"
              : "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-3.5" />
          <span>{formatDueDate(dueDate)}</span>
          {isOverdue && <span className="text-destructive">· overdue</span>}
        </div>
      </CardFooter>
    </Card>
  );
});

export function TaskCard(props: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.task.id,
    data: { task: props.task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none cursor-grab",
        isDragging && "cursor-grabbing shadow-lg",
      )}
    >
      <TaskCardPresentation {...props} />
    </div>
  );
}
