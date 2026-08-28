import { useEffect } from "react";
import { Header } from "@/features/layout/components/header";
import { KanbanBoard } from "@/features/tasks/components/kanban-board";
import { useTaskStore } from "@/store/task-store";

function App() {
  const { fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <KanbanBoard />
      </main>
    </div>
  );
}

export default App;
