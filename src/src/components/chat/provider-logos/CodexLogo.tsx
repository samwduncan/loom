/**
 * CodexLogo -- 16px OpenAI-style mark as inline SVG.
 * Green tones matching the Codex/OpenAI brand.
 * Constitution: Named export (2.2).
 */

interface CodexLogoProps {
  className?: string;
}

export function CodexLogo({ className }: CodexLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.36 7.5 12 10.82 5.64 7.5 12 4.18zM5 8.94l6 3.33v6.79l-6-3.33V8.94zm8 10.12V15.27l6-3.33v6.79l-6 3.33z"
        fill="var(--logo-codex)"
      />
    </svg>
  );
}
