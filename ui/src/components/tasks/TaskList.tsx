import { useState } from 'react';
import { useTasks, useCreateTask, useMoveTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Plus, ListTodo } from 'lucide-react';
import { CreateTaskDialog } from '../dialogs/CreateTaskDialog';
import type { TaskStatus } from '../../types/entities';
import { formatDate, isOverdue } from '../../utils/date';
import type { TaskFilters } from '../../types/filters';

export const TaskList = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  
  const { data: tasks, isLoading, error } = useTasks(filters);
  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const moveTask = useMoveTask();

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await moveTask.mutateAsync({ taskId, status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading tasks</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tasks</h2>
          <p className="mt-2 text-gray-600">Manage your tasks and to-dos</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                value={filters.projectId || ''}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value || undefined })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Projects</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus || undefined })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value as any || undefined })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => {
            const project = projects?.find((p) => p.id === task.projectId);
            const overdueFlag = task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed';

            return (
              <Card key={task.id} className={overdueFlag ? 'border-red-300' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {overdueFlag && (
                          <span className="text-xs text-red-600 font-medium">Overdue</span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                        {project && (
                          <span className="text-gray-600">
                            📁 {project.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-gray-600">
                            📅 {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-sm rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ListTodo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first task'}
              </p>
              {Object.keys(filters).length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={async (data) => {
          await createTask.mutateAsync(data);
          setIsCreateDialogOpen(false);
        }}
      />
    </div>
  );
};
