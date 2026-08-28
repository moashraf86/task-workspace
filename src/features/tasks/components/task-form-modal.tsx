import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Task } from "@/types/task";
import {
  ALL_PRIORITIES,
  ALL_STATUSES,
  TASK_STATUS_CONFIG,
  PRIORITY_DOT,
  PRIORITY_LABEL,
} from "@/types/task";
import { useCreateTask, useUpdateTask } from "@/features/tasks/hooks/use-tasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in-progress", "in-review", "done"]),
  dueDate: z.string().min(1, "Due date is required"),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export function TaskFormModal({
  open,
  onOpenChange,
  task,
}: TaskFormModalProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        dueDate: "",
      });
    }
  }, [task, form]);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, data });
        toast.success("Task updated", { description: data.title });
      } else {
        await createTask.mutateAsync(data);
        toast.success("Task created", { description: data.title });
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(task ? "Failed to update task" : "Failed to create task", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PRIORITIES.map((priority) => (
                        <Button
                          key={priority}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8",
                            field.value === priority &&
                              "bg-primary/30! border-primary/50!",
                          )}
                          onClick={() => field.onChange(priority)}
                        >
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              PRIORITY_DOT[priority],
                            )}
                          />
                          {PRIORITY_LABEL[priority]}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="bg-red-400 hidden"></span>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {ALL_STATUSES.map((status) => (
                        <Button
                          key={status}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8",
                            field.value === status &&
                              "bg-primary/30! border-primary/50!",
                          )}
                          onClick={() => field.onChange(status)}
                        >
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              TASK_STATUS_CONFIG[status].color,
                            )}
                          />
                          {TASK_STATUS_CONFIG[status].label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value || null}
                      onChange={field.onChange}
                      placeholder="Pick a due date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  createTask.isPending ||
                  updateTask.isPending
                }
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : task
                    ? "Update Task"
                    : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
