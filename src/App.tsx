import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { TaskMasterProvider } from './contexts/TaskMasterContext';
import { TasksSettingsProvider } from './contexts/TasksSettingsContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppContent from './components/app/AppContent';

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <TasksSettingsProvider>
          <TaskMasterProvider>
            <ProtectedRoute>
              <Router basename={window.__ROUTER_BASENAME__ || ''}>
                <Routes>
                  <Route path="/" element={<AppContent />} />
                  <Route path="/session/:sessionId" element={<AppContent />} />
                </Routes>
              </Router>
            </ProtectedRoute>
          </TaskMasterProvider>
        </TasksSettingsProvider>
      </WebSocketProvider>
      <Toaster
        position="bottom-right"
        duration={3000}
        theme="dark"
        visibleToasts={4}
        offset={16}
      />
    </AuthProvider>
  );
}
