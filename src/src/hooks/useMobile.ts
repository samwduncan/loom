/**
 * useMobile -- shared hook for mobile viewport detection.
 *
 * Uses useSyncExternalStore with matchMedia for tear-free reads.
 * Single source of truth for the 767px mobile breakpoint.
 *
 * Constitution: Named exports (2.2).
 */

import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

function subscribeMobile(cb: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getMobileSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

export function useMobile(): boolean {
  return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
}
