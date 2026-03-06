/**
 * App — Root component with React Router route structure.
 *
 * AppShell is the layout route; child routes render via Outlet in the content area.
 * /dev/tokens renders outside AppShell as a standalone dev tool page.
 *
 * Constitution: Named exports only (2.2).
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TokenPreview } from '@/components/dev/TokenPreview';
import { ProofOfLife } from '@/components/dev/ProofOfLife';
import { AppShell } from '@/components/app-shell/AppShell';
import { PlaceholderView } from '@/components/shared/PlaceholderView';
import { AppErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ChatView } from '@/components/chat/view/ChatView';

function DashboardPlaceholder() {
  return <PlaceholderView title="Dashboard" />;
}

function SettingsPlaceholder() {
  return <PlaceholderView title="Settings" />;
}

/** Route structure without BrowserRouter — for testing with MemoryRouter */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="/chat/:sessionId?" element={<ChatView />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        <Route path="/settings" element={<SettingsPlaceholder />} />
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
    </AppErrorBoundary>
  );
}
