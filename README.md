# Todo MCP Server

A comprehensive task and project management server implementing the Model Context Protocol (MCP) with Redis storage, enhanced validation, and comprehensive testing.

## Features

### Core Functionality

- **Project Management**: Create, list, and archive projects with automatic task archiving
- **Task Management**: Full CRUD operations with status transitions (`todo`, `pending`, `completed`, `archived`)
- **Hierarchical Tasks**: Support for parent-child task relationships
- **Advanced Filtering**: Filter tasks by project, status, priority, tags, and due dates
- **Sorting Options**: Sort tasks by creation date, due date, priority, or title

### Data Validation & Security

- **Input Sanitization**: Automatic trimming and normalization of all text inputs
- **Schema Validation**: Comprehensive Zod schemas with custom error messages
- **Type Safety**: Full TypeScript implementation with strict typing
- **Authentication**: Optional basic authentication for secure access

### Testing & Quality

- **Unit Tests**: Comprehensive test coverage for all services and validation utilities
- **Bun Test Framework**: Fast, modern testing with excellent TypeScript support
- **Mocked Dependencies**: Isolated testing with proper repository mocking

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.3.0+)
- Redis instance (local or remote)

## Configuration

| Variable                  | Description                       | Default                  |
| ------------------------- | --------------------------------- | ------------------------ |
| `REDIS_URL`               | Redis connection string           | `redis://127.0.0.1:6379` |
| `MCP_BASIC_AUTH_USER`     | Username for basic authentication | _unset_                  |
| `MCP_BASIC_AUTH_PASSWORD` | Password for basic authentication | _unset_                  |
| `MCP_SERVER_NAME`         | Server name announced to clients  | `todo-mcp`               |
| `MCP_SERVER_VERSION`      | Semantic version string           | `0.1.0`                  |

Authentication is enforced only when both `MCP_BASIC_AUTH_USER` and `MCP_BASIC_AUTH_PASSWORD` are provided.

## Installation

```bash
bun install
```

## Running the Server

```bash
# Basic setup
bun run src/index.ts

# With authentication
MCP_BASIC_AUTH_USER=alice \
MCP_BASIC_AUTH_PASSWORD=secret \
bun run src/index.ts

# Development with watch mode
bun run dev
```

## Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

## API Reference

### Projects

#### `create_project`

Create a new project.

**Parameters:**

- `name` (string, required): Project name (1-100 characters, trimmed)
- `description` (string, optional): Project description (trimmed)

**Example:**

```json
{
  "name": "My Project",
  "description": "A sample project for task management"
}
```

#### `list_projects`

List projects with optional filtering.

**Parameters:**

- `includeArchived` (boolean, optional): Include archived projects (default: false)

**Example:**

```json
{
  "includeArchived": true
}
```

#### `archive_project`

Archive a project and all its tasks.

**Parameters:**

- `projectId` (string, required): Project identifier

**Example:**

```json
{
  "projectId": "my-project"
}
```

### Tasks

#### `create_task`

Create a new task.

**Parameters:**

- `projectId` (string, required): Parent project ID
- `title` (string, required): Task title (1-200 characters, trimmed)
- `description` (string, optional): Task description (trimmed)
- `priority` (string, optional): Priority level (`low`, `medium`, `high`)
- `dueDate` (string, optional): ISO 8601 date string
- `tags` (string, optional): Comma-separated tags
- `parentTaskId` (string, optional): Parent task ID for subtasks

**Example:**

```json
{
  "projectId": "my-project",
  "title": "Implement user authentication",
  "description": "Add login and registration functionality",
  "priority": "high",
  "dueDate": "2025-12-31T23:59:59Z",
  "tags": "backend,security,urgent"
}
```

#### `list_tasks`

List tasks with advanced filtering and sorting.

**Parameters:**

- `projectId` (string, optional): Filter by project
- `status` (string, optional): Filter by status (`todo`, `pending`, `completed`, `archived`)
- `priority` (string, optional): Filter by priority (`low`, `medium`, `high`)
- `tags` (array, optional): Filter by tags
- `hasSubtasks` (boolean, optional): Filter tasks with/without subtasks
- `includeArchived` (boolean, optional): Include archived tasks (default: false)
- `sortBy` (string, optional): Sort field (`createdAt`, `dueDate`, `priority`, `title`)
- `order` (string, optional): Sort order (`asc`, `desc`)

**Example:**

```json
{
  "projectId": "my-project",
  "status": "todo",
  "priority": "high",
  "sortBy": "dueDate",
  "order": "asc"
}
```

#### `update_task`

Update an existing task.

**Parameters:**

- `taskId` (string, required): Task identifier
- `title` (string, optional): New title
- `description` (string, optional): New description
- `priority` (string, optional): New priority
- `dueDate` (string, optional): New due date
- `tags` (string, optional): New tags

**Example:**

```json
{
  "taskId": "task-123",
  "title": "Updated task title",
  "priority": "medium"
}
```

#### `move_task`

Change task status.

**Parameters:**

- `taskId` (string, required): Task identifier
- `status` (string, required): New status (`todo`, `pending`, `completed`, `archived`)

**Example:**

```json
{
  "taskId": "task-123",
  "status": "completed"
}
```

#### `archive_task`

Archive a task.

**Parameters:**

- `taskId` (string, required): Task identifier

**Example:**

```json
{
  "taskId": "task-123"
}
```

## Data Validation

The server includes comprehensive input validation:

- **Text Fields**: Automatic trimming and normalization
- **Project Names**: 1-100 characters
- **Task Titles**: 1-200 characters
- **Tags**: Lowercase, deduplicated, max 20 characters each
- **Dates**: ISO 8601 format validation
- **Priorities**: `low`, `medium`, `high`
- **Statuses**: `todo`, `pending`, `completed`, `archived`

## Development

### Project Structure

```text
src/
├── config.ts          # Server configuration
├── index.ts           # Main server entry point
├── types.ts           # TypeScript type definitions
├── validation.ts      # Zod schemas and validation utilities
├── auth/              # Authentication middleware
├── repositories/      # Data access layer
├── services/          # Business logic layer
├── storage/           # Redis client configuration
├── tools/             # MCP tool implementations
└── prompts.ts         # MCP prompt definitions

test/                  # Unit tests
├── validation.test.ts # Validation utility tests
├── taskService.test.ts # TaskService unit tests
└── projectService.test.ts # ProjectService unit tests
```

### Adding New Features

1. Define types in `types.ts`
2. Add validation schemas in `validation.ts`
3. Implement repository methods in appropriate repository
4. Add business logic to service layer
5. Create MCP tools in `tools/`
6. Add comprehensive unit tests

### Testing Strategy

- **Unit Tests**: Test individual functions and methods in isolation
- **Mock Dependencies**: Use Bun's mock utilities for external dependencies
- **Validation Coverage**: Test all validation schemas and edge cases
- **Error Scenarios**: Test error conditions and exception handling

## Contributing

1. Follow TypeScript strict mode guidelines
2. Add unit tests for new functionality
3. Update documentation for API changes
4. Ensure all tests pass before submitting

## License

This project is open source. See LICENSE file for details.
