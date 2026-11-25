import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  fetchAdminProfileForUser,
  signInAdmin,
  signOutAdmin,
} from '../services/authService';
import type { AdminProfile } from '../types';

interface AuthContextValue {
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AdminProfile>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function hydrateSession() {
      try {
        const {
          data: { session },
        } = await supabase!.auth.getSession();

        if (!session?.user) {
          if (mounted) setAdminProfile(null);
          return;
        }

        const profile = await fetchAdminProfileForUser(session.user.id);
        if (!profile) {
          await supabase!.auth.signOut();
          if (mounted) setAdminProfile(null);
        } else if (mounted) {
          setAdminProfile(profile);
        }
      } catch {
        if (mounted) setAdminProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        if (mounted) {
          setAdminProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await fetchAdminProfileForUser(session.user.id);
        if (mounted) {
          setAdminProfile(profile);
        }
      } catch {
        if (mounted) {
          setAdminProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const profile = await signInAdmin(email, password);
    setAdminProfile(profile);
    return profile;
  }, []);

  const signOut = useCallback(async () => {
    await signOutAdmin();
    setAdminProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      adminProfile,
      isAdmin: Boolean(adminProfile),
      loading,
      signIn,
      signOut,
    }),
    [adminProfile, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
