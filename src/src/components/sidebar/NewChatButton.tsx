/**
 * NewChatButton -- full-width ghost button for starting a new conversation.
 *
 * Sets activeSession to null and navigates to /chat. No backend session
 * creation until the user sends their first message.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useTimelineStore } from '@/stores/timeline';

export function NewChatButton() {
  const navigate = useNavigate();
  const setActiveSession = useTimelineStore((s) => s.setActiveSession);

  const handleClick = () => {
    setActiveSession(null);
    navigate('/chat');
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center justify-center gap-1.5',
        'px-3 py-2 mx-0',
        'text-primary text-[length:var(--text-body)] font-medium',
        'bg-transparent rounded-md',
        'hover:bg-primary-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'transition-colors duration-[var(--duration-fast)]',
        'cursor-pointer',
      )}
      type="button"
    >
      {/* Plus icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      New Chat
    </button>
  );
}
