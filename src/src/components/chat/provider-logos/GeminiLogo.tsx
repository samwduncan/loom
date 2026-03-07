/**
 * GeminiLogo -- 16px Google Gemini sparkle mark as inline SVG.
 * Blue tones matching the Gemini brand.
 * Constitution: Named export (2.2).
 */

interface GeminiLogoProps {
  className?: string;
}

export function GeminiLogo({ className }: GeminiLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
        fill="var(--logo-gemini)"
      />
    </svg>
  );
}
