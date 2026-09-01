import { useCallback, useEffect, useState } from 'react';
import type { AuthContextValue } from '@/context/AuthContext';
import type { AuthUser } from '@/types';
import { supabase } from '@/lib/supabase';
import { ensurePlayerProfile } from '@/services/api';

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (m.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (m.includes('email not confirmed')) {
    return 'Your email has not been confirmed yet.';
  }
  if (m.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (m.includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return message;
}

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (active && data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email ?? '',
          });
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      } else {
        setUser(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (data.user) {
      await ensurePlayerProfile(data.user.id, data.user.email ?? email);
      setUser({ id: data.user.id, email: data.user.email ?? email });
    }
  }, []);

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (data.user) {
      await ensurePlayerProfile(data.user.id, data.user.email ?? email, username);
      setUser({ id: data.user.id, email: data.user.email ?? email });
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signIn, signUp, signOut };
}
