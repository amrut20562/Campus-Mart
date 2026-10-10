// CampusMart Phase 1 — Authentication Context (AUTH-01, AUTH-02, AUTH-03)
// - Initialises auth state before rendering protected pages
// - Shows loading while session resolves
// - Admin status is read from user_roles table, NOT from a profile field

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database.types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's role from user_roles table (AUTH-03: not a client-editable field)
  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Role fetch failure is non-fatal; user is treated as non-admin
      console.warn('Could not fetch user role:', error.message);
      setUserRole('student');
      return;
    }
    setUserRole(data?.role ?? 'student');
  }, []);

  useEffect(() => {
    // Initialize auth state before rendering (AUTH-03)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setLoading(true);
          await fetchUserRole(newSession.user.id);
          setLoading(false);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRole,
        isAdmin: userRole === 'admin',
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
