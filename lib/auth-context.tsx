'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from './supabase';

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

    // Use useMemo to ensure we only create one client instance
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        console.log('AuthProvider: Initializing...');

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('AuthProvider: Got initial session', session?.user?.email || 'none');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('AuthProvider: Auth state changed', event, session?.user?.email || 'none');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signIn = async (email: string, password: string) => {
        console.log('AuthProvider: signIn called with', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        console.log('AuthProvider: signInWithPassword result', { data, error });

        if (!error && data.session) {
            setSession(data.session);
            setUser(data.user);
        }

        return { error };
    };


    const signUp = async (email: string, password: string, fullName: string) => {
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
            throw error;
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
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
