/**
 * ImagePreview tests -- lightbox dialog for image file preview.
 *
 * Tests rendering, title display, and isImageFile utility.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImagePreview } from './ImagePreview';
import { isImageFile } from './file-utils';

describe('ImagePreview', () => {
  it('renders dialog with image when open', () => {
    render(
      <ImagePreview
        filePath="/home/project/assets/logo.png"
        fileName="logo.png"
        open={true}
        onOpenChange={() => {}}
        projectName="my-project"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('shows file name as title', () => {
    render(
      <ImagePreview
        filePath="/home/project/assets/logo.png"
        fileName="logo.png"
        open={true}
        onOpenChange={() => {}}
        projectName="my-project"
      />,
    );

    expect(screen.getByText('logo.png')).toBeInTheDocument();
  });

  it('does not render dialog when closed', () => {
    render(
      <ImagePreview
        filePath="/home/project/assets/logo.png"
        fileName="logo.png"
        open={false}
        onOpenChange={() => {}}
        projectName="my-project"
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('constructs correct image src URL', () => {
    render(
      <ImagePreview
        filePath="/home/project/assets/logo.png"
        fileName="logo.png"
        open={true}
        onOpenChange={() => {}}
        projectName="my-project"
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      `/api/projects/${encodeURIComponent('my-project')}/files/content?path=${encodeURIComponent('/home/project/assets/logo.png')}`,
    );
  });
});

describe('isImageFile', () => {
  it('returns true for image extensions', () => {
    expect(isImageFile('photo.png')).toBe(true);
    expect(isImageFile('photo.jpg')).toBe(true);
    expect(isImageFile('photo.jpeg')).toBe(true);
    expect(isImageFile('icon.svg')).toBe(true);
    expect(isImageFile('banner.webp')).toBe(true);
    expect(isImageFile('favicon.ico')).toBe(true);
    expect(isImageFile('animation.gif')).toBe(true);
  });

  it('returns false for non-image extensions', () => {
    expect(isImageFile('main.ts')).toBe(false);
    expect(isImageFile('data.json')).toBe(false);
    expect(isImageFile('readme.md')).toBe(false);
    expect(isImageFile('styles.css')).toBe(false);
  });

  it('handles uppercase extensions', () => {
    expect(isImageFile('PHOTO.PNG')).toBe(true);
    expect(isImageFile('logo.SVG')).toBe(true);
  });

  it('returns false for files without extension', () => {
    expect(isImageFile('Makefile')).toBe(false);
    expect(isImageFile('.gitignore')).toBe(false);
  });
});
