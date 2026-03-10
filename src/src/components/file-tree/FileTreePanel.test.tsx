/**
 * FileTreePanel tests -- verifies split layout structure and placeholder content.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileTreePanel } from './FileTreePanel';

describe('FileTreePanel', () => {
  it('renders split layout with tree sidebar and editor placeholder', () => {
    render(<FileTreePanel />);
    // Tree sidebar exists
    expect(screen.getByText('Files')).toBeInTheDocument();
    // Editor placeholder exists
    expect(screen.getByText('Select a file to view')).toBeInTheDocument();
  });

  it('editor placeholder shows correct message', () => {
    render(<FileTreePanel />);
    expect(screen.getByText('Select a file to view')).toBeInTheDocument();
  });
});
