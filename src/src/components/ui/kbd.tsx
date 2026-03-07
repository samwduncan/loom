import { cn } from '@/utils/cn'
import type { HTMLAttributes } from 'react'

export function Kbd({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded-sm border border-border bg-surface-raised px-1.5 py-0.5',
        'font-mono text-xs text-muted',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}
