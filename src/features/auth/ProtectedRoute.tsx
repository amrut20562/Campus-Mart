// CampusMart — Route guards for authenticated and admin routes

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// ---------------------------------------------------------------
// RequireAuth — redirects logged-out visitors to /login
// Preserves the intended route in ?redirect param (AUTH-02)
// ---------------------------------------------------------------
export function RequireAuth({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gallery-black border-t-transparent rounded-full animate-spin" />
          <p className="text-caption text-ash-gray">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Encode the attempted URL so Login can redirect back
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------
// RequireAdmin — also blocks authenticated non-admin students
// ---------------------------------------------------------------
export function RequireAdmin({ children }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gallery-black border-t-transparent rounded-full animate-spin" />
          <p className="text-caption text-ash-gray">Checking access…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Student authenticated but not admin — redirect to home (ADMIN-01)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------
// RedirectIfAuth — send logged-in users away from /login, /register
// ---------------------------------------------------------------
export function RedirectIfAuth({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-canvas">
        <div className="w-8 h-8 border-2 border-gallery-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
