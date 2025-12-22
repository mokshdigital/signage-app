'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
    display_name: string
    email: string | null
    avatar_url: string | null
}

export default function ClientDashboardPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/client-login')
                return
            }

            const { data } = await supabase
                .from('user_profiles')
                .select('display_name, email, avatar_url')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile(data)
            }
            setLoading(false)
        }

        loadProfile()
    }, [supabase, router])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/client-login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                TL
                            </div>
                            <span className="text-white font-semibold text-lg">Client Portal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {profile && (
                                <span className="text-blue-200 text-sm">
                                    Welcome, {profile.display_name}
                                </span>
                            )}
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 text-sm text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Welcome to Your Dashboard
                    </h1>
                    <p className="text-blue-200 text-lg mb-8">
                        Track your projects and stay updated on work order progress.
                    </p>

                    {/* Placeholder Content */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="text-4xl mb-4">📋</div>
                            <h3 className="text-white font-semibold text-lg mb-2">Active Projects</h3>
                            <p className="text-blue-200/70 text-sm">
                                View your current work orders and project status.
                            </p>
                            <p className="text-blue-300 text-xs mt-4 italic">Coming soon...</p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="text-4xl mb-4">📄</div>
                            <h3 className="text-white font-semibold text-lg mb-2">Documents</h3>
                            <p className="text-blue-200/70 text-sm">
                                Access work order files, quotes, and project documents.
                            </p>
                            <p className="text-blue-300 text-xs mt-4 italic">Coming soon...</p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="text-4xl mb-4">💬</div>
                            <h3 className="text-white font-semibold text-lg mb-2">Messages</h3>
                            <p className="text-blue-200/70 text-sm">
                                Communicate with your project team.
                            </p>
                            <p className="text-blue-300 text-xs mt-4 italic">Coming soon...</p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-12 pt-8 border-t border-white/10">
                        <h2 className="text-white font-semibold text-lg mb-4">Need Assistance?</h2>
                        <p className="text-blue-200/70">
                            Contact your project manager or reach out to us at{' '}
                            <a href="mailto:support@topslighting.com" className="text-blue-400 hover:text-blue-300 underline">
                                support@topslighting.com
                            </a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
