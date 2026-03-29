/**
 * Tests for native-clipboard.ts -- cross-platform clipboard write utility.
 *
 * Covers: native success/failure, web success/failure, toast on success.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { platformMock, mockClipboardWrite, mockToast } = vi.hoisted(() => ({
  platformMock: { IS_NATIVE: false },
  mockClipboardWrite: vi.fn().mockResolvedValue(undefined),
  mockToast: vi.fn(),
}));

vi.mock('@/lib/platform', () => platformMock);

vi.mock('@capacitor/clipboard', () => ({
  Clipboard: { write: mockClipboardWrite },
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

import { nativeClipboardWrite } from '@/lib/native-clipboard';

describe('nativeClipboardWrite', () => {
  beforeEach(() => {
    platformMock.IS_NATIVE = false;
    mockClipboardWrite.mockClear();
    mockToast.mockClear();

    // Mock navigator.clipboard for web path
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  it('returns true on successful native clipboard write', async () => {
    platformMock.IS_NATIVE = true;
    const result = await nativeClipboardWrite('hello');
    expect(result).toBe(true);
    expect(mockClipboardWrite).toHaveBeenCalledWith({ string: 'hello' });
  });

  it('shows toast on successful native write', async () => {
    platformMock.IS_NATIVE = true;
    await nativeClipboardWrite('hello');
    expect(mockToast).toHaveBeenCalledWith('Copied to clipboard');
  });

  it('returns false when native clipboard fails', async () => {
    platformMock.IS_NATIVE = true;
    mockClipboardWrite.mockRejectedValueOnce(new Error('Plugin not available'));
    const result = await nativeClipboardWrite('hello');
    expect(result).toBe(false);
  });

  it('returns true on successful web clipboard write', async () => {
    platformMock.IS_NATIVE = false;
    const result = await nativeClipboardWrite('hello');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('shows toast on successful web write', async () => {
    platformMock.IS_NATIVE = false;
    await nativeClipboardWrite('hello');
    expect(mockToast).toHaveBeenCalledWith('Copied to clipboard');
  });

  it('returns false when web clipboard fails', async () => {
    platformMock.IS_NATIVE = false;
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('NotAllowed'),
    );
    const result = await nativeClipboardWrite('hello');
    expect(result).toBe(false);
  });
});
