import { CheckSquare } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
          </div>
          <nav className="flex space-x-4">
            <a
              href="#dashboard"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="#projects"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Projects
            </a>
            <a
              href="#tasks"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Tasks
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
