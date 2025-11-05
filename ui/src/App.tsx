import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/common/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProjectList } from './components/projects/ProjectList';
import { TaskList } from './components/tasks/TaskList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type View = 'dashboard' | 'projects' | 'tasks';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Simple hash-based routing
  const handleNavigation = (view: View) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  // Listen to hash changes
  window.onhashchange = () => {
    const hash = window.location.hash.slice(1) as View;
    if (hash === 'dashboard' || hash === 'projects' || hash === 'tasks') {
      setCurrentView(hash);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        {/* Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => handleNavigation('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tasks
            </button>
          </nav>
        </div>

        {/* Content */}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'projects' && <ProjectList />}
        {currentView === 'tasks' && <TaskList />}
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
