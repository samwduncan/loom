/**
 * FileIcon tests -- verifies extension-to-icon mapping and directory states.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getFileIcon } from './file-icons';
import { FileIcon } from './FileIcon';
import {
  File,
  FileCode,
  FileJson,
  FileText,
  ImageIcon,
  Folder,
  FolderOpen,
  Cog,
} from 'lucide-react';

describe('getFileIcon', () => {
  it('returns FolderOpen for expanded directory', () => {
    expect(getFileIcon('src', true, true)).toBe(FolderOpen);
  });

  it('returns Folder for collapsed directory', () => {
    expect(getFileIcon('src', true, false)).toBe(Folder);
  });

  it('returns FileCode for .ts files', () => {
    expect(getFileIcon('index.ts', false, false)).toBe(FileCode);
  });

  it('returns FileCode for .tsx files', () => {
    expect(getFileIcon('App.tsx', false, false)).toBe(FileCode);
  });

  it('returns FileCode for .js files', () => {
    expect(getFileIcon('index.js', false, false)).toBe(FileCode);
  });

  it('returns FileCode for .jsx files', () => {
    expect(getFileIcon('App.jsx', false, false)).toBe(FileCode);
  });

  it('returns FileJson for .json files', () => {
    expect(getFileIcon('package.json', false, false)).toBe(FileJson);
  });

  it('returns FileText for .css files', () => {
    expect(getFileIcon('styles.css', false, false)).toBe(FileText);
  });

  it('returns FileText for .md files', () => {
    expect(getFileIcon('README.md', false, false)).toBe(FileText);
  });

  it('returns FileText for .txt files', () => {
    expect(getFileIcon('notes.txt', false, false)).toBe(FileText);
  });

  it('returns ImageIcon for image files', () => {
    expect(getFileIcon('logo.png', false, false)).toBe(ImageIcon);
    expect(getFileIcon('photo.jpg', false, false)).toBe(ImageIcon);
    expect(getFileIcon('icon.svg', false, false)).toBe(ImageIcon);
    expect(getFileIcon('anim.gif', false, false)).toBe(ImageIcon);
    expect(getFileIcon('bg.webp', false, false)).toBe(ImageIcon);
  });

  it('returns Cog for config files', () => {
    expect(getFileIcon('config.yaml', false, false)).toBe(Cog);
    expect(getFileIcon('docker.yml', false, false)).toBe(Cog);
    expect(getFileIcon('settings.toml', false, false)).toBe(Cog);
    expect(getFileIcon('.env', false, false)).toBe(Cog);
  });

  it('returns File for unknown extensions', () => {
    expect(getFileIcon('data.bin', false, false)).toBe(File);
  });
});

describe('FileIcon', () => {
  it('renders an icon element', () => {
    render(<FileIcon name="index.ts" isDirectory={false} />);
    // lucide-react renders an svg element
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders with custom className', () => {
    render(<FileIcon name="index.ts" isDirectory={false} className="text-primary" />);
    const svg = document.querySelector('svg');
    expect(svg?.classList.contains('text-primary')).toBe(true);
  });
});
