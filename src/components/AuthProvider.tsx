'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  phone: string;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, phone: '', loading: true, isAdmin: false,
  signOut: () => {}
});

// Extract real phone from Supabase email (format: 13812345678@lc.local)
function emailToPhone(email: string): string {
  if (email.endsWith('@lc.local')) return email.replace('@lc.local', '');
  return email; // fallback for admin email login
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE || '';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const phone = user?.email ? emailToPhone(user.email) : '';

  // Admin: matched by phone number OR email (for admin email login)
  const isAdmin = !!(user?.email && (
    (adminPhone && emailToPhone(user.email) === adminPhone) ||
    (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
  ));

  const signOut = () => {
    supabase.auth.signOut().then(() => {
      window.location.href = '/';
    });
  };

  return (
    <AuthContext.Provider value={{ user, phone, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
