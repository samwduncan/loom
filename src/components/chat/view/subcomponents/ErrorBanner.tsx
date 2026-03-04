import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  type: 'crash' | 'exit' | 'error';
  onDismiss: () => void;
}

/**
 * Persistent inline error banner for permanent errors (process crash, exit code).
 * Renders inside the scroll container as part of the conversation flow.
 * Muted red accent -- not screaming: 10% bg, 2px left border, foreground text.
 */
export default function ErrorBanner({ message, type, onDismiss }: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const dismissedRef = useRef(false);

  // Entry animation: opacity 0->1 + translateY(4px)->0 over 200ms
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleDismiss = () => {
    dismissedRef.current = true;
    setIsVisible(false);
    // Wait for exit animation before calling onDismiss
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className="w-full rounded-lg bg-destructive/10 border-l-2 border-destructive px-4 py-3 transition-all duration-200"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(4px)',
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Error icon in destructive color */}
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />

        {/* Error message in foreground color for readability */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{message}</p>
        </div>

        {/* Dismiss X button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
