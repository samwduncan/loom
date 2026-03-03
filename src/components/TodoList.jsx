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
        return <CheckCircle2 className="w-3.5 h-3.5 text-status-connected" />;
      case 'in_progress':
        return <Clock className="w-3.5 h-3.5 text-status-info" />;
      case 'pending':
      default:
        return <Circle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-status-connected/10 text-status-connected border-status-connected';
      case 'in_progress':
        return 'bg-status-info/10 text-status-info border-primary';
      case 'pending':
      default:
        return 'bg-surface-elevated text-muted-foreground border-border/10';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-status-error/10 text-status-error border-status-error';
      case 'medium':
        return 'bg-status-reconnecting/10 text-status-reconnecting border-status-reconnecting';
      case 'low':
      default:
        return 'bg-surface-elevated text-muted-foreground border-border/10';
    }
  };

  return (
    <div className="space-y-1.5">
      {isResult && (
        <div className="text-xs font-medium text-muted-foreground mb-1.5">
          Todo List ({todos.length} {todos.length === 1 ? 'item' : 'items'})
        </div>
      )}

      {todos.map((todo, index) => (
        <div
          key={todo.id || `todo-${index}`}
          className="flex items-start gap-2 p-2 bg-surface-raised border border-border/10 rounded transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(todo.status)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <p className={`text-xs font-medium ${todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
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
