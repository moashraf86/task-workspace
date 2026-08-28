import type { Task, TaskStatus } from "@/types/task";
import { TASK_STATUS_CONFIG } from "@/types/task";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";

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
  const config = TASK_STATUS_CONFIG[status];

  return (
    <div className="flex flex-col rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b p-4">
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        <h2 className="font-semibold">{config.label}</h2>
        <Badge variant="secondary" className="ml-auto">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex-1 space-y-3 p-4 overflow-auto">
        {tasks.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
