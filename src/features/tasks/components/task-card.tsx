import { PencilIcon, TrashIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import type { Task } from "@/types/task";
import { PRIORITY_CONFIG } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== "done";

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(task)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight line-clamp-2">
            {task.title}
          </h3>
          <Badge variant="outline" className={priorityConfig.color}>
            {priorityConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={
              isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
            }
          >
            {format(dueDate, "MMM d, yyyy")}
          </span>
          {isOverdue && <span className="text-destructive">(overdue)</span>}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
        >
          <PencilIcon className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
          className="text-destructive hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
