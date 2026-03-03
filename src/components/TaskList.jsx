import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, List, Grid, ChevronDown, Columns, Plus, Settings, Terminal, FileText, HelpCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import Shell from './shell/view/Shell';
import { api } from '../utils/api';

const TaskList = ({
  tasks = [],
  onTaskClick,
  className = '',
  showParentTasks = false,
  defaultView = 'kanban', // 'list', 'grid', or 'kanban'
  currentProject,
  onTaskCreated,
  onShowPRDEditor,
  existingPRDs = [],
  onRefreshPRDs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id'); // 'id', 'title', 'status', 'priority', 'updated'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [viewMode, setViewMode] = useState(defaultView);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCLI, setShowCLI] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [isTaskMasterComplete, setIsTaskMasterComplete] = useState(false);
  const [showPRDDropdown, setShowPRDDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { projectTaskMaster, refreshProjects, refreshTasks, setCurrentProject } = useTaskMaster();

  // Close PRD dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showPRDDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowPRDDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPRDDropdown]);

  const loadPRDOptions = async (prd, closeDropdown = false) => {
    if (!currentProject) {
      return;
    }

    try {
      const response = await api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}/${encodeURIComponent(prd.name)}`);
      if (response.ok) {
        const prdData = await response.json();
        onShowPRDEditor?.({
          name: prd.name,
          content: prdData.content,
          isExisting: true
        });
        if (closeDropdown) {
          setShowPRDDropdown(false);
        }
      } else {
        console.error('Failed to load PRD:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading PRD:', error);
    }
  };

  // Get unique status values from tasks
  const statuses = useMemo(() => {
    const statusSet = new Set(tasks.map(task => task.status).filter(Boolean));
    return Array.from(statusSet).sort();
  }, [tasks]);

  // Get unique priority values from tasks
  const priorities = useMemo(() => {
    const prioritySet = new Set(tasks.map(task => task.priority).filter(Boolean));
    return Array.from(prioritySet).sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.id.toString().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          // Custom status ordering: pending, in-progress, done, blocked, deferred, cancelled
          const statusOrder = { pending: 1, 'in-progress': 2, done: 3, blocked: 4, deferred: 5, cancelled: 6 };
          aVal = statusOrder[a.status] || 99;
          bVal = statusOrder[b.status] || 99;
          break;
        case 'priority':
          // Custom priority ordering: high should be sorted first in descending
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'updated':
          aVal = new Date(a.updatedAt || a.createdAt || 0);
          bVal = new Date(b.updatedAt || b.createdAt || 0);
          break;
        case 'id':
        default:
          // Handle numeric and dotted IDs (1, 1.1, 1.2, 2, 2.1, etc.)
          const parseId = (id) => {
            const parts = id.toString().split('.');
            return parts.map(part => parseInt(part, 10));
          };

          const aIds = parseId(a.id);
          const bIds = parseId(b.id);

          // Compare each part
          for (let i = 0; i < Math.max(aIds.length, bIds.length); i++) {
            const aId = aIds[i] || 0;
            const bId = bIds[i] || 0;
            if (aId !== bId) {
              aVal = aId;
              bVal = bId;
              break;
            }
          }
          break;
      }

      if (sortBy === 'updated') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Organize tasks by status for Kanban view
  const kanbanColumns = useMemo(() => {
    const allColumns = [
      {
        id: 'pending',
        title: '\ud83d\udccb To Do',
        status: 'pending',
        color: 'bg-surface-raised border-border/10',
        headerColor: 'bg-surface-elevated text-foreground-secondary'
      },
      {
        id: 'in-progress',
        title: '\ud83d\ude80 In Progress',
        status: 'in-progress',
        color: 'bg-status-info/5 border-status-info/20',
        headerColor: 'bg-status-info/10 text-status-info'
      },
      {
        id: 'done',
        title: '\u2705 Done',
        status: 'done',
        color: 'bg-status-connected/5 border-status-connected/20',
        headerColor: 'bg-status-connected/10 text-status-connected'
      },
      {
        id: 'blocked',
        title: '\ud83d\udeab Blocked',
        status: 'blocked',
        color: 'bg-status-error/5 border-status-error/20',
        headerColor: 'bg-status-error/10 text-status-error'
      },
      {
        id: 'deferred',
        title: '\u23f3 Deferred',
        status: 'deferred',
        color: 'bg-status-reconnecting/5 border-status-reconnecting/20',
        headerColor: 'bg-status-reconnecting/10 text-status-reconnecting'
      },
      {
        id: 'cancelled',
        title: '\u274c Cancelled',
        status: 'cancelled',
        color: 'bg-surface-raised border-border/10',
        headerColor: 'bg-surface-elevated text-muted-foreground'
      }
    ];

    // Only show columns that have tasks or are part of the main workflow
    const mainWorkflowStatuses = ['pending', 'in-progress', 'done'];
    const columnsWithTasks = allColumns.filter(column => {
      const hasTask = filteredAndSortedTasks.some(task => task.status === column.status);
      const isMainWorkflow = mainWorkflowStatuses.includes(column.status);
      return hasTask || isMainWorkflow;
    });

    return columnsWithTasks.map(column => ({
      ...column,
      tasks: filteredAndSortedTasks.filter(task => task.status === column.status)
    }));
  }, [filteredAndSortedTasks]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  if (tasks.length === 0) {
    // Check if TaskMaster is configured by looking for .taskmaster directory
    const hasTaskMasterDirectory = currentProject?.taskMasterConfigured ||
                                   currentProject?.taskmaster?.hasTaskmaster ||
                                   projectTaskMaster?.hasTaskmaster;

    return (
      <div className={cn('text-center py-12', className)}>
        {!hasTaskMasterDirectory ? (
          // TaskMaster not configured
          <div className="max-w-md mx-auto">
            <div className="text-primary mb-4">
              <Settings className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {'TaskMaster AI is not configured'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {'TaskMaster helps break down complex projects into manageable tasks with AI-powered assistance'}
            </p>

            {/* What is TaskMaster section */}
            <div className="mb-6 p-4 bg-status-info/10 rounded-lg text-left">
              <h4 className="text-sm font-medium text-foreground mb-3">
                {'\ud83c\udfaf What is TaskMaster?'}
              </h4>
              <div className="text-xs text-foreground-secondary space-y-1">
                <p>• {'AI-Powered Task Management: Break complex projects into manageable subtasks'}</p>
                <p>• {'PRD Templates: Generate tasks from Product Requirements Documents'}</p>
                <p>• {'Dependency Tracking: Understand task relationships and execution order'}</p>
                <p>• {'Progress Visualization: Kanban boards and detailed task analytics'}</p>
                <p>• {'CLI Integration: Use taskmaster commands for advanced workflows'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsTaskMasterComplete(false); // Reset completion state
                setShowCLI(true);
              }}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Terminal className="w-4 h-4" />
              {'Initialize TaskMaster AI'}
            </button>
          </div>
        ) : (
          // TaskMaster configured but no tasks - show Getting Started guide
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-status-info/10 to-primary/10 rounded-xl border border-status-info/20 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-status-info/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-status-info" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{'Getting Started with TaskMaster'}</h2>
                  <p className="text-sm text-muted-foreground">{'TaskMaster is initialized! Here\'s what to do next:'}</p>
                </div>
              </div>

              <div className="space-y-4 text-left">
                <div className="grid gap-3">
                  {/* Step 1 */}
                  <div className="flex gap-3 p-3 bg-surface-raised rounded-lg border border-border/10">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">1</div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{'Create a Product Requirements Document (PRD)'}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{'Discuss your project idea and create a PRD that describes what you want to build.'}</p>
                      <button
                        onClick={() => {
                          onShowPRDEditor?.();
                        }}
                        className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        {'Add PRD'}
                      </button>

                      {/* Show existing PRDs if any */}
                      {existingPRDs.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/10">
                          <p className="text-xs text-muted-foreground mb-2">{'Existing PRDs:'}</p>
                          <div className="flex flex-wrap gap-2">
                            {existingPRDs.map((prd) => (
                              <button
                                key={prd.name}
                                onClick={() => {
                                  void loadPRDOptions(prd);
                                }}
                                className="inline-flex items-center gap-1 text-xs bg-surface-elevated text-foreground-secondary px-2 py-1 rounded hover:bg-muted transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                {prd.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3 p-3 bg-surface-raised rounded-lg border border-border/10">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">2</div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{'Generate Tasks from PRD'}</h4>
                      <p className="text-sm text-muted-foreground">{'Once you have a PRD, ask your AI assistant to parse it and TaskMaster will automatically break it down into manageable tasks with implementation details.'}</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3 p-3 bg-surface-raised rounded-lg border border-border/10">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">3</div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{'Analyze & Expand Tasks'}</h4>
                      <p className="text-sm text-muted-foreground">{'Ask your AI assistant to analyze task complexity and expand them into detailed subtasks for easier implementation.'}</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-3 p-3 bg-surface-raised rounded-lg border border-border/10">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">4</div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{'Start Building'}</h4>
                      <p className="text-sm text-muted-foreground">{'Ask your AI assistant to begin working on tasks, update their status, and add new tasks as your project evolves.'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-status-info/20">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onShowPRDEditor?.();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors cursor-pointer"
                    style={{ zIndex: 10 }}
                  >
                    <FileText className="w-4 h-4" />
                    {'Add PRD'}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                {'\ud83d\udca1 Tip: Start with a PRD to get the most out of TaskMaster\'s AI-powered task generation'}
              </div>
            </div>
          </div>
        )}

        {/* TaskMaster CLI Setup Modal */}
        {showCLI && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface-base rounded-lg shadow-xl border border-border/10 w-full max-w-4xl h-[600px] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-status-info/10 rounded-lg flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-status-info" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{'TaskMaster Setup'}</h2>
                    <p className="text-sm text-muted-foreground">{`Interactive CLI for ${currentProject?.displayName}`}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCLI(false);
                    // Refresh project data after closing CLI to detect TaskMaster initialization
                    setTimeout(() => {
                      refreshProjects();
                      // Also refresh the current project's TaskMaster status
                      if (currentProject) {
                        setCurrentProject(currentProject);
                      }
                    }, 1000);
                  }}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-raised"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Terminal Container */}
              <div className="flex-1 p-4">
                <div
                  className="h-full bg-black rounded-lg overflow-hidden"
                  onClick={(e) => {
                    // Focus the terminal when clicked
                    const terminalElement = e.currentTarget.querySelector('.xterm-screen');
                    if (terminalElement) {
                      terminalElement.focus();
                    }
                  }}
                >
                  <Shell
                    selectedProject={currentProject}
                    selectedSession={null}
                    isActive={true}
                    initialCommand="npx task-master init"
                    isPlainShell={true}
                    onProcessComplete={(exitCode) => {
                      setIsTaskMasterComplete(true);
                      if (exitCode === 0) {
                        // Auto-refresh after successful completion
                        setTimeout(() => {
                          refreshProjects();
                          if (currentProject) {
                            setCurrentProject(currentProject);
                          }
                        }, 1000);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border/10 bg-surface-raised">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isTaskMasterComplete ? (
                      <span className="flex items-center gap-2 text-status-connected">
                        <div className="w-2 h-2 bg-status-connected rounded-full"></div>
                        {'TaskMaster setup completed! You can now close this window.'}
                      </span>
                    ) : (
                      'TaskMaster initialization will start automatically'
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowCLI(false);
                      setIsTaskMasterComplete(false); // Reset state
                      // Refresh project data after closing CLI to detect TaskMaster initialization
                      setTimeout(() => {
                        refreshProjects();
                        // Also refresh the current project's TaskMaster status
                        if (currentProject) {
                          setCurrentProject(currentProject);
                        }
                      }, 1000);
                    }}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      isTaskMasterComplete
                        ? "bg-status-connected hover:bg-status-connected/90 text-white"
                        : "text-foreground-secondary bg-surface-elevated border border-border/10 hover:bg-muted"
                    )}
                  >
                    {isTaskMasterComplete ? 'Close & Continue' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder={'Search tasks...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-border/10 rounded-lg bg-surface-raised text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-surface-raised rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'kanban'
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground-secondary'
              )}
              title={'Kanban view'}
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground-secondary'
              )}
              title={'List view'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground-secondary'
              )}
              title={'Grid view'}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
              showFilters
                ? 'bg-status-info/10 border-status-info/20 text-status-info'
                : 'bg-surface-raised border-border/10 text-foreground-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{'Filters'}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
          </button>

          {/* Action Buttons */}
          {currentProject && (
            <>
              {/* Help Button */}
              <button
                onClick={() => setShowHelpGuide(true)}
                className="p-2 text-muted-foreground hover:text-status-info hover:bg-surface-raised rounded-lg transition-colors border border-border/10"
                title={'TaskMaster Getting Started Guide'}
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* PRD Management */}
              <div ref={dropdownRef} className="relative">
                {existingPRDs.length > 0 ? (
                  // Dropdown when PRDs exist
                  <div className="relative">
                    <button
                      onClick={() => setShowPRDDropdown(!showPRDDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                      title={`${existingPRDs.length} PRD(s) available`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">{'PRDs'}</span>
                      <span className="px-1.5 py-0.5 text-xs bg-primary/70 rounded-full min-w-[1.25rem] text-center">
                        {existingPRDs.length}
                      </span>
                      <ChevronDown className={cn('w-3 h-3 transition-transform hidden sm:block', showPRDDropdown && 'rotate-180')} />
                    </button>

                    {showPRDDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-surface-raised/80 backdrop-blur-[16px] backdrop-saturate-[1.4] border border-border/10 rounded-lg shadow-xl z-[var(--z-dropdown)]">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              onShowPRDEditor?.();
                              setShowPRDDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            {'Create New PRD'}
                          </button>
                          <div className="border-t border-border/10 my-1"></div>
                          <div className="text-xs text-muted-foreground px-3 py-1 font-medium">{'Existing PRDs:'}</div>
                          {existingPRDs.map((prd) => (
                            <button
                              key={prd.name}
                              onClick={() => {
                                void loadPRDOptions(prd, true);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-elevated rounded flex items-center gap-2"
                              title={`Modified: ${new Date(prd.modified).toLocaleDateString()}`}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="truncate">{prd.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Simple button when no PRDs exist
                  <button
                    onClick={() => {
                      onShowPRDEditor?.();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                    title={'Add PRD'}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{'Add PRD'}</span>
                  </button>
                )}
              </div>

              {/* Add Task Button */}
              {((currentProject?.taskMasterConfigured || currentProject?.taskmaster?.hasTaskmaster || projectTaskMaster?.hasTaskmaster) || tasks.length > 0) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                  title={'Add Task'}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{'Add Task'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-surface-raised rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">
                {'Status'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border/10 rounded-md bg-surface-elevated text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="all">{'All Statuses'}</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">
                {'Priority'}
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border/10 rounded-md bg-surface-elevated text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="all">{'All Priorities'}</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">
                {'Sort By'}
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-border/10 rounded-md bg-surface-elevated text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="id-asc">{'ID (Ascending)'}</option>
                <option value="id-desc">{'ID (Descending)'}</option>
                <option value="title-asc">{'Title (A-Z)'}</option>
                <option value="title-desc">{'Title (Z-A)'}</option>
                <option value="status-asc">{'Status (Pending First)'}</option>
                <option value="status-desc">{'Status (Done First)'}</option>
                <option value="priority-asc">{'Priority (High First)'}</option>
                <option value="priority-desc">{'Priority (Low First)'}</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {`Showing ${filteredAndSortedTasks.length} of ${tasks.length} tasks`}
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-status-info hover:text-status-info/80 font-medium"
            >
              {'Clear Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Sort Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSortChange('id')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
            sortBy === 'id'
              ? 'bg-status-info/10 text-status-info'
              : 'bg-surface-raised text-muted-foreground hover:bg-surface-elevated'
          )}
        >
          {'ID'} {getSortIcon('id')}
        </button>
        <button
          onClick={() => handleSortChange('status')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
            sortBy === 'status'
              ? 'bg-status-info/10 text-status-info'
              : 'bg-surface-raised text-muted-foreground hover:bg-surface-elevated'
          )}
        >
          {'Status'} {getSortIcon('status')}
        </button>
        <button
          onClick={() => handleSortChange('priority')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
            sortBy === 'priority'
              ? 'bg-status-info/10 text-status-info'
              : 'bg-surface-raised text-muted-foreground hover:bg-surface-elevated'
          )}
        >
          {'Priority'} {getSortIcon('priority')}
        </button>
      </div>

      {/* Task Cards */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{'No tasks match your filters'}</h3>
            <p className="text-sm">{'Try adjusting your search or filter criteria.'}</p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board Layout - Dynamic grid based on column count */
        <div className={cn(
          "grid gap-6",
          kanbanColumns.length === 1 && "grid-cols-1 max-w-md mx-auto",
          kanbanColumns.length === 2 && "grid-cols-1 md:grid-cols-2",
          kanbanColumns.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          kanbanColumns.length === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          kanbanColumns.length === 5 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
          kanbanColumns.length >= 6 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        )}>
          {kanbanColumns.map((column) => (
            <div key={column.id} className={cn('rounded-xl border shadow-sm transition-shadow hover:shadow-md', column.color)}>
              {/* Column Header */}
              <div className={cn('px-4 py-3 rounded-t-xl border-b border-black/10', column.headerColor)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {column.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-black/20 rounded-full">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column Tasks */}
              <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                {column.tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-surface-elevated flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-muted"></div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {'No tasks yet'}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      {column.status === 'pending' ? 'Tasks will appear here' :
                       column.status === 'in-progress' ? 'Move tasks here when started' :
                       column.status === 'done' ? 'Completed tasks appear here' :
                       'Tasks with this status will appear here'}
                    </div>
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <div key={task.id} className="transform transition-transform hover:scale-[1.02]">
                      <TaskCard
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                        showParent={showParentTasks}
                        className="w-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(
          'gap-4',
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'space-y-4'
        )}>
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              showParent={showParentTasks}
              className={viewMode === 'grid' ? 'h-full' : ''}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          currentProject={currentProject}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={() => {
            setShowCreateModal(false);
            if (onTaskCreated) onTaskCreated();
          }}
        />
      )}

      {/* Help Guide Modal */}
      {showHelpGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-base rounded-lg shadow-xl border border-border/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-status-info/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-status-info" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{'Getting Started with TaskMaster'}</h2>
                  <p className="text-sm text-muted-foreground">{'Your guide to productive task management'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpGuide(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-raised transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-status-info/10 to-primary/10 rounded-lg border border-status-info/20">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white text-sm font-semibold rounded-full flex items-center justify-center">1</div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{'Create a Product Requirements Document (PRD)'}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{'Discuss your project idea and create a PRD that describes what you want to build.'}</p>
                    <button
                      onClick={() => {
                        onShowPRDEditor?.();
                        setShowHelpGuide(false);
                      }}
                      className="inline-flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      {'Add PRD'}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-status-connected/10 to-status-connected/5 rounded-lg border border-status-connected/20">
                  <div className="flex-shrink-0 w-8 h-8 bg-status-connected text-white text-sm font-semibold rounded-full flex items-center justify-center">2</div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{'Generate Tasks from PRD'}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{'Once you have a PRD, ask your AI assistant to parse it and TaskMaster will automatically break it down into manageable tasks with implementation details.'}</p>
                    <div className="bg-surface-raised rounded border border-status-connected/20 p-3 mb-2">
                      <p className="text-xs text-foreground font-mono whitespace-pre-wrap">
                        {'💬 Example:\n"I\'ve just initialized a new project with Claude Task Master. I have a PRD at .taskmaster/docs/prd.txt. Can you help me parse it and set up the initial tasks?"'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-status-reconnecting/10 to-status-reconnecting/5 rounded-lg border border-status-reconnecting/20">
                  <div className="flex-shrink-0 w-8 h-8 bg-status-reconnecting text-white text-sm font-semibold rounded-full flex items-center justify-center">3</div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{'Analyze & Expand Tasks'}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{'Ask your AI assistant to analyze task complexity and expand them into detailed subtasks for easier implementation.'}</p>
                    <div className="bg-surface-raised rounded border border-status-reconnecting/20 p-3 mb-2">
                      <p className="text-xs text-foreground font-mono whitespace-pre-wrap">
                        {'💬 Example:\n"Task 5 seems complex. Can you break it down into subtasks?"'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white text-sm font-semibold rounded-full flex items-center justify-center">4</div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{'Start Building'}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{'Ask your AI assistant to begin working on tasks, update their status, and add new tasks as your project evolves.'}</p>
                    <div className="bg-surface-raised rounded border border-primary/20 p-3 mb-3">
                      <p className="text-xs text-foreground font-mono whitespace-pre-wrap">
                        {'💬 Example:\n"Please add a new task to implement user profile image uploads using Cloudinary, research the best approach."'}
                      </p>
                    </div>
                    <a
                      href="https://github.com/eyaltoledano/claude-task-master/blob/main/docs/examples.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-status-info hover:text-status-info/80 underline"
                    >
                      {'View more examples and usage patterns →'}
                    </a>
                  </div>
                </div>

                {/* Pro Tips */}
                <div className="mt-6 p-4 bg-surface-raised rounded-lg border border-border/10">
                  <h4 className="font-medium text-foreground mb-3">{'\ud83d\udca1 Pro Tips'}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-status-info rounded-full mt-2 flex-shrink-0"></span>
                      {'Use the search bar to quickly find specific tasks'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-status-connected rounded-full mt-2 flex-shrink-0"></span>
                      {'Switch between Kanban, List, and Grid views using the view toggles'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      {'Use filters to focus on specific task statuses or priorities'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-status-reconnecting rounded-full mt-2 flex-shrink-0"></span>
                      {'Click on any task to view detailed information and manage subtasks'}
                    </li>
                  </ul>
                </div>

                {/* Learn More Section */}
                <div className="mt-6 p-4 bg-status-info/10 rounded-lg border border-status-info/20">
                  <h4 className="font-medium text-foreground mb-3">{'\ud83d\udcda Learn More'}</h4>
                  <p className="text-sm text-foreground-secondary mb-3">
                    {'TaskMaster AI is an advanced task management system built for developers. Get documentation, examples, and contribute to the project.'}
                  </p>
                  <a
                    href="https://github.com/eyaltoledano/claude-task-master"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    {'View on GitHub'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
