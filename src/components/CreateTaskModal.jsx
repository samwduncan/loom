import React from 'react';
import { X, Sparkles } from 'lucide-react';

const CreateTaskModal = ({ currentProject, onClose, onTaskCreated }) => {

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised rounded-lg shadow-xl w-full max-w-md border border-border/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-status-info/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-status-info" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Create AI-Generated Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-elevated"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI-First Approach */}
          <div className="bg-status-info/10 rounded-lg p-4 border border-primary">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-status-info/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-status-info" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">
                  Pro Tip: Ask Claude Code Directly!
                </h4>
                <p className="text-sm text-foreground-secondary mb-3">
                  You can simply ask Claude Code in the chat to create tasks for you.
                  The AI assistant will automatically generate detailed tasks with research-backed insights.
                </p>

                <div className="bg-surface-raised rounded border border-border/10 p-3 mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Example:</p>
                  <p className="text-sm text-foreground font-mono">
                    "Please add a new task to implement user profile image uploads using Cloudinary, research the best approach."
                  </p>
                </div>

                <p className="text-xs text-foreground-secondary">
                  <strong>This runs:</strong> <code className="bg-status-info/10 px-1 rounded text-xs">
                    task-master add-task --prompt="Implement user profile image uploads using Cloudinary" --research
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Learn More Link */}
          <div className="text-center pt-4 border-t border-border/10">
            <p className="text-sm text-muted-foreground mb-3">
              For more examples and advanced usage patterns:
            </p>
            <a
              href="https://github.com/eyaltoledano/claude-task-master/blob/main/docs/examples.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-status-info hover:text-primary underline font-medium"
            >
              View TaskMaster Documentation →
            </a>
          </div>

          {/* Footer */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-elevated border border-border/10 rounded-lg hover:bg-muted transition-colors"
            >
              Got it, I'll ask Claude Code directly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
