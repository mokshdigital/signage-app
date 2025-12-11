'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const supabase = createClient();

            // Check if we have a hash fragment with tokens (implicit flow)
            if (typeof window !== 'undefined' && window.location.hash) {
                // The Supabase client automatically handles hash fragments
                // Just need to get the session after a short delay
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Error getting session:', sessionError);
                    setError(sessionError.message);
                    return;
                }

                if (session) {
                    // Successfully authenticated, redirect to dashboard
                    router.replace('/dashboard');
                    return;
                }
            }

            // Check for authorization code in query params (PKCE flow)
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                if (exchangeError) {
                    console.error('Error exchanging code:', exchangeError);
                    setError(exchangeError.message);
                    return;
                }

                // Successfully authenticated, redirect to dashboard
                router.replace('/dashboard');
                return;
            }

            // Check for error in URL params
            const errorParam = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            if (errorParam) {
                setError(errorDescription || errorParam);
                return;
            }

            // If we have neither code nor hash, try to get existing session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                router.replace('/dashboard');
            } else {
                // No session found, redirect to login
                router.replace('/login');
            }
        };

        handleCallback();
    }, [router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
                <p className="text-gray-600 mt-2">Please wait while we authenticate you.</p>
            </div>
        </div>
    );
}
