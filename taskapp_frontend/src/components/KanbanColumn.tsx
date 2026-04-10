import { Task, Status } from '../types/task';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  status: Status;
  tasks: Task[];
  onDelete: (id: number) => void;
  onAddTask: (status: Status) => void;
  onDrop: (taskId: number, newStatus: Status) => void;
}

const statusColors: Record<Status, string> = {
  todo: 'bg-gray-100 border-gray-300',
  in_progress: 'bg-blue-50 border-blue-300',
  done: 'bg-green-50 border-green-300',
};

export function KanbanColumn({
  title,
  status,
  tasks,
  onDelete,
  onAddTask,
  onDrop,
}: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    if (taskId) {
      onDrop(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  return (
    <div className={`flex-1 min-w-0 rounded-lg border-2 ${statusColors[status]} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-white rounded-full border border-gray-300">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Add task"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="space-y-3 min-h-[200px]"
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            className="cursor-move"
          >
            <TaskCard task={task} onDelete={onDelete} />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
