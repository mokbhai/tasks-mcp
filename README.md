# Todo MCP Server

Task and project management server implementing the Model Context Protocol (MCP) with Redis storage and Bun/Node runtime.

## Features
- Project creation and listing with optional archived visibility.
- Task creation, listing, and status transitions (`todo`, `pending`, `completed`, `archived`).
- Automatic archiving of all tasks when a project is archived.
- Single-user basic authentication via configurable credentials.
- Redis-backed storage.

## Prerequisites
- [Bun](https://bun.sh) runtime.
- Redis instance (local or remote).

## Configuration
Set the following environment variables as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `REDIS_URL` | Redis connection string | `redis://127.0.0.1:6379` |
| `MCP_BASIC_AUTH_USER` | Username for basic authentication | _unset_ |
| `MCP_BASIC_AUTH_PASSWORD` | Password for basic authentication | _unset_ |
| `MCP_SERVER_NAME` | Server name announced to clients | `todo-mcp` |
| `MCP_SERVER_VERSION` | Semantic version string | `0.1.0` |

Authentication is enforced only when both `MCP_BASIC_AUTH_USER` and `MCP_BASIC_AUTH_PASSWORD` are provided. Clients should include the HTTP `Authorization` header encoded for Basic auth (e.g. `Basic base64(user:password)`) in MCP metadata when connecting.

## Installation
Dependencies are declared in `package.json`. Install them with Bun:

```bash
bun install
```

## Running the server

```bash
MCP_BASIC_AUTH_USER=alice \
MCP_BASIC_AUTH_PASSWORD=secret \
REDIS_URL=redis://127.0.0.1:6379 \
bun run src/index.ts
```

The server runs over STDIO by default. Refer to your MCP client documentation for how to launch or register a custom server.

## Available tools

| Tool | Description | Input fields |
| --- | --- | --- |
| `create_project` | Create a new project | `name` (string), `description?` (string) |
| `list_projects` | List projects, optionally including archived ones | `includeArchived?` or `archive?` (boolean) |
| `archive_project` | Archive a project and all of its tasks | `projectId` (string) |
| `create_task` | Create a task under a project | `projectId` (string), `title` (string), `description?` (string) |
| `list_tasks` | List tasks optionally by project/status | `projectId?` (string), `status?` (`todo`/`pending`/`completed`/`archived`), `includeArchived?` or `archive?` (boolean) |
| `move_task` | Move a task across workflow stages | `taskId` (string), `status` (`todo`/`pending`/`completed`/`archived`) |
| `archive_task` | Archive an individual task | `taskId` (string) |

Archived projects and tasks are hidden unless `includeArchived: true` (or `archive: true`) is supplied.

## Development tips
- Use `bun run --watch src/index.ts` for live reload during development.
- Ensure Redis is available before launching; connection errors are logged to the console.
- When extending the schema, prefer adding new tool methods rather than overloading existing ones for clarity.
