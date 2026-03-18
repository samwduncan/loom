/**
 * Tests for filterProjectGroups -- pure function for session search filtering.
 */

import { describe, it, expect } from 'vitest';
import { filterProjectGroups } from './useSessionSearch';
import type { ProjectGroup } from '@/types/session';

function makeGroup(overrides: Partial<ProjectGroup> = {}): ProjectGroup {
  return {
    projectName: 'test',
    displayName: 'Test',
    projectPath: '/home/user/test',
    sessionCount: 2,
    visibleCount: 2,
    dateGroups: [
      {
        label: 'Today',
        sessions: [
          {
            id: 's1',
            title: 'Deploy pipeline fix',
            messages: [],
            providerId: 'claude',
            createdAt: '2026-03-18T10:00:00Z',
            updatedAt: '2026-03-18T10:00:00Z',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 5 },
          },
          {
            id: 's2',
            title: 'Authentication refactor',
            messages: [],
            providerId: 'claude',
            createdAt: '2026-03-18T09:00:00Z',
            updatedAt: '2026-03-18T09:00:00Z',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 3 },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('filterProjectGroups', () => {
  it('returns groups unchanged when query is empty', () => {
    const groups = [makeGroup()];
    const result = filterProjectGroups(groups, '');
    expect(result).toEqual(groups);
  });

  it('returns groups unchanged when query is whitespace', () => {
    const groups = [makeGroup()];
    const result = filterProjectGroups(groups, '   ');
    expect(result).toEqual(groups);
  });

  it('filters sessions by title match (case-insensitive)', () => {
    const groups = [makeGroup()];
    const result = filterProjectGroups(groups, 'deploy');
    expect(result).toHaveLength(1);
    expect(result[0]?.dateGroups[0]?.sessions).toHaveLength(1);
    expect(result[0]?.dateGroups[0]?.sessions[0]?.title).toBe('Deploy pipeline fix');
  });

  it('removes empty date groups after filtering', () => {
    const groups = [makeGroup({
      dateGroups: [
        {
          label: 'Today',
          sessions: [
            {
              id: 's1',
              title: 'Deploy fix',
              messages: [],
              providerId: 'claude',
              createdAt: '2026-03-18T10:00:00Z',
              updatedAt: '2026-03-18T10:00:00Z',
              metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
            },
          ],
        },
        {
          label: 'Yesterday',
          sessions: [
            {
              id: 's2',
              title: 'Auth work',
              messages: [],
              providerId: 'claude',
              createdAt: '2026-03-17T10:00:00Z',
              updatedAt: '2026-03-17T10:00:00Z',
              metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 2 },
            },
          ],
        },
      ],
    })];
    const result = filterProjectGroups(groups, 'deploy');
    expect(result[0]?.dateGroups).toHaveLength(1);
    expect(result[0]?.dateGroups[0]?.label).toBe('Today');
  });

  it('removes empty projects after filtering', () => {
    const groups = [
      makeGroup({ projectName: 'alpha', displayName: 'Alpha' }),
      makeGroup({
        projectName: 'beta',
        displayName: 'Beta',
        dateGroups: [
          {
            label: 'Today',
            sessions: [
              {
                id: 's3',
                title: 'Unrelated task',
                messages: [],
                providerId: 'claude',
                createdAt: '2026-03-18T10:00:00Z',
                updatedAt: '2026-03-18T10:00:00Z',
                metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
              },
            ],
          },
        ],
      }),
    ];
    const result = filterProjectGroups(groups, 'deploy');
    expect(result).toHaveLength(1);
    expect(result[0]?.projectName).toBe('alpha');
  });

  it('recalculates visibleCount per project', () => {
    const groups = [makeGroup({ visibleCount: 2 })];
    const result = filterProjectGroups(groups, 'deploy');
    expect(result[0]?.visibleCount).toBe(1);
  });
});
