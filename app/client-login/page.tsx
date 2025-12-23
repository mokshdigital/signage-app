'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClientLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Attempt sign in with email/password
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            setError(signInError.message === 'Invalid login credentials'
                ? 'Invalid email or password. Please try again.'
                : signInError.message)
            setLoading(false)
            return
        }

        if (!data.user) {
            setError('Authentication failed. Please try again.')
            setLoading(false)
            return
        }

        // Verify user is external
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_type, is_active')
            .eq('id', data.user.id)
            .single()

        if (profileError || !profile) {
            await supabase.auth.signOut()
            setError('Account not found. Please contact support.')
            setLoading(false)
            return
        }

        // Check if account is active
        if (!profile.is_active) {
            await supabase.auth.signOut()
            setError('Your account has been deactivated. Please contact support.')
            setLoading(false)
            return
        }

        // Check if user is external
        if (profile.user_type !== 'external') {
            await supabase.auth.signOut()
            setError('Unauthorized access. This portal is for clients only.')
            setLoading(false)
            return
        }

        // Success - redirect to client dashboard
        router.push('/client-dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-8 border border-white/20">
                    {/* Logo & Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                TL
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            Client Portal
                        </h1>
                        <p className="mt-2 text-lg text-blue-200">
                            Tops Lighting
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Help text */}
                    <div className="text-center">
                        <p className="text-sm text-blue-200/70">
                            Need access? Contact your project manager at Tops Lighting.
                        </p>
                    </div>
                </div>

                {/* Branding */}
                <p className="mt-8 text-center text-sm text-blue-300/50">
                    © {new Date().getFullYear()} Tops Lighting. All rights reserved.
                </p>
            </div>
        </div>
    )
}
