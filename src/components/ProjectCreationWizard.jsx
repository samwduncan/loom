import React, { useState, useEffect } from 'react';
import { X, FolderPlus, GitBranch, Key, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, FolderOpen, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../utils/api';
import { OverlayPortal } from './ui/overlay-portal';

const ProjectCreationWizard = ({ onClose, onProjectCreated }) => {
  // Wizard state
  const [step, setStep] = useState(1); // 1: Choose type, 2: Configure, 3: Confirm
  const [workspaceType, setWorkspaceType] = useState('existing'); // 'existing' or 'new' - default to 'existing'

  // Form state
  const [workspacePath, setWorkspacePath] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [selectedGithubToken, setSelectedGithubToken] = useState('');
  const [tokenMode, setTokenMode] = useState('stored'); // 'stored' | 'new' | 'none'
  const [newGithubToken, setNewGithubToken] = useState('');

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [pathSuggestions, setPathSuggestions] = useState([]);
  const [showPathDropdown, setShowPathDropdown] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [browserCurrentPath, setBrowserCurrentPath] = useState('~');
  const [browserFolders, setBrowserFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showHiddenFolders, setShowHiddenFolders] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [cloneProgress, setCloneProgress] = useState('');

  // Load available GitHub tokens when needed
  useEffect(() => {
    if (step === 2 && workspaceType === 'new' && githubUrl) {
      loadGithubTokens();
    }
  }, [step, workspaceType, githubUrl]);

  // Load path suggestions
  useEffect(() => {
    if (workspacePath.length > 2) {
      loadPathSuggestions(workspacePath);
    } else {
      setPathSuggestions([]);
      setShowPathDropdown(false);
    }
  }, [workspacePath]);

  const loadGithubTokens = async () => {
    try {
      setLoadingTokens(true);
      const response = await api.get('/settings/credentials?type=github_token');
      const data = await response.json();

      const activeTokens = (data.credentials || []).filter(t => t.is_active);
      setAvailableTokens(activeTokens);

      // Auto-select first token if available
      if (activeTokens.length > 0 && !selectedGithubToken) {
        setSelectedGithubToken(activeTokens[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading GitHub tokens:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadPathSuggestions = async (inputPath) => {
    try {
      // Extract the directory to browse (parent of input)
      const lastSlash = inputPath.lastIndexOf('/');
      const dirPath = lastSlash > 0 ? inputPath.substring(0, lastSlash) : '~';

      const response = await api.browseFilesystem(dirPath);
      const data = await response.json();

      if (data.suggestions) {
        // Filter suggestions based on the input, excluding exact match
        const filtered = data.suggestions.filter(s =>
          s.path.toLowerCase().startsWith(inputPath.toLowerCase()) &&
          s.path.toLowerCase() !== inputPath.toLowerCase()
        );
        setPathSuggestions(filtered.slice(0, 5));
        setShowPathDropdown(filtered.length > 0);
      }
    } catch (error) {
      console.error('Error loading path suggestions:', error);
    }
  };

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (!workspaceType) {
        setError('Please select whether you have an existing workspace or want to create a new one');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!workspacePath.trim()) {
        setError('Please provide a workspace path');
        return;
      }

      // No validation for GitHub token - it's optional (only needed for private repos)
      setStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    setCloneProgress('');

    try {
      if (workspaceType === 'new' && githubUrl) {
        const params = new URLSearchParams({
          path: workspacePath.trim(),
          githubUrl: githubUrl.trim(),
        });

        if (tokenMode === 'stored' && selectedGithubToken) {
          params.append('githubTokenId', selectedGithubToken);
        } else if (tokenMode === 'new' && newGithubToken) {
          params.append('newGithubToken', newGithubToken.trim());
        }

        const token = localStorage.getItem('auth-token');
        const url = `/api/projects/clone-progress?${params}${token ? `&token=${token}` : ''}`;

        await new Promise((resolve, reject) => {
          const eventSource = new EventSource(url);

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              if (data.type === 'progress') {
                setCloneProgress(data.message);
              } else if (data.type === 'complete') {
                eventSource.close();
                if (onProjectCreated) {
                  onProjectCreated(data.project);
                }
                onClose();
                resolve();
              } else if (data.type === 'error') {
                eventSource.close();
                reject(new Error(data.message));
              }
            } catch (e) {
              console.error('Error parsing SSE event:', e);
            }
          };

          eventSource.onerror = () => {
            eventSource.close();
            reject(new Error('Connection lost during clone'));
          };
        });
        return;
      }

      const payload = {
        workspaceType,
        path: workspacePath.trim(),
      };

      const response = await api.createWorkspace(payload);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create workspace');
      }

      if (onProjectCreated) {
        onProjectCreated(data.project);
      }

      onClose();
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError(error.message || 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const selectPathSuggestion = (suggestion) => {
    setWorkspacePath(suggestion.path);
    setShowPathDropdown(false);
  };

  const openFolderBrowser = async () => {
    setShowFolderBrowser(true);
    await loadBrowserFolders('~');
  };

  const loadBrowserFolders = async (path) => {
    try {
      setLoadingFolders(true);
      const response = await api.browseFilesystem(path);
      const data = await response.json();
      setBrowserCurrentPath(data.path || path);
      setBrowserFolders(data.suggestions || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const selectFolder = (folderPath, advanceToConfirm = false) => {
    setWorkspacePath(folderPath);
    setShowFolderBrowser(false);
    if (advanceToConfirm) {
      setStep(3);
    }
  };

  const navigateToFolder = async (folderPath) => {
    await loadBrowserFolders(folderPath);
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    setError(null);
    try {
      const separator = browserCurrentPath.includes('\\') ? '\\' : '/';
      const folderPath = `${browserCurrentPath}${separator}${newFolderName.trim()}`;
      const response = await api.createFolder(folderPath);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create folder');
      }
      setNewFolderName('');
      setShowNewFolderInput(false);
      await loadBrowserFolders(data.path || folderPath);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError(error.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <OverlayPortal>
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[var(--z-modal)] p-0 sm:p-4">
      <div className="bg-surface-raised rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl border-0 sm:border border-border/10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {'Create New Project'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground-secondary rounded-md hover:bg-surface-elevated"
            disabled={isCreating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                      s < step
                        ? 'bg-status-connected text-white'
                        : s === step
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated text-muted-foreground'
                    }`}
                  >
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className="text-sm font-medium text-foreground-secondary hidden sm:inline">
                    {s === 1 ? 'Type' : s === 2 ? 'Configure' : 'Confirm'}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      s < step ? 'bg-status-connected' : 'bg-surface-elevated'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 min-h-[300px]">
          {/* Error Display */}
          {error && (
            <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-status-error">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Choose workspace type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground-secondary mb-3">
                  {'Do you already have a workspace, or would you like to create a new one?'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Existing Workspace */}
                  <button
                    onClick={() => setWorkspaceType('existing')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      workspaceType === 'existing'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/10 hover:border-border/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-status-connected/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderPlus className="w-5 h-5 text-status-connected" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground mb-1">
                          {'Existing Workspace'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {'I already have a workspace on my server and just need to add it to the project list'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* New Workspace */}
                  <button
                    onClick={() => setWorkspaceType('new')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      workspaceType === 'new'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/10 hover:border-border/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GitBranch className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground mb-1">
                          {'New Workspace'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {'Create a new workspace, optionally clone from a GitHub repository'}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Configure workspace */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Workspace Path */}
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  {workspaceType === 'existing' ? 'Workspace Path' : 'Workspace Path'}
                </label>
                <div className="relative flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      value={workspacePath}
                      onChange={(e) => setWorkspacePath(e.target.value)}
                      placeholder={workspaceType === 'existing' ? '/path/to/existing/workspace' : '/path/to/new/workspace'}
                      className="w-full"
                    />
                    {showPathDropdown && pathSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-surface-raised/80 backdrop-blur-[16px] backdrop-saturate-[1.4] border border-border/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {pathSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectPathSuggestion(suggestion)}
                            className="w-full px-4 py-2 text-left hover:bg-surface-elevated text-sm"
                          >
                            <div className="font-medium text-foreground">{suggestion.name}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.path}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openFolderBrowser}
                    className="px-3"
                    title="Browse folders"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {workspaceType === 'existing'
                    ? 'Full path to your existing workspace directory'
                    : 'Full path to your workspace directory'}
                </p>
              </div>

              {/* GitHub URL (only for new workspace) */}
              {workspaceType === 'new' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      {'GitHub URL (Optional)'}
                    </label>
                    <Input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {'Optional: provide a GitHub URL to clone a repository'}
                    </p>
                  </div>

                  {/* GitHub Token (only for HTTPS URLs - SSH uses SSH keys) */}
                  {githubUrl && !githubUrl.startsWith('git@') && !githubUrl.startsWith('ssh://') && (
                    <div className="bg-surface-elevated rounded-lg p-4 border border-border/10">
                      <div className="flex items-start gap-3 mb-4">
                        <Key className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground mb-1">
                            {'GitHub Authentication (Optional)'}
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {'Only required for private repositories. Public repos can be cloned without authentication.'}
                          </p>
                        </div>
                      </div>

                      {loadingTokens ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {'Loading stored tokens...'}
                        </div>
                      ) : availableTokens.length > 0 ? (
                        <>
                          {/* Token Selection Tabs */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <button
                              onClick={() => setTokenMode('stored')}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                tokenMode === 'stored'
                                  ? 'bg-primary text-white'
                                  : 'bg-surface-raised text-foreground-secondary'
                              }`}
                            >
                              {'Stored Token'}
                            </button>
                            <button
                              onClick={() => setTokenMode('new')}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                tokenMode === 'new'
                                  ? 'bg-primary text-white'
                                  : 'bg-surface-raised text-foreground-secondary'
                              }`}
                            >
                              {'New Token'}
                            </button>
                            <button
                              onClick={() => {
                                setTokenMode('none');
                                setSelectedGithubToken('');
                                setNewGithubToken('');
                              }}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                tokenMode === 'none'
                                  ? 'bg-status-connected text-white'
                                  : 'bg-surface-raised text-foreground-secondary'
                              }`}
                            >
                              {'None (Public)'}
                            </button>
                          </div>

                          {tokenMode === 'stored' ? (
                            <div>
                              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                {'Select Token'}
                              </label>
                              <select
                                value={selectedGithubToken}
                                onChange={(e) => setSelectedGithubToken(e.target.value)}
                                className="w-full px-3 py-2 bg-surface-raised border border-border/10 rounded-lg text-sm text-foreground"
                              >
                                <option value="">{'-- Select a token --'}</option>
                                {availableTokens.map((token) => (
                                  <option key={token.id} value={token.id}>
                                    {token.credential_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : tokenMode === 'new' ? (
                            <div>
                              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                                {'New Token'}
                              </label>
                              <Input
                                type="password"
                                value={newGithubToken}
                                onChange={(e) => setNewGithubToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full"
                              />
                              <p className="mt-1 text-xs text-muted-foreground">
                                {'This token will be used only for this operation'}
                              </p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-status-info/10 rounded-lg p-3 border border-status-info/20">
                            <p className="text-sm text-foreground-secondary">
                              {'Public repositories don\'t require authentication. You can skip providing a token if cloning a public repo.'}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-2">
                              {'GitHub Token (Optional for Public Repos)'}
                            </label>
                            <Input
                              type="password"
                              value={newGithubToken}
                              onChange={(e) => setNewGithubToken(e.target.value)}
                              placeholder={'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (leave empty for public repos)'}
                              className="w-full"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {'No stored tokens available. You can add tokens in Settings → API Keys for easier reuse.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-surface-elevated rounded-lg p-4 border border-border/10">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  {'Review Your Configuration'}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{'Workspace Type:'}</span>
                    <span className="font-medium text-foreground">
                      {workspaceType === 'existing' ? 'Existing Workspace' : 'New Workspace'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{'Path:'}</span>
                    <span className="font-mono text-xs text-foreground break-all">
                      {workspacePath}
                    </span>
                  </div>
                  {workspaceType === 'new' && githubUrl && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{'Clone From:'}</span>
                        <span className="font-mono text-xs text-foreground break-all">
                          {githubUrl}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{'Authentication:'}</span>
                        <span className="text-xs text-foreground">
                          {tokenMode === 'stored' && selectedGithubToken
                            ? `${'Using stored token:'} ${availableTokens.find(t => t.id.toString() === selectedGithubToken)?.credential_name || 'Unknown'}`
                            : tokenMode === 'new' && newGithubToken
                            ? 'Using provided token'
                            : (githubUrl.startsWith('git@') || githubUrl.startsWith('ssh://'))
                            ? 'SSH Key'
                            : 'No authentication'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/20">
                {isCreating && cloneProgress ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{'Cloning repository...'}</p>
                    <code className="block text-xs font-mono text-foreground-secondary whitespace-pre-wrap break-all">
                      {cloneProgress}
                    </code>
                  </div>
                ) : (
                  <p className="text-sm text-foreground-secondary">
                    {workspaceType === 'existing'
                      ? 'The workspace will be added to your project list and will be available for AI agent sessions.'
                      : githubUrl
                      ? 'The repository will be cloned from this folder.'
                      : 'The workspace will be added to your project list and will be available for AI agent sessions.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border/10">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
            disabled={isCreating}
          >
            {step === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1" />
                {'Back'}
              </>
            )}
          </Button>

          <Button
            onClick={step === 3 ? handleCreate : handleNext}
            disabled={isCreating || (step === 1 && !workspaceType)}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {githubUrl ? 'Cloning...' : 'Creating...'}
              </>
            ) : step === 3 ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                {'Create Project'}
              </>
            ) : (
              <>
                {'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Folder Browser Modal */}
      {showFolderBrowser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[var(--z-modal)] p-4">
          <div className="bg-surface-raised rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] border border-border/10 flex flex-col">
            {/* Browser Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Select Folder
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHiddenFolders(!showHiddenFolders)}
                  className={`p-2 rounded-md transition-colors ${
                    showHiddenFolders
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground-secondary hover:bg-surface-elevated'
                  }`}
                  title={showHiddenFolders ? 'Hide hidden folders' : 'Show hidden folders'}
                >
                  {showHiddenFolders ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                  className={`p-2 rounded-md transition-colors ${
                    showNewFolderInput
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground-secondary hover:bg-surface-elevated'
                  }`}
                  title="Create new folder"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowFolderBrowser(false)}
                  className="p-2 text-muted-foreground hover:text-foreground-secondary rounded-md hover:bg-surface-elevated"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* New Folder Input */}
            {showNewFolderInput && (
              <div className="px-4 py-3 border-b border-border/10 bg-status-info/10">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createNewFolder();
                      if (e.key === 'Escape') {
                        setShowNewFolderInput(false);
                        setNewFolderName('');
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={createNewFolder}
                    disabled={!newFolderName.trim() || creatingFolder}
                  >
                    {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Folder List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Parent Directory - check for Windows root (e.g., C:\) and Unix root */}
                  {browserCurrentPath !== '~' && browserCurrentPath !== '/' && !/^[A-Za-z]:\\?$/.test(browserCurrentPath) && (
                    <button
                      onClick={() => {
                        const lastSlash = Math.max(browserCurrentPath.lastIndexOf('/'), browserCurrentPath.lastIndexOf('\\'));
                        let parentPath;
                        if (lastSlash <= 0) {
                          parentPath = '/';
                        } else if (lastSlash === 2 && /^[A-Za-z]:/.test(browserCurrentPath)) {
                          parentPath = browserCurrentPath.substring(0, 3);
                        } else {
                          parentPath = browserCurrentPath.substring(0, lastSlash);
                        }
                        navigateToFolder(parentPath);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-surface-elevated rounded-lg flex items-center gap-3"
                    >
                      <FolderOpen className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground-secondary">..</span>
                    </button>
                  )}

                  {/* Folders */}
                  {browserFolders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No subfolders found
                    </div>
                  ) : (
                    browserFolders
                      .filter(folder => showHiddenFolders || !folder.name.startsWith('.'))
                      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                      .map((folder, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          onClick={() => navigateToFolder(folder.path)}
                          className="flex-1 px-4 py-3 text-left hover:bg-surface-elevated rounded-lg flex items-center gap-3"
                        >
                          <FolderPlus className="w-5 h-5 text-primary" />
                          <span className="font-medium text-foreground">{folder.name}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectFolder(folder.path, workspaceType === 'existing')}
                          className="text-xs px-3"
                        >
                          Select
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Browser Footer with Current Path */}
            <div className="border-t border-border/10">
              <div className="px-4 py-3 bg-surface-elevated flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Path:</span>
                <code className="text-sm font-mono text-foreground flex-1 truncate">
                  {browserCurrentPath}
                </code>
              </div>
              <div className="flex items-center justify-end gap-2 p-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFolderBrowser(false);
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectFolder(browserCurrentPath, workspaceType === 'existing')}
                >
                  Use this folder
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </OverlayPortal>
  );
};

export default ProjectCreationWizard;
