import ReactDOM from 'react-dom';
import type { ReactNode } from 'react';

type OverlayPortalProps = {
  children: ReactNode;
};

/**
 * Portal wrapper that renders children into #overlay-root.
 * Ensures overlays escape all stacking contexts in the React tree.
 * Falls back to document.body if #overlay-root is not found.
 */
export function OverlayPortal({ children }: OverlayPortalProps) {
  const target = document.getElementById('overlay-root') || document.body;
  return ReactDOM.createPortal(children, target);
}
