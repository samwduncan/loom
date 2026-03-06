/**
 * ProviderLogo -- SVG logos for each ProviderId.
 *
 * Minimal recognizable SVG marks for Claude, Codex, and Gemini providers.
 * Dispatches to the correct logo based on providerId prop.
 *
 * Constitution: Named exports (2.2), token-based styling (3.1).
 */

import type { ProviderId } from '@/types/provider';

interface LogoProps {
  size?: number;
}

export function ClaudeLogo({ size = 14 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Simplified Claude mark -- sunburst rays */}
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="currentColor"
      />
      <path
        d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CodexLogo({ size = 14 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Angular/square mark for Codex */}
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 9l3 3-3 3M14 15h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GeminiLogo({ size = 14 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Sparkle mark for Gemini */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="currentColor"
      />
      <path
        d="M18 14l.75 2.25L21 17l-2.25.75L18 20l-.75-2.25L15 17l2.25-.75L18 14Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

interface ProviderLogoProps {
  providerId: ProviderId;
  size?: number;
}

export function ProviderLogo({ providerId, size = 14 }: ProviderLogoProps) {
  switch (providerId) {
    case 'claude':
      return <ClaudeLogo size={size} />;
    case 'codex':
      return <CodexLogo size={size} />;
    case 'gemini':
      return <GeminiLogo size={size} />;
  }
}
