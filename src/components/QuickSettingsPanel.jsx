import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Eye,
  Settings2,
  ArrowDown,
  Mic,
  Brain,
  Sparkles,
  FileText,
  Languages,
  GripVertical
} from 'lucide-react';
import { useUiPreferences } from '../hooks/useUiPreferences';

import { useDeviceSettings } from '../hooks/useDeviceSettings';


const QuickSettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [whisperMode, setWhisperMode] = useState(() => {
    return localStorage.getItem('whisperMode') || 'default';
  });
  const { isMobile } = useDeviceSettings({ trackPWA: false });

  const { preferences, setPreference } = useUiPreferences();
  const { autoExpandTools, showRawParameters, showThinking, autoScrollToBottom, sendByCtrlEnter } = preferences;

  // Draggable handle state
  const [handlePosition, setHandlePosition] = useState(() => {
    const saved = localStorage.getItem('quickSettingsHandlePosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.y ?? 50;
      } catch {
        // Remove corrupted data
        localStorage.removeItem('quickSettingsHandlePosition');
        return 50;
      }
    }
    return 50; // Default to 50% (middle of screen)
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPosition, setDragStartPosition] = useState(0);
  const [hasMoved, setHasMoved] = useState(false); // Track if user has moved during drag
  const handleRef = useRef(null);
  const constraintsRef = useRef({ min: 10, max: 90 }); // Percentage constraints
  const dragThreshold = 5; // Pixels to move before it's considered a drag

  // Save handle position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('quickSettingsHandlePosition', JSON.stringify({ y: handlePosition }));
  }, [handlePosition]);

  // Calculate position from percentage
  const getPositionStyle = useCallback(() => {
    if (isMobile) {
      // On mobile, convert percentage to pixels from bottom
      const bottomPixels = (window.innerHeight * handlePosition) / 100;
      return { bottom: `${bottomPixels}px` };
    } else {
      // On desktop, use top with percentage
      return { top: `${handlePosition}%`, transform: 'translateY(-50%)' };
    }
  }, [handlePosition, isMobile]);

  // Handle mouse/touch start
  const handleDragStart = useCallback((e) => {
    // Don't prevent default yet - we want to allow click if no drag happens
    e.stopPropagation();

    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartPosition(handlePosition);
    setHasMoved(false);
    setIsDragging(false); // Don't set dragging until threshold is passed
  }, [handlePosition]);

  // Handle mouse/touch move
  const handleDragMove = useCallback((e) => {
    if (dragStartY === 0) return; // Not in a potential drag

    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    const deltaY = Math.abs(clientY - dragStartY);

    // Check if we've moved past threshold
    if (!isDragging && deltaY > dragThreshold) {
      setIsDragging(true);
      setHasMoved(true);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      // Prevent body scroll on mobile during drag
      if (e.type.includes('touch')) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      }
    }

    if (!isDragging) return;

    // Prevent scrolling on touch move
    if (e.type.includes('touch')) {
      e.preventDefault();
    }

    const actualDeltaY = clientY - dragStartY;

    // For top-based positioning (desktop), moving down increases top percentage
    // For bottom-based positioning (mobile), we need to invert
    let percentageDelta;
    if (isMobile) {
      // On mobile, moving down should decrease bottom position (increase percentage from top)
      percentageDelta = -(actualDeltaY / window.innerHeight) * 100;
    } else {
      // On desktop, moving down should increase top position
      percentageDelta = (actualDeltaY / window.innerHeight) * 100;
    }

    let newPosition = dragStartPosition + percentageDelta;

    // Apply constraints
    newPosition = Math.max(constraintsRef.current.min, Math.min(constraintsRef.current.max, newPosition));

    setHandlePosition(newPosition);
  }, [isDragging, dragStartY, dragStartPosition, isMobile, dragThreshold]);

  // Handle mouse/touch end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragStartY(0);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Restore body scroll on mobile
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }, []);

  // Cleanup body styles on unmount in case component unmounts while dragging
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Set up global event listeners for drag
  useEffect(() => {
    if (dragStartY !== 0) {
      // Mouse events
      const handleMouseMove = (e) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();

      // Touch events
      const handleTouchMove = (e) => handleDragMove(e);
      const handleTouchEnd = () => handleDragEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragStartY, handleDragMove, handleDragEnd]);

  const handleToggle = (e) => {
    // Don't toggle if user was dragging
    if (hasMoved) {
      e.preventDefault();
      setHasMoved(false);
      return;
    }

    setIsOpen((previous) => !previous);
  };

  return (
    <>
      {/* Pull Tab - Combined drag handle and toggle button */}
      <button
        ref={handleRef}
        onClick={handleToggle}
        onMouseDown={(e) => {
          // Start drag on mousedown
          handleDragStart(e);
        }}
        onTouchStart={(e) => {
          // Start drag on touchstart
          handleDragStart(e);
        }}
        className={`fixed ${
          isOpen ? 'right-64' : 'right-0'
        } z-[var(--z-modal)] ${isDragging ? '' : 'transition-all duration-150 ease-out'} bg-surface-raised border ${
          isDragging ? 'border-primary' : 'border-border/10'
        } rounded-l-md p-2 hover:bg-surface-elevated transition-colors shadow-lg ${
          isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        } touch-none`}
        style={{ ...getPositionStyle(), touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        aria-label={isDragging ? "Dragging handle" : isOpen ? "Close settings panel" : "Open settings panel"}
        title={isDragging ? "Dragging..." : "Click to toggle, drag to move"}
      >
        {isDragging ? (
          <GripVertical className="h-5 w-5 text-primary" />
        ) : isOpen ? (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-background border-l border-border shadow-xl transform transition-transform duration-150 ease-out z-[var(--z-overlay)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isMobile ? 'h-screen' : ''}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/10 bg-surface-raised">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              {"Quick Settings"}
            </h3>
          </div>

          {/* Settings Content */}
          <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 bg-background ${isMobile ? 'pb-mobile-nav' : ''}`}>
            {/* Tool Display Settings */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{"Tool Display"}</h4>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  {"Auto-expand tools"}
                </span>
                <input
                  type="checkbox"
                  checked={autoExpandTools}
                  onChange={(e) => setPreference('autoExpandTools', e.target.checked)}
                  className="h-4 w-4 rounded border-border/10 text-primary focus:ring-2 focus:ring-primary bg-surface-elevated checked:bg-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  {"Show raw parameters"}
                </span>
                <input
                  type="checkbox"
                  checked={showRawParameters}
                  onChange={(e) => setPreference('showRawParameters', e.target.checked)}
                  className="h-4 w-4 rounded border-border/10 text-primary focus:ring-2 focus:ring-primary bg-surface-elevated checked:bg-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  {"Show thinking"}
                </span>
                <input
                  type="checkbox"
                  checked={showThinking}
                  onChange={(e) => setPreference('showThinking', e.target.checked)}
                  className="h-4 w-4 rounded border-border/10 text-primary focus:ring-2 focus:ring-primary bg-surface-elevated checked:bg-primary"
                />
              </label>
            </div>
            {/* View Options */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{"View Options"}</h4>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  {"Auto-scroll to bottom"}
                </span>
                <input
                  type="checkbox"
                  checked={autoScrollToBottom}
                  onChange={(e) => setPreference('autoScrollToBottom', e.target.checked)}
                  className="h-4 w-4 rounded border-border/10 text-primary focus:ring-2 focus:ring-primary bg-surface-elevated checked:bg-primary"
                />
              </label>
            </div>

            {/* Input Settings */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{"Input Settings"}</h4>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  {"Send by Ctrl+Enter"}
                </span>
                <input
                  type="checkbox"
                  checked={sendByCtrlEnter}
                  onChange={(e) => setPreference('sendByCtrlEnter', e.target.checked)}
                  className="h-4 w-4 rounded border-border/10 text-primary focus:ring-2 focus:ring-primary bg-surface-elevated checked:bg-primary"
                />
              </label>
              <p className="text-xs text-muted-foreground ml-3">
                {"When enabled, pressing Ctrl+Enter will send the message instead of just Enter. This is useful for IME users to avoid accidental sends."}
              </p>
            </div>

            {/* Whisper Dictation Settings - HIDDEN */}
            <div className="space-y-2" style={{ display: 'none' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{"Whisper Dictation"}</h4>

              <div className="space-y-2">
                <label className="flex items-start p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                  <input
                    type="radio"
                    name="whisperMode"
                    value="default"
                    checked={whisperMode === 'default'}
                    onChange={() => {
                      setWhisperMode('default');
                      localStorage.setItem('whisperMode', 'default');
                      window.dispatchEvent(new Event('whisperModeChanged'));
                    }}
                    className="mt-0.5 h-4 w-4 border-border/10 text-primary focus:ring-primary bg-surface-elevated checked:bg-primary"
                  />
                  <div className="ml-3 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      {"Default Mode"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {"Direct transcription of your speech"}
                    </p>
                  </div>
                </label>

                <label className="flex items-start p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                  <input
                    type="radio"
                    name="whisperMode"
                    value="prompt"
                    checked={whisperMode === 'prompt'}
                    onChange={() => {
                      setWhisperMode('prompt');
                      localStorage.setItem('whisperMode', 'prompt');
                      window.dispatchEvent(new Event('whisperModeChanged'));
                    }}
                    className="mt-0.5 h-4 w-4 border-border/10 text-primary focus:ring-primary bg-surface-elevated checked:bg-primary"
                  />
                  <div className="ml-3 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      {"Prompt Enhancement"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {"Transform rough ideas into clear, detailed AI prompts"}
                    </p>
                  </div>
                </label>

                <label className="flex items-start p-3 rounded-lg bg-surface-raised hover:bg-surface-elevated cursor-pointer transition-colors border border-transparent hover:border-border/10">
                  <input
                    type="radio"
                    name="whisperMode"
                    value="vibe"
                    checked={whisperMode === 'vibe' || whisperMode === 'instructions' || whisperMode === 'architect'}
                    onChange={() => {
                      setWhisperMode('vibe');
                      localStorage.setItem('whisperMode', 'vibe');
                      window.dispatchEvent(new Event('whisperModeChanged'));
                    }}
                    className="mt-0.5 h-4 w-4 border-border/10 text-primary focus:ring-primary bg-surface-elevated checked:bg-primary"
                  />
                  <div className="ml-3 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {"Vibe Mode"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {"Format ideas as clear agent instructions with details"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[var(--z-overlay)] transition-opacity duration-150 ease-out"
          onClick={handleToggle}
        />
      )}
    </>
  );
};

export default QuickSettingsPanel;
