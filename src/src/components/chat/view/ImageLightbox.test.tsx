import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageLightbox } from './ImageLightbox';

describe('ImageLightbox', () => {
  it('returns null when src is null', () => {
    const { container } = render(
      <ImageLightbox src={null} open={false} onClose={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog with image when open and src provided', () => {
    render(
      <ImageLightbox
        src="https://example.com/image.png"
        alt="test image"
        open={true}
        onClose={vi.fn()}
      />,
    );
    const img = screen.getByAltText('test image');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/image.png');
  });

  it('calls onClose when dialog close is triggered', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox
        src="https://example.com/image.png"
        open={true}
        onClose={onClose}
      />,
    );
    // Click the X close button (sr-only "Close" text)
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('image has max-h-[90vh] and object-contain classes', () => {
    render(
      <ImageLightbox
        src="https://example.com/image.png"
        alt="styled"
        open={true}
        onClose={vi.fn()}
      />,
    );
    const img = screen.getByAltText('styled');
    expect(img.className).toContain('max-h-[90vh]');
    expect(img.className).toContain('object-contain');
  });
});
