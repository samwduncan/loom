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
        d="M15.31 3.99l-4.34 8.23a.5.5 0 0 1-.44.27H7.2a.5.5 0 0 1-.44-.74l4.34-8.23a.5.5 0 0 1 .44-.27h3.33a.5.5 0 0 1 .44.74zm1.49 7.51l-4.34 8.23a.5.5 0 0 1-.44.27H8.69a.5.5 0 0 1-.44-.74l4.34-8.23a.5.5 0 0 1 .44-.27h3.33a.5.5 0 0 1 .44.74z"
        fill="var(--logo-claude)"
      />
    </svg>
  );
}
