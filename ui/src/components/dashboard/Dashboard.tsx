import { useMemo } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { CheckCircle, Clock, ListTodo, AlertCircle } from 'lucide-react';
import { isOverdue } from '../../utils/date';

export const Dashboard = () => {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, todo: 0, pending: 0, completed: 0, overdue: 0 };

    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const overdue = tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed').length;

    return { total, todo, pending, completed, overdue };
  }, [tasks]);

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">Overview of your projects and tasks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500">
              {projects?.length || 0} projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-gray-500">
              {stats.todo} to do
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-gray-500">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-500">{project.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No projects yet. Create one to get started!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500">
                        {task.status} • {task.priority || 'no priority'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No tasks yet. Create one to get started!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
