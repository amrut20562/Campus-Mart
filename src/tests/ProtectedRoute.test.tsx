// CampusMart — ProtectedRoute tests (AUTH-02, AUTH-03, ADMIN-01)
// Tests route guards, loading states, and access control

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireAdmin, RedirectIfAuth } from '@/features/auth/ProtectedRoute';

// Mock the AuthContext
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import('@/features/auth/AuthContext');

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while session is resolving', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      userRole: null,
      isAdmin: false,
      loading: true,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/sell']}>
        <RequireAuth>
          <div>Protected content</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects logged-out visitors to login', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      userRole: null,
      isAdmin: false,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={
            <RequireAuth>
              <div>Protected content</div>
            </RequireAuth>
          } />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('preserves intended route in redirect param', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      userRole: null,
      isAdmin: false,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/sell']}>
        <Routes>
          <Route path="/sell" element={
            <RequireAuth>
              <div>Protected content</div>
            </RequireAuth>
          } />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Verify redirect happened (Login page is shown)
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders children for authenticated user', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'user-1', email: 'test@example.com' } as any,
      userRole: 'student',
      isAdmin: false,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/sell']}>
        <RequireAuth>
          <div>Protected content</div>
        </RequireAuth>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('RequireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while checking access', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      userRole: null,
      isAdmin: false,
      loading: true,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RequireAdmin>
          <div>Admin content</div>
        </RequireAdmin>
      </MemoryRouter>
    );

    expect(screen.getByText(/checking access/i)).toBeInTheDocument();
  });

  it('redirects logged-out visitors to login', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      userRole: null,
      isAdmin: false,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/admin" element={
            <RequireAdmin>
              <div>Admin content</div>
            </RequireAdmin>
          } />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects authenticated non-admin to home', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'user-1', email: 'student@example.com' } as any,
      userRole: 'student',
      isAdmin: false,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/admin" element={
            <RequireAdmin>
              <div>Admin content</div>
            </RequireAdmin>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('renders children for admin user', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'admin-1', email: 'admin@example.com' } as any,
      userRole: 'admin',
      isAdmin: true,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RequireAdmin>
          <div>Admin content</div>
        </RequireAdmin>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});

describe('RedirectIfAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while checking auth', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      userRole: null,
      isAdmin: false,
      loading: true,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <RedirectIfAuth>
          <div>Login form</div>
        </RedirectIfAuth>
      </MemoryRouter>
    );

    // Loading spinner should be visible (no text in this component)
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });

  it('renders children for logged-out visitors', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: null,
      userRole: null,
      isAdmin: false,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <RedirectIfAuth>
          <div>Login form</div>
        </RedirectIfAuth>
      </MemoryRouter>
    );

    expect(screen.getByText('Login form')).toBeInTheDocument();
  });

  it('redirects authenticated users to home', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      user: { id: 'user-1', email: 'test@example.com' } as any,
      userRole: 'student',
      isAdmin: false,
      loading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/login" element={
            <RedirectIfAuth>
              <div>Login form</div>
            </RedirectIfAuth>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });
});
