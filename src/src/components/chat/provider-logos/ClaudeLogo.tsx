/**
 * ClaudeLogo -- 16px Anthropic/Claude logomark as inline SVG.
 * Warm salmon/orange color matching the Anthropic brand.
 * Constitution: Named export (2.2).
 */

interface ClaudeLogoProps {
  className?: string;
}

export function ClaudeLogo({ className }: ClaudeLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16.98 8.58L12.7 20h-2.44l1.75-4.67L7.77 4h2.54l2.83 8.4L15.9 4h2.54l-1.46 4.58z"
        fill="var(--logo-claude)"
      />
    </svg>
  );
}
