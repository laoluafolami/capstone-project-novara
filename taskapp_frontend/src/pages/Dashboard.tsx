import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Task, CreateTaskInput, Status } from '../types/task';
import { taskApi } from '../services/api';
import { KanbanColumn } from '../components/KanbanColumn';
import { TaskForm } from '../components/TaskForm';
import { LayoutDashboard, Plus, RefreshCw, LogOut } from 'lucide-react';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [initialStatus, setInitialStatus] = useState<Status>('todo');
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const handleCreateTask = async (taskInput: CreateTaskInput) => {
    try {
      const newTask = await taskApi.createTask(taskInput);
      setTasks((prev) => [newTask, ...prev]);
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskApi.deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: Status) => {
    try {
      const updatedTask = await taskApi.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleAddTask = (status: Status) => {
    setInitialStatus(status);
    setShowForm(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const todoTasks = tasks.filter((task) => task.status === 'todo');
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress');
  const doneTasks = tasks.filter((task) => task.status === 'done');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Task Manager</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadTasks}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Refresh tasks"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleAddTask('todo')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                New Task
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={todoTasks}
            onDelete={handleDeleteTask}
            onAddTask={handleAddTask}
            onDrop={handleUpdateTaskStatus}
          />
          <KanbanColumn
            title="In Progress"
            status="in_progress"
            tasks={inProgressTasks}
            onDelete={handleDeleteTask}
            onAddTask={handleAddTask}
            onDrop={handleUpdateTaskStatus}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tasks={doneTasks}
            onDelete={handleDeleteTask}
            onAddTask={handleAddTask}
            onDrop={handleUpdateTaskStatus}
          />
        </div>
      </main>

      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onClose={() => setShowForm(false)}
          initialStatus={initialStatus}
        />
      )}
    </div>
  );
}
