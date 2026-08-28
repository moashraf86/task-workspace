import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { Header } from "@/features/layout/components/header";
import { ErrorBoundary } from "@/features/layout/components/error-boundary";
import { KanbanBoard } from "@/features/tasks/components/kanban-board";
import { useTaskStore } from "@/store/task-store";
import { FilterBar } from "./features/tasks/components/filter-bar";

function App() {
  const { fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container py-6!">
            <FilterBar />
            <KanbanBoard />
          </main>
        </div>
        <Toaster position="bottom-right" richColors />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
