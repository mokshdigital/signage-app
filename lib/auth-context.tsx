'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from './supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; needsConfirmation?: boolean }>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Use useMemo to ensure we only create one client instance
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signIn = async (email: string, password: string) => {
        console.log('[Auth] signIn called with email:', email);
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        console.log('[Auth] signInWithPassword result:', { data, error });

        if (!error && data.session) {
            console.log('[Auth] Sign in successful, setting session');
            setSession(data.session);
            setUser(data.user);
        } else if (error) {
            console.error('[Auth] Sign in error:', error);
        }

        setLoading(false);
        return { error };
    };


    const signUp = async (email: string, password: string, fullName: string) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    name: fullName,
                },
            },
        });

        if (!error && data.session) {
            // User is auto-confirmed, set session
            setSession(data.session);
            setUser(data.user);
        }

        setLoading(false);
        // Check if email confirmation is required (user created but no session means confirmation needed)
        const needsConfirmation = !error && !data.session && !!data.user;
        return { error, needsConfirmation };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        router.push('/login');
    };

    const refreshSession = async () => {
        const { data: { session } } = await supabase.auth.refreshSession();
        setSession(session);
        setUser(session?.user ?? null);
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

