import React from 'react';
import { Badge } from './ui/badge';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

const TodoList = ({ todos, isResult = false }) => {
  if (!todos || !Array.isArray(todos)) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-3.5 h-3.5 text-blue-500 text-blue-400" />;
      case 'pending':
      default:
        return <Circle className="w-3.5 h-3.5 text-gray-400 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 bg-green-900/30 text-green-800 text-green-200 border-green-200 border-green-800';
      case 'in_progress':
        return 'bg-blue-100 bg-blue-900/30 text-blue-800 text-blue-200 border-blue-200 border-blue-800';
      case 'pending':
      default:
        return 'bg-gray-100 bg-gray-800 text-gray-600 text-gray-400 border-gray-200 border-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 bg-red-900/30 text-red-700 text-red-300 border-red-200 border-red-800';
      case 'medium':
        return 'bg-yellow-100 bg-yellow-900/30 text-yellow-700 text-yellow-300 border-yellow-200 border-yellow-800';
      case 'low':
      default:
        return 'bg-gray-100 bg-gray-800 text-gray-600 text-gray-400 border-gray-200 border-gray-700';
    }
  };

  return (
    <div className="space-y-1.5">
      {isResult && (
        <div className="text-xs font-medium text-gray-600 text-gray-400 mb-1.5">
          Todo List ({todos.length} {todos.length === 1 ? 'item' : 'items'})
        </div>
      )}

      {todos.map((todo, index) => (
        <div
          key={todo.id || `todo-${index}`}
          className="flex items-start gap-2 p-2 bg-white bg-gray-800 border border-gray-200 border-gray-700 rounded transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(todo.status)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <p className={`text-xs font-medium ${todo.status === 'completed' ? 'line-through text-gray-500 text-gray-400' : 'text-gray-900 text-gray-100'}`}>
                {todo.content}
              </p>

              <div className="flex gap-1 flex-shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-px ${getPriorityColor(todo.priority)}`}
                >
                  {todo.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-px ${getStatusColor(todo.status)}`}
                >
                  {todo.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TodoList;
