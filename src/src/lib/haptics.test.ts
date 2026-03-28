/**
 * Tests for haptics.ts -- typed haptic wrapper functions with fire-and-forget semantics.
 *
 * Covers: web no-op, native calls, reduced motion guard, null module guard,
 * setHapticsModule lifecycle, and hapticNotification() 200ms throttle (AR A-3).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted() runs BEFORE vi.mock hoisting, so these refs are available in mock factories.
const {
  platformMock,
  motionMock,
  mockHaptics,
  mockImpactStyle,
  mockNotificationType,
} = vi.hoisted(() => ({
  platformMock: { IS_NATIVE: false },
  motionMock: { prefersReducedMotion: vi.fn(() => false) },
  mockHaptics: {
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
    selectionChanged: vi.fn().mockResolvedValue(undefined),
  },
  mockImpactStyle: { Heavy: 'HEAVY', Medium: 'MEDIUM', Light: 'LIGHT' },
  mockNotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

vi.mock('@/lib/platform', () => platformMock);

vi.mock('@/lib/motion', () => motionMock);

vi.mock('@capacitor/haptics', () => ({
  Haptics: mockHaptics,
  ImpactStyle: mockImpactStyle,
  NotificationType: mockNotificationType,
}));

import {
  hapticImpact,
  hapticNotification,
  hapticSelection,
  setHapticsModule,
  _resetForTesting,
} from '@/lib/haptics';

// Need the mock module reference to pass to setHapticsModule
import * as hapticsCapModule from '@capacitor/haptics';

describe('haptics', () => {
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetForTesting();
    platformMock.IS_NATIVE = false;
    motionMock.prefersReducedMotion.mockReturnValue(false);
    mockHaptics.impact.mockClear();
    mockHaptics.notification.mockClear();
    mockHaptics.selectionChanged.mockClear();
    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  // --- web environment ---

  describe('web environment', () => {
    it('hapticImpact is a no-op on web', () => {
      platformMock.IS_NATIVE = false;
      setHapticsModule(hapticsCapModule);
      hapticImpact('Medium');
      expect(mockHaptics.impact).not.toHaveBeenCalled();
    });

    it('hapticNotification is a no-op on web', () => {
      platformMock.IS_NATIVE = false;
      setHapticsModule(hapticsCapModule);
      hapticNotification('Success');
      expect(mockHaptics.notification).not.toHaveBeenCalled();
    });

    it('hapticSelection is a no-op on web', () => {
      platformMock.IS_NATIVE = false;
      setHapticsModule(hapticsCapModule);
      hapticSelection();
      expect(mockHaptics.selectionChanged).not.toHaveBeenCalled();
    });
  });

  // --- native with module ---

  describe('native with module', () => {
    beforeEach(() => {
      platformMock.IS_NATIVE = true;
      setHapticsModule(hapticsCapModule);
    });

    it('hapticImpact calls Haptics.impact with Medium style', () => {
      hapticImpact('Medium');
      expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'MEDIUM' });
    });

    it('hapticImpact calls Haptics.impact with Heavy style', () => {
      hapticImpact('Heavy');
      expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'HEAVY' });
    });

    it('hapticImpact calls Haptics.impact with Light style', () => {
      hapticImpact('Light');
      expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
    });

    it('hapticNotification calls Haptics.notification with Success type', () => {
      hapticNotification('Success');
      expect(mockHaptics.notification).toHaveBeenCalledWith({ type: 'SUCCESS' });
    });

    it('hapticNotification calls Haptics.notification with Error type', () => {
      hapticNotification('Error');
      expect(mockHaptics.notification).toHaveBeenCalledWith({ type: 'ERROR' });
    });

    it('hapticSelection calls Haptics.selectionChanged', () => {
      hapticSelection();
      expect(mockHaptics.selectionChanged).toHaveBeenCalled();
    });
  });

  // --- reduced motion ---

  describe('reduced motion', () => {
    beforeEach(() => {
      platformMock.IS_NATIVE = true;
      setHapticsModule(hapticsCapModule);
      motionMock.prefersReducedMotion.mockReturnValue(true);
    });

    it('hapticImpact is a no-op when reduced motion preferred', () => {
      hapticImpact('Medium');
      expect(mockHaptics.impact).not.toHaveBeenCalled();
    });

    it('hapticNotification is a no-op when reduced motion preferred', () => {
      hapticNotification('Success');
      expect(mockHaptics.notification).not.toHaveBeenCalled();
    });

    it('hapticSelection is a no-op when reduced motion preferred', () => {
      hapticSelection();
      expect(mockHaptics.selectionChanged).not.toHaveBeenCalled();
    });
  });

  // --- null module ---

  describe('null module', () => {
    it('hapticImpact is a no-op when module is null', () => {
      platformMock.IS_NATIVE = true;
      hapticImpact('Heavy');
      expect(mockHaptics.impact).not.toHaveBeenCalled();
    });

    it('hapticNotification is a no-op when module is null', () => {
      platformMock.IS_NATIVE = true;
      hapticNotification('Success');
      expect(mockHaptics.notification).not.toHaveBeenCalled();
    });

    it('hapticSelection is a no-op when module is null', () => {
      platformMock.IS_NATIVE = true;
      hapticSelection();
      expect(mockHaptics.selectionChanged).not.toHaveBeenCalled();
    });
  });

  // --- setHapticsModule ---

  describe('setHapticsModule', () => {
    it('sets module reference enabling haptic calls', () => {
      platformMock.IS_NATIVE = true;
      setHapticsModule(hapticsCapModule);
      hapticImpact('Light');
      expect(mockHaptics.impact).toHaveBeenCalled();
    });

    it('clears module reference with null', () => {
      platformMock.IS_NATIVE = true;
      setHapticsModule(hapticsCapModule);
      setHapticsModule(null);
      hapticImpact('Light');
      expect(mockHaptics.impact).not.toHaveBeenCalled();
    });
  });

  // --- notification throttle (AR A-3) ---

  describe('notification throttle', () => {
    beforeEach(() => {
      platformMock.IS_NATIVE = true;
      setHapticsModule(hapticsCapModule);
    });

    it('fires first hapticNotification call', () => {
      dateSpy.mockReturnValue(1000);
      hapticNotification('Success');
      expect(mockHaptics.notification).toHaveBeenCalledTimes(1);
    });

    it('drops second hapticNotification within 200ms', () => {
      dateSpy.mockReturnValue(1000);
      hapticNotification('Success');
      expect(mockHaptics.notification).toHaveBeenCalledTimes(1);

      dateSpy.mockReturnValue(1100); // 100ms later -- within throttle
      hapticNotification('Error');
      expect(mockHaptics.notification).toHaveBeenCalledTimes(1); // still 1
    });

    it('fires hapticNotification after 200ms gap', () => {
      dateSpy.mockReturnValue(1000);
      hapticNotification('Success');
      expect(mockHaptics.notification).toHaveBeenCalledTimes(1);

      dateSpy.mockReturnValue(1201); // 201ms after first -- past throttle
      hapticNotification('Warning');
      expect(mockHaptics.notification).toHaveBeenCalledTimes(2);
    });

    it('throttle does not affect hapticImpact', () => {
      dateSpy.mockReturnValue(1000);
      hapticImpact('Medium');
      hapticImpact('Heavy');
      expect(mockHaptics.impact).toHaveBeenCalledTimes(2);
    });

    it('throttle does not affect hapticSelection', () => {
      dateSpy.mockReturnValue(1000);
      hapticSelection();
      hapticSelection();
      expect(mockHaptics.selectionChanged).toHaveBeenCalledTimes(2);
    });
  });
});
