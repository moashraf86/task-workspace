# Task Workspace — Kanban Board

A performant, full-featured Kanban task management application built with React 19, TypeScript, and TanStack Query. Supports drag-and-drop reordering, virtualized list rendering for 1000+ tasks, URL-synced filters, and light/dark theme switching.

---

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Architectural Decisions](#architectural-decisions)
3. [Engineering Trade-Offs](#engineering-trade-offs)
4. [Future Scalability & Roadmap](#future-scalability--roadmap)

---

## Quick Start Guide

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/moashraf86/task-workspace.git
cd task-workspace

# Install dependencies
npm install
```

### Environment Variables

This project uses **no environment variables** by default. All data is persisted in browser `localStorage` under the key `task-workspace-tasks`. No backend or API keys are required.

> If you later connect a real API, create a `.env` file at the project root:
>
> ```env
> VITE_API_BASE_URL=https://your-api.example.com
> ```

### Execution Commands

| Command              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Start the local development server (Vite HMR)         |
| `npm run build`      | Type-check and build the production bundle to `dist/` |
| `npm run preview`    | Preview the production build locally                  |
| `npm test`           | Run the test suite once (Vitest)                      |
| `npm run test:watch` | Run tests in watch mode                               |
| `npm run lint`       | Run the Oxlint linter                                 |
| `npm run typecheck`  | Run TypeScript type checking without emitting files   |

### Running the App

```bash
npm run dev
# → http://localhost:5173
```

The app seeds 8 realistic demo tasks on first load. You can also click **"Load 1000"** in the toolbar to generate bulk demo data and stress-test the virtualized list view.

---

## Architectural Decisions

### Framework & Tooling — Vite + React 19 + TypeScript

**Vite** was chosen for its near-instant cold starts and HMR, which greatly improves developer experience compared to Create React App or Webpack. **React 19** enables access to `flushSync` for synchronous state flushing during drag-and-drop, which is critical for frame-perfect UI updates. **TypeScript** (strict mode) is used throughout to catch shape mismatches early—especially important when dealing with optimistic updates that manually construct task objects.

### State Management — Split between Zustand & TanStack Query

| Concern                         | Library               | Rationale                                                                                                                                                                                       |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server/async data (tasks list)  | **TanStack Query v5** | Handles caching, background refetching, loading/error states, and optimistic updates out of the box. Removes the need for manual `useEffect`-based fetching boilerplate.                        |
| UI state (filters, sort, theme) | **Zustand v5**        | A minimal, boilerplate-free store for synchronous client-only state. Using TanStack Query for filters would add unnecessary complexity; Zustand is perfect for flat, serializable state slices. |

This split means the query cache acts as the source of truth for task data, while Zustand owns the derived filter state. They compose cleanly without circular dependencies.

### Data Fetching — TanStack Query with Optimistic Updates

All CRUD operations (`useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useReorderTasks`) implement **optimistic updates** via `onMutate` / `onError` rollback. This makes the UI feel instantaneous even with the simulated async delays in `task-service.ts`. If the mutation fails, the cache is rolled back to its previous snapshot.

### Styling — Tailwind CSS v4 + shadcn/ui

**Tailwind CSS v4** (via the Vite plugin) provides utility-first styling with zero runtime overhead. **shadcn/ui** (component registry approach) was chosen over a full UI kit like MUI because it gives full access to source code—components are owned by the project and can be styled or forked freely. The design tokens (colors, radius, spacing) live in `index.css` as CSS custom properties, making theme switching straightforward.

`DM Sans` (via `@fontsource-variable/dm-sans`) is used as the primary typeface for a clean, modern feel.

### Performance — TanStack Virtual for Large Lists

When the task count exceeds ~100 items, the Kanban board view becomes unwieldy. A dedicated **List view** powered by `@tanstack/react-virtual` renders only the visible DOM rows (with 5-row overscan), allowing smooth scrolling of 1000+ tasks without layout thrashing.

Drag-and-drop in the list view (`@dnd-kit/sortable`) is integrated on top of the virtualizer. Scroll is locked via `overflowY: hidden` during a drag to prevent scroll-jump artifacts.

### Drag & Drop — `@dnd-kit/core` + `@dnd-kit/sortable`

`dnd-kit` was chosen over `react-beautiful-dnd` because it:

- Is actively maintained and supports React 19
- Uses a sensor abstraction (pointer, keyboard, touch) rather than a fixed drag model
- Works correctly alongside virtualized lists

`rectIntersection` collision detection is used for the Kanban board (better for column-based drop targets), while `closestCenter` is used for the flat sortable list.

### Routing — React Router v7

Filters (search, status, priority, date range) are synced to the URL query string via a `useUrlFilters` hook backed by React Router's `useSearchParams`. This means filter state is bookmarkable and shareable.

### Form Handling & Validation — React Hook Form + Zod

`react-hook-form` handles controlled form state with minimal re-renders. **Zod** provides a single schema that is shared between client validation and TypeScript type inference (`z.infer<typeof taskSchema>`), eliminating the typical dual-maintenance of types + validation rules.

### Component Architecture

```
src/
├── features/
│   ├── tasks/
│   │   ├── components/     # Feature-specific UI (KanbanBoard, TaskCard, FilterBar …)
│   │   └── hooks/          # Data hooks (use-tasks, use-filtered-tasks, use-url-filters)
│   └── layout/
│       └── components/     # Header, ErrorBoundary
├── store/                  # Zustand slices (task-store, theme-store)
├── services/               # task-service (localStorage adapter)
├── components/ui/          # shadcn/ui primitives (Button, Input, Badge …)
├── types/                  # Shared TypeScript types & constants
├── hooks/                  # Generic hooks (use-debounce)
└── providers/              # QueryProvider (TanStack Query root)
```

Heavy dialogs (`TaskFormModal`, `DeleteConfirmDialog`, `VirtualizedTaskList`) are **lazy-loaded** with `React.lazy` + `Suspense` to keep the initial bundle small.

---

## Engineering Trade-Offs

The following simplifications were made due to the 48-hour time constraint:

### 1. `localStorage` instead of a Real Backend

The `task-service.ts` module simulates async latency with `setTimeout` delays but persists data entirely in `localStorage`. This means:

- Data is lost when `localStorage` is cleared
- No multi-tab sync (tabs can diverge)
- No real-time collaboration

A production system would replace `taskService` with REST or GraphQL calls—the TanStack Query layer is already designed to make that swap transparent.

### 2. No Authentication

There is no user login, session management, or per-user data isolation. All data is stored under a single global key.

### 3. No Pagination on the Server Side

`taskService.getAll()` returns all tasks at once. For the demo this is fine (even 1000 tasks are fast to serialize from `localStorage`), but a real backend would need cursor-based or offset pagination and the query layer would need to change to `useInfiniteQuery`.

### 4. Simplified Position Model

Task ordering is stored as an integer `position` field per status column. On reorder, positions are rewritten for the entire affected column. A gap-based ordering strategy (e.g., using floats between items) would reduce the number of writes at the cost of more complex insertion logic.

### 5. No Unit Tests for UI Components

Only utility logic would be covered by unit tests within the time budget. UI component tests (interaction, accessibility assertions) were deferred in favor of building core features first.

### 6. No Offline Support / Service Worker

There is no PWA manifest or service worker. The app requires a network connection to load (even though all runtime data is in `localStorage`).

### 7. Date Picker is UTC-naive

Dates are stored as `YYYY-MM-DD` strings and compared using `new Date()` without timezone normalization. This can cause "off by one day" issues for users in UTC− timezones.

---

## Future Scalability & Roadmap

### Near-term (next sprint)

- **Real backend integration** — Replace `task-service.ts` with a REST/GraphQL adapter. The service layer is already abstracted so the mutation hooks require no changes.
- **User authentication** — Add JWT/session-based auth with a login screen and per-user task isolation.
- **Optimistic UI polish** — Show a ghost card in the target column while a drag-to-different-column mutation is in-flight.
- **Keyboard drag-and-drop** — Extend `dnd-kit` sensor configuration to fully support keyboard-based reordering (WCAG 2.5.3).
- **Date timezone handling** — Normalize all date comparisons to UTC and display in the user's local timezone via `Intl.DateTimeFormat`.

### Medium-term

- **Infinite scroll / server pagination** — Migrate `useTasks` to `useInfiniteQuery` once the backend supports cursor pagination.
- **Real-time collaboration** — Add a WebSocket subscription (or Server-Sent Events) to receive task updates from other users without polling.
- **Assignees & labels** — Extend the `Task` type with `assigneeId[]` and `labelIds[]` fields, add filter UI and avatar display on cards.
- **Subtasks / checklists** — Allow tasks to have nested `subtasks[]`, rendered as a checklist inside the task card.
- **Bulk actions** — Multi-select tasks for bulk status change, priority update, or deletion.
- **Activity log** — Track and display an audit trail (`created by`, `moved from X to Y at T`) per task.

### Long-term

- **Analytics dashboard** — Charts for throughput (tasks completed per week), cycle time, and WIP limits per column.
- **Notifications** — Browser push notifications for upcoming due dates.
- **Native mobile app** — Reuse business logic (services, types) in a React Native shell.
- **Plugin system** — Allow third-party integrations (GitHub Issues sync, Jira import, Slack notifications) via a webhook/integration config screen.
- **AI task suggestions** — Use an LLM to auto-suggest title, priority, and due date based on free-text input.
