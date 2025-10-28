import type { Priority, TaskStatus } from '../../types/entities';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    todo: { label: 'To Do', className: 'bg-gray-100 text-gray-800' },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
    archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600' },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority?: Priority;
  className?: string;
}

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  if (!priority) return null;

  const priorityConfig = {
    low: { label: 'Low', className: 'bg-blue-100 text-blue-800' },
    medium: { label: 'Medium', className: 'bg-orange-100 text-orange-800' },
    high: { label: 'High', className: 'bg-red-100 text-red-800' },
  };

  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
