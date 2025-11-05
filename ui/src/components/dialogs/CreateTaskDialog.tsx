import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import type { CreateTaskInput } from '../../types/api';
import { useProjects } from '../../hooks/useProjects';

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  defaultProjectId?: string;
}

export const CreateTaskDialog = ({ isOpen, onClose, onSubmit, defaultProjectId }: CreateTaskDialogProps) => {
  const { data: projects } = useProjects();
  const [formData, setFormData] = useState<CreateTaskInput>({
    projectId: defaultProjectId || '',
    title: '',
    description: '',
    priority: undefined,
    dueDate: '',
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && defaultProjectId) {
      setFormData((prev) => ({ ...prev, projectId: defaultProjectId }));
    }
  }, [isOpen, defaultProjectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.projectId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags?.trim() || undefined,
      });
      setFormData({
        projectId: defaultProjectId || '',
        title: '',
        description: '',
        priority: undefined,
        dueDate: '',
        tags: '',
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              id="project"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a project</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
              maxLength={200}
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority || ''}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated tags (e.g., urgent, backend)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim() || !formData.projectId}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
