/**
 * CountdownRing -- SVG circular countdown timer.
 *
 * Renders a depleting ring with centered seconds number.
 * Uses stroke-dasharray/dashoffset technique for smooth depletion.
 *
 * Constitution: Named exports (2.2), no default export.
 */

import { memo } from 'react';
import { cn } from '@/utils/cn';

interface CountdownRingProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
}

const STROKE_WIDTH = 2.5;

export const CountdownRing = memo(function CountdownRing({
  totalSeconds,
  remainingSeconds,
  size = 24,
}: CountdownRingProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - remainingSeconds / totalSeconds);
  const isPulsing = remainingSeconds <= 10;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(
        'countdown-ring -rotate-90',
        isPulsing && 'countdown-ring-pulse',
      )}
      aria-label={`${remainingSeconds} seconds remaining`}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={STROKE_WIDTH}
      />
      {/* Progress circle -- offset via CSS custom property (Constitution 7.14) */}
      <circle
        className="countdown-ring-track [stroke-dashoffset:var(--ring-offset)]"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={circumference}
        style={{ '--ring-offset': offset } as React.CSSProperties}
        strokeLinecap="round"
      />
      {/* Centered seconds text -- rotated back to upright */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90 origin-center"
        fill="var(--text-muted)"
        fontSize={size * 0.38}
        fontFamily="var(--font-mono)"
      >
        {remainingSeconds}
      </text>
    </svg>
  );
});
