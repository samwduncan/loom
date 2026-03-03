import React, { useState } from 'react';
import { X, Flag, User, ArrowRight, CheckCircle, Circle, AlertCircle, Pause, Edit, Save, Copy, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import TaskIndicator from './TaskIndicator';
import { api } from '../utils/api';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import { copyTextToClipboard } from '../utils/clipboard';

const TaskDetail = ({
  task,
  onClose,
  onEdit,
  onStatusChange,
  onTaskClick,
  isOpen = true,
  className = ''
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState(task || {});
  const [isSaving, setIsSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTestStrategy, setShowTestStrategy] = useState(false);
  const { currentProject, refreshTasks } = useTaskMaster();

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!currentProject) return;

    setIsSaving(true);
    try {
      // Only include changed fields
      const updates = {};
      if (editedTask.title !== task.title) updates.title = editedTask.title;
      if (editedTask.description !== task.description) updates.description = editedTask.description;
      if (editedTask.details !== task.details) updates.details = editedTask.details;

      if (Object.keys(updates).length > 0) {
        const response = await api.taskmaster.updateTask(currentProject.name, task.id, updates);

        if (response.ok) {
          // Refresh tasks to get updated data
          refreshTasks?.();
          onEdit?.(editedTask);
          setEditMode(false);
        } else {
          const error = await response.json();
          console.error('Failed to update task:', error);
          alert(`Failed to update task: ${error.message}`);
        }
      } else {
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!currentProject) return;

    try {
      const response = await api.taskmaster.updateTask(currentProject.name, task.id, { status: newStatus });

      if (response.ok) {
        refreshTasks?.();
        onStatusChange?.(task.id, newStatus);
      } else {
        const error = await response.json();
        console.error('Failed to update task status:', error);
        alert(`Failed to update task status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status. Please try again.');
    }
  };

  const copyTaskId = () => {
    copyTextToClipboard(task.id.toString());
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'done':
        return { icon: CheckCircle, color: 'text-status-connected', bg: 'bg-status-connected/10' };
      case 'in-progress':
        return { icon: Clock, color: 'text-status-info', bg: 'bg-status-info/10' };
      case 'review':
        return { icon: AlertCircle, color: 'text-status-reconnecting', bg: 'bg-status-reconnecting/10' };
      case 'deferred':
        return { icon: Pause, color: 'text-muted-foreground', bg: 'bg-surface-raised' };
      case 'cancelled':
        return { icon: X, color: 'text-status-error', bg: 'bg-status-error/10' };
      default:
        return { icon: Circle, color: 'text-muted-foreground', bg: 'bg-surface-raised' };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;


  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-status-error bg-status-error/10';
      case 'medium': return 'text-status-reconnecting bg-status-reconnecting/10';
      case 'low': return 'text-status-info bg-status-info/10';
      default: return 'text-muted-foreground bg-surface-raised';
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
    { value: 'deferred', label: 'Deferred' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="modal-backdrop fixed inset-0 flex items-center justify-center z-[100] md:p-4 bg-black/50">
      <div className={cn(
        'bg-surface-base border border-border/10 md:rounded-lg shadow-xl',
        'w-full md:max-w-4xl h-full md:h-[90vh] flex flex-col',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <StatusIcon className={cn('w-6 h-6', statusConfig.color)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={copyTaskId}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-surface-raised text-muted-foreground rounded hover:bg-surface-elevated transition-colors"
                  title="Click to copy task ID"
                >
                  <span>Task {task.id}</span>
                  <Copy className="w-3 h-3" />
                </button>
                {task.parentId && (
                  <span className="text-xs text-muted-foreground">
                    Subtask of Task {task.parentId}
                  </span>
                )}
              </div>
              {editMode ? (
                <input
                  type="text"
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="w-full text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none text-foreground"
                  placeholder="Task title"
                />
              ) : (
                <h1 className="text-lg md:text-xl font-semibold text-foreground line-clamp-2">
                  {task.title}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-2 text-status-connected hover:text-status-connected/80 hover:bg-status-connected/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isSaving ? "Saving..." : "Save changes"}
                >
                  <Save className={cn("w-5 h-5", isSaving && "animate-spin")} />
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditedTask(task);
                  }}
                  disabled={isSaving}
                  className="p-2 text-muted-foreground hover:text-foreground-secondary hover:bg-surface-raised rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel editing"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 text-muted-foreground hover:text-foreground-secondary hover:bg-surface-raised rounded-md transition-colors"
                title="Edit task"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground-secondary hover:bg-surface-raised rounded-md transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-h-0">
          {/* Status and Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-secondary">Status</label>
              <div className={cn(
                'w-full px-3 py-2 rounded-md border border-border/10',
                statusConfig.bg,
                statusConfig.color
              )}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  <span className="font-medium capitalize">
                    {statusOptions.find(option => option.value === task.status)?.label || task.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-secondary">Priority</label>
              <div className={cn(
                'px-3 py-2 rounded-md text-sm font-medium capitalize',
                getPriorityColor(task.priority)
              )}>
                <Flag className="w-4 h-4 inline mr-2" />
                {task.priority || 'Not set'}
              </div>
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground-secondary">Dependencies</label>
              {task.dependencies && task.dependencies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {task.dependencies.map(depId => (
                    <button
                      key={depId}
                      onClick={() => onTaskClick && onTaskClick({ id: depId })}
                      className="px-2 py-1 bg-status-info/10 text-status-info rounded text-sm hover:bg-status-info/20 transition-colors cursor-pointer disabled:cursor-default disabled:opacity-50"
                      disabled={!onTaskClick}
                      title={onTaskClick ? `Click to view Task ${depId}` : `Task ${depId}`}
                    >
                      <ArrowRight className="w-3 h-3 inline mr-1" />
                      {depId}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">No dependencies</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-secondary">Description</label>
            {editMode ? (
              <textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border/10 rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-surface-raised text-foreground"
                placeholder="Task description"
              />
            ) : (
              <p className="text-foreground-secondary whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Implementation Details */}
          {task.details && (
            <div className="border border-border/10 rounded-lg">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-raised transition-colors"
              >
                <span className="text-sm font-medium text-foreground-secondary">
                  Implementation Details
                </span>
                {showDetails ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {showDetails && (
                <div className="border-t border-border/10 p-4">
                  {editMode ? (
                    <textarea
                      value={editedTask.details || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, details: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-border/10 rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-surface-raised text-foreground"
                      placeholder="Implementation details"
                    />
                  ) : (
                    <div className="bg-surface-raised rounded-md p-4">
                      <p className="text-foreground-secondary whitespace-pre-wrap">
                        {task.details}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Test Strategy */}
          {task.testStrategy && (
            <div className="border border-border/10 rounded-lg">
              <button
                onClick={() => setShowTestStrategy(!showTestStrategy)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-raised transition-colors"
              >
                <span className="text-sm font-medium text-foreground-secondary">
                  Test Strategy
                </span>
                {showTestStrategy ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {showTestStrategy && (
                <div className="border-t border-border/10 p-4">
                  <div className="bg-status-info/10 rounded-md p-4">
                    <p className="text-foreground-secondary whitespace-pre-wrap">
                      {task.testStrategy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground-secondary">
                Subtasks ({task.subtasks.length})
              </label>
              <div className="space-y-2">
                {task.subtasks.map(subtask => {
                  const subtaskConfig = getStatusConfig(subtask.status);
                  const SubtaskIcon = subtaskConfig.icon;
                  return (
                    <div key={subtask.id} className="flex items-center gap-3 p-3 bg-surface-raised rounded-md">
                      <SubtaskIcon className={cn('w-4 h-4', subtaskConfig.color)} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {subtask.title}
                        </h4>
                        {subtask.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {subtask.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {subtask.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 md:p-6 border-t border-border/10 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Task ID: {task.id}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-foreground-secondary bg-surface-raised hover:bg-surface-elevated rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
