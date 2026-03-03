import React, { memo, useState, useEffect, useRef, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import ThinkingShimmer from './ThinkingShimmer';

interface ThinkingDisclosureProps {
  content: string;
  isStreaming?: boolean;
  showByDefault?: boolean;
}

export const ThinkingDisclosure = memo(function ThinkingDisclosure({
  content,
  isStreaming = false,
  showByDefault = false,
}: ThinkingDisclosureProps) {
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(showByDefault);
  const [eyeToggle, setEyeToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-collapse when streaming completes
  useEffect(() => {
    if (!isStreaming && eyeToggle) {
      setIsExpanded(false);
      setEyeToggle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  // Sync with global showByDefault changes when not streaming
  useEffect(() => {
    if (!isStreaming) {
      setIsExpanded(showByDefault);
    }
  }, [showByDefault, isStreaming]);

  // During streaming, eye toggle controls visibility
  const showContent = isStreaming ? eyeToggle : isExpanded;

  const handleToggle = () => {
    if (isStreaming) {
      // During streaming, toggle the eye
      setEyeToggle((prev) => !prev);
    } else {
      // After streaming, toggle expand/collapse
      setIsExpanded((prev) => !prev);
    }
  };

  const handleEyeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEyeToggle((prev) => !prev);
  };

  const isEmpty = !content || content.trim().length === 0;

  // During streaming with no content, show the aurora ThinkingShimmer instead
  if (isStreaming && isEmpty) {
    return <ThinkingShimmer isThinking={true} />;
  }

  // Character count for collapsed label
  const charCount = content.length;
  const formattedCount = charCount >= 1000
    ? `${(charCount / 1000).toFixed(1)}K`
    : String(charCount);

  return (
    <div className="thinking-disclosure mb-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 py-1 text-[#c4a882]/50 hover:text-[#c4a882]/70 transition-colors"
          aria-expanded={showContent}
          aria-controls={contentId}
        >
          {/* Chevron */}
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${
              showContent ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-sm font-medium text-[#c4a882]/50">
            Thinking{!showContent && charCount > 0 ? `... (${formattedCount} chars)` : ''}
          </span>
        </button>

        {/* Per-block eye toggle (visible during streaming) */}
        {isStreaming && (
          <button
            type="button"
            onClick={handleEyeToggle}
            className="p-1 text-[#c4a882]/50 hover:text-[#c4a882]/70 transition-colors"
            title={eyeToggle ? 'Hide live thinking' : 'Show live thinking'}
            aria-label={eyeToggle ? 'Hide live thinking' : 'Show live thinking'}
          >
            {eyeToggle ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Collapsible content with CSS grid animation */}
      <div
        id={contentId}
        className="collapsible-content"
        style={{
          display: 'grid',
          gridTemplateRows: showContent ? '1fr' : '0fr',
          transition: 'grid-template-rows 200ms ease-out',
        }}
      >
        <div className="overflow-hidden">
          <div
            ref={contentRef}
            className="pl-4 border-l-2 border-[#3d2e25]/40 mt-1 max-h-96 overflow-y-auto"
          >
            {isEmpty ? (
              <p className="text-sm text-[#c4a882]/30 italic py-1">
                No reasoning available
              </p>
            ) : (
              <pre className="text-sm text-[#c4a882]/40 whitespace-pre-wrap break-words font-sans py-1">
                {content}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
