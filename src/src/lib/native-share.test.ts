/**
 * Tests for native-share.ts -- cross-platform share utility.
 *
 * Covers: native share, web share API, fallback to clipboard, AbortError handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { platformMock, mockShareShare, mockClipboardWrite, mockToast } = vi.hoisted(() => ({
  platformMock: { IS_NATIVE: false },
  mockShareShare: vi.fn().mockResolvedValue(undefined),
  mockClipboardWrite: vi.fn().mockResolvedValue(true),
  mockToast: vi.fn(),
}));

vi.mock('@/lib/platform', () => platformMock);

vi.mock('@capacitor/share', () => ({
  Share: { share: mockShareShare },
}));

vi.mock('@/lib/native-clipboard', () => ({
  nativeClipboardWrite: mockClipboardWrite,
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

import { nativeShare } from '@/lib/native-share';

describe('nativeShare', () => {
  beforeEach(() => {
    platformMock.IS_NATIVE = false;
    mockShareShare.mockClear();
    mockClipboardWrite.mockClear();
    mockToast.mockClear();

    // Default: no navigator.share on web
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('calls Capacitor Share on native', async () => {
    platformMock.IS_NATIVE = true;
    await nativeShare({ text: 'hello', title: 'Test' });
    expect(mockShareShare).toHaveBeenCalledWith({
      title: 'Test',
      text: 'hello',
      dialogTitle: undefined,
    });
  });

  it('calls navigator.share on web when available', async () => {
    platformMock.IS_NATIVE = false;
    const mockWebShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockWebShare,
      writable: true,
      configurable: true,
    });
    await nativeShare({ text: 'hello', title: 'Test' });
    expect(mockWebShare).toHaveBeenCalledWith({ title: 'Test', text: 'hello' });
  });

  it('falls back to clipboard on web without Web Share API', async () => {
    platformMock.IS_NATIVE = false;
    // navigator.share is undefined (default in beforeEach)
    await nativeShare({ text: 'hello' });
    expect(mockClipboardWrite).toHaveBeenCalledWith('hello');
  });

  it('shows toast when clipboard fallback fails', async () => {
    platformMock.IS_NATIVE = false;
    mockClipboardWrite.mockResolvedValueOnce(false);
    await nativeShare({ text: 'hello' });
    expect(mockToast).toHaveBeenCalledWith('Share unavailable');
  });

  it('ignores AbortError (user cancelled share sheet)', async () => {
    platformMock.IS_NATIVE = true;
    const abortErr = new Error('User cancelled');
    abortErr.name = 'AbortError';
    mockShareShare.mockRejectedValueOnce(abortErr);
    // Should not throw
    await expect(nativeShare({ text: 'hello' })).resolves.toBeUndefined();
  });
});
