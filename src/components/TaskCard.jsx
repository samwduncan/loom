import React from 'react';
import { Clock, CheckCircle, Circle, AlertCircle, Pause, X, ArrowRight, ChevronUp, Minus, Flag } from 'lucide-react';
import { cn } from '../lib/utils';
import Tooltip from './Tooltip';

const TaskCard = ({
  task,
  onClick,
  showParent = false,
  className = ''
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'done':
        return {
          icon: CheckCircle,
          bgColor: 'bg-status-connected/10',
          borderColor: 'border-status-connected',
          iconColor: 'text-status-connected',
          textColor: 'text-status-connected',
          statusText: 'Done'
        };

      case 'in-progress':
        return {
          icon: Clock,
          bgColor: 'bg-status-info/10',
          borderColor: 'border-primary',
          iconColor: 'text-status-info',
          textColor: 'text-status-info',
          statusText: 'In Progress'
        };

      case 'review':
        return {
          icon: AlertCircle,
          bgColor: 'bg-status-reconnecting/10',
          borderColor: 'border-status-reconnecting',
          iconColor: 'text-status-reconnecting',
          textColor: 'text-status-reconnecting',
          statusText: 'Review'
        };

      case 'deferred':
        return {
          icon: Pause,
          bgColor: 'bg-surface-raised',
          borderColor: 'border-border/10',
          iconColor: 'text-muted-foreground',
          textColor: 'text-foreground-secondary',
          statusText: 'Deferred'
        };

      case 'cancelled':
        return {
          icon: X,
          bgColor: 'bg-status-error/10',
          borderColor: 'border-status-error',
          iconColor: 'text-status-error',
          textColor: 'text-status-error',
          statusText: 'Cancelled'
        };

      case 'pending':
      default:
        return {
          icon: Circle,
          bgColor: 'bg-surface-raised',
          borderColor: 'border-border/10',
          iconColor: 'text-muted-foreground',
          textColor: 'text-foreground-secondary',
          statusText: 'Pending'
        };
    }
  };

  const config = getStatusConfig(task.status);
  const Icon = config.icon;

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <Tooltip content="High Priority">
            <div className="w-4 h-4 bg-status-error/10 rounded flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-status-error" />
            </div>
          </Tooltip>
        );
      case 'medium':
        return (
          <Tooltip content="Medium Priority">
            <div className="w-4 h-4 bg-status-reconnecting/10 rounded flex items-center justify-center">
              <Minus className="w-2.5 h-2.5 text-status-reconnecting" />
            </div>
          </Tooltip>
        );
      case 'low':
        return (
          <Tooltip content="Low Priority">
            <div className="w-4 h-4 bg-status-info/10 rounded flex items-center justify-center">
              <Circle className="w-1.5 h-1.5 text-status-info fill-current" />
            </div>
          </Tooltip>
        );
      default:
        return (
          <Tooltip content="No Priority Set">
            <div className="w-4 h-4 bg-surface-elevated rounded flex items-center justify-center">
              <Circle className="w-1.5 h-1.5 text-muted-foreground" />
            </div>
          </Tooltip>
        );
    }
  };

  return (
    <div
      className={cn(
        'bg-surface-raised rounded-lg border border-border/10',
        'hover:shadow-md hover:border-primary transition-all duration-200 cursor-pointer',
        'p-3 space-y-3',
        onClick && 'hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
    >
      {/* Header with Task ID, Title, and Priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Task ID and Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Tooltip content={`Task ID: ${task.id}`}>
              <span className="text-xs font-mono text-muted-foreground bg-surface-elevated px-2 py-0.5 rounded">
                {task.id}
              </span>
            </Tooltip>
          </div>
          <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
            {task.title}
          </h3>
          {showParent && task.parentId && (
            <span className="text-xs text-muted-foreground font-medium">
              Task {task.parentId}
            </span>
          )}
        </div>

        {/* Priority Icon */}
        <div className="flex-shrink-0">
          {getPriorityIcon(task.priority)}
        </div>
      </div>

      {/* Footer with Dependencies and Status */}
      <div className="flex items-center justify-between">
        {/* Dependencies */}
        <div className="flex items-center">
          {task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0 && (
            <Tooltip content={`Depends on: ${task.dependencies.map(dep => `Task ${dep}`).join(', ')}`}>
              <div className="flex items-center gap-1 text-xs text-status-reconnecting">
                <ArrowRight className="w-3 h-3" />
                <span>Depends on: {task.dependencies.join(', ')}</span>
              </div>
            </Tooltip>
          )}
        </div>

        {/* Status Badge */}
        <Tooltip content={`Status: ${config.statusText}`}>
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', config.iconColor.replace('text-', 'bg-'))} />
            <span className={cn('text-xs font-medium', config.textColor)}>
              {config.statusText}
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Subtask Progress (if applicable) */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="ml-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Progress:</span>
            <Tooltip content={`${task.subtasks.filter(st => st.status === 'done').length} of ${task.subtasks.length} subtasks completed`}>
              <div className="flex-1 bg-surface-elevated rounded-full h-1.5">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    task.status === 'done' ? 'bg-status-connected' : 'bg-primary'
                  )}
                  style={{
                    width: `${Math.round((task.subtasks.filter(st => st.status === 'done').length / task.subtasks.length) * 100)}%`
                  }}
                />
              </div>
            </Tooltip>
            <Tooltip content={`${task.subtasks.filter(st => st.status === 'done').length} completed, ${task.subtasks.filter(st => st.status === 'pending').length} pending, ${task.subtasks.filter(st => st.status === 'in-progress').length} in progress`}>
              <span className="text-xs text-muted-foreground">
                {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length}
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
