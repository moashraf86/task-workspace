import { KanbanIcon } from "@phosphor-icons/react";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KanbanIcon className="size-5" />
          </div>
          <span className="font-bold tracking-tight">Task Workspace</span>
        </div>
        <div className="flex-1" />
        <ThemeToggle />
      </div>
    </header>
  );
}
