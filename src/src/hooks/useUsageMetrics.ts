/**
 * useUsageMetrics -- polls /api/usage/metrics every 30s for burn rate
 * and cost data from burn-rate.json + claude-metrics.
 *
 * useSessionTokenUsage -- fetches per-session context window data when
 * the session ID changes.
 *
 * Constitution: Named exports (2.2), no default export.
 */

import { useState, useEffect, useRef } from 'react';
import { getToken } from '@/lib/auth';

export interface UsageMetrics {
  burnRate: {
    blockPct: number | null;
    mult: number | null;
    vel: number | null;
    trend: string;
    budget: number | null;
    elapsedS: number | null;
    timestamp: number | null;
  } | null;
  usage: {
    today: { totalCost: string };
    last7d: { totalCost: string };
  } | null;
}

export interface SessionTokenUsage {
  used: number;
  total: number;
}

const POLL_INTERVAL = 30_000;

async function fetchMetricsData(): Promise<UsageMetrics | null> {
  try {
    const token = getToken();
    const res = await fetch('/api/usage/metrics', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) return await res.json();
  } catch {
    // Silently fail
  }
  return null;
}

export function useUsageMetrics(): UsageMetrics | null {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetchMetricsData().then((data) => {
        if (!cancelled && data) setMetrics(data);
      });
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return metrics;
}

/**
 * Fetch per-session context window usage from the backend JSONL endpoint.
 * Returns null while loading or if no session is selected.
 * Re-fetches when sessionId or projectName changes.
 */
export function useSessionTokenUsage(
  projectName: string | null,
  sessionId: string | null,
): SessionTokenUsage | null {
  const [usage, setUsage] = useState<SessionTokenUsage | null>(null);
  const prevSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectName || !sessionId || sessionId.startsWith('stub-')) {
      prevSessionRef.current = null;
      // Don't call setUsage here — just let it stay as-is until data arrives
      return;
    }

    // Avoid re-fetching same session
    if (prevSessionRef.current === sessionId) return;
    prevSessionRef.current = sessionId;

    let cancelled = false;
    const token = getToken();
    fetch(`/api/projects/${projectName}/sessions/${sessionId}/token-usage`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.used === 'number') {
          setUsage({ used: data.used, total: data.total });
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [projectName, sessionId]);

  return usage;
}
