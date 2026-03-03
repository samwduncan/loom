import React, { useState } from 'react';
import { cn } from '../lib/utils';

const Tooltip = ({
  children,
  content,
  position = 'top',
  className = '',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-surface-base';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-surface-base';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-surface-base';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-surface-base';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-surface-base';
    }
  };

  if (!content) {
    return children;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div className={cn(
          'absolute z-[var(--z-dropdown)] px-2 py-1 text-xs font-medium text-foreground bg-surface-base rounded shadow-lg whitespace-nowrap pointer-events-none',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          getPositionClasses(),
          className
        )}>
          {content}

          {/* Arrow */}
          <div className={cn(
            'absolute w-0 h-0 border-4 border-transparent',
            getArrowClasses()
          )} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
