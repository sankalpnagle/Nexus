import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './store/authStore';
import { useSocket } from './store/socketStore';
import Navbar from './components/layout/Navbar';
import AuthPage    from './pages/AuthPage';
import HomePage    from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import MessagesPage from './pages/MessagesPage';
import GroupsPage  from './pages/GroupsPage';
import { Spinner } from './components/ui';
import { useTheme } from './store/themeStore';

// Layout wrapper for authenticated pages
function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--nx-bg)]">
      <Navbar />
      <div className="pt-14">
        <Outlet />
      </div>
    </div>
  );
}

// Route guard
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="fixed inset-0 bg-[var(--nx-bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:"#7c6ff7", boxShadow:"0 0 30px rgba(124,111,247,0.4)" }}>
          <span className="text-[var(--nx-bg)] font-black text-xl font-[var(--font-display)]">N</span>
        </div>
        <Spinner size={24} />
      </div>
    </div>
  );
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
}

export default function App() {
  const { init, user, isAuthenticated } = useAuth();
  useTheme(); // initialize theme on app load
  const { connect, disconnect } = useSocket();

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (isAuthenticated && user) connect(user._id);
    else disconnect();
  }, [isAuthenticated, user?._id]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--nx-card)',
            color: 'var(--nx-text)',
            border: '1px solid #272d44',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#7c6ff7', secondary: 'var(--nx-bg)' } },
          error:   { iconTheme: { primary: '#fb4570', secondary: '#ffffff' } },
        }}
      />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/"              element={<HomePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/friends"       element={<FriendsPage />} />
            <Route path="/messages"      element={<MessagesPage />} />
            <Route path="/groups"        element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupsPage />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
