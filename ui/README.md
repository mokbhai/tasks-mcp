# Task Manager UI

A modern, responsive web interface for the Todo MCP Server.

## Features

- **Dashboard**: Overview of projects and tasks with statistics
- **Project Management**: Create and manage projects
- **Task Management**: Create, update, and organize tasks with filters
- **Status Management**: Update task status with ease
- **Priority & Tags**: Organize tasks by priority and custom tags
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **TanStack Query** (React Query) for server state management
- **React Hook Form** + **Zod** for form handling and validation
- **Lucide React** for icons
- **date-fns** for date formatting

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- Running instance of the Todo MCP Server

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
VITE_MCP_SERVER_URL=http://localhost:3000
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Features

### Dashboard

- View statistics (total, pending, completed, overdue tasks)
- Quick overview of recent projects and tasks
- Visual indicators for task status

### Projects

- Create new projects with name and description
- View all projects in a grid layout

### Tasks

- Create tasks with title, description, priority, due date, tags
- Filter tasks by project, status, and priority
- Update task status
- View overdue tasks with visual indicators

## Roadmap

See [../docs/UI_PLAN.md](../docs/UI_PLAN.md) for the complete implementation plan.
