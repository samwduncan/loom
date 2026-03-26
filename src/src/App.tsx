/**
 * App -- Root component with React Router route structure.
 *
 * AppShell is the layout route. ContentArea (inside AppShell) renders ChatView
 * directly -- not via Outlet. The /chat/:sessionId? route exists solely to
 * establish URL match context for useParams() in ChatView.
 *
 * /dev/tokens and /dev/proof-of-life render outside AppShell as standalone pages.
 *
 * Constitution: Named exports only (2.2).
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TokenPreview } from '@/components/dev/TokenPreview';
import { ProofOfLife } from '@/components/dev/ProofOfLife';
import { AppShell } from '@/components/app-shell/AppShell';
import { AppErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { useTimelineStore } from '@/stores/timeline';

/** Reads persisted activeSessionId and redirects to last-viewed session or /chat */
function LastSessionRedirect() {
  const activeSessionId = useTimelineStore((state) => state.activeSessionId);
  return <Navigate to={activeSessionId ? `/chat/${activeSessionId}` : '/chat'} replace />;
}

/** Route structure without BrowserRouter -- for testing with MemoryRouter */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LastSessionRedirect />} />
        {/* Route exists for useParams() match context -- ChatView is rendered by ContentArea */}
        <Route path="/chat/:sessionId?" element={null} />
      </Route>
      <Route path="/dev/tokens" element={<TokenPreview />} />
      <Route path="/dev/proof-of-life" element={<ProofOfLife />} />
    </Routes>
  );
}

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
    </AppErrorBoundary>
  );
}
