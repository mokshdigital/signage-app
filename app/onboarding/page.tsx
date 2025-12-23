'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
    id: string;
    display_name: string;
    nick_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    title: string | null;
    role_id: string | null;
    role: { id: string; display_name: string } | null;
    onboarding_completed: boolean;
}

interface FormErrors {
    phone?: string;
    nick_name?: string;
}

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // User & Profile state
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

    // Editable form state
    const [nickName, setNickName] = useState('')
    const [phone, setPhone] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    // Error state
    const [errors, setErrors] = useState<FormErrors>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

    // 2-step flow
    const [currentStep, setCurrentStep] = useState(1)
    const totalSteps = 2

    useEffect(() => {
        checkUserAndProfile()
    }, [])

    const checkUserAndProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUser(user)

            // Fetch existing profile with role
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*, role:roles(id, display_name)')
                .eq('id', user.id)
                .single()

            if (profileData?.onboarding_completed) {
                router.push('/dashboard')
                return
            }

            if (profileData) {
                setProfile(profileData)
                // Pre-fill editable fields
                setNickName(profileData.nick_name || '')
                setPhone(profileData.phone || '')
                // Use existing avatar or Google avatar
                const avatarSource = profileData.avatar_url ||
                    user.user_metadata?.avatar_url ||
                    user.user_metadata?.picture
                setAvatarPreview(avatarSource)
                setAvatarUrl(avatarSource)
            }

            setLoading(false)
        } catch (error) {
            console.error('Error checking user/profile:', error)
            setLoading(false)
        }
    }

    const validateStep = (step: number): boolean => {
        const newErrors: FormErrors = {}

        if (step === 1) {
            if (!phone.trim()) {
                newErrors.phone = 'Phone number is required'
            } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(phone.trim())) {
                newErrors.phone = 'Please enter a valid phone number'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps))
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !user) return

        // Validate file
        if (!file.type.startsWith('image/')) {
            setErrors({ ...errors })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors({ ...errors })
            return
        }

        setUploadingImage(true)

        // Show preview immediately
        const reader = new FileReader()
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)
        } catch (error) {
            console.error('Error uploading image:', error)
            // Keep the preview even if upload fails
        } finally {
            setUploadingImage(false)
        }
    }

    const handleSubmit = async () => {
        if (!user || !profile) return

        setSubmitting(true)
        setSubmitError(null)

        try {
            const finalAvatarUrl = avatarUrl || avatarPreview

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    nick_name: nickName.trim() || null,
                    phone: phone.trim(),
                    avatar_url: finalAvatarUrl,
                    onboarding_completed: true,
                })
                .eq('id', user.id)

            if (error) throw error

            router.push('/dashboard')
        } catch (error: any) {
            console.error('Error saving profile:', error)
            setSubmitError(error.message || 'Failed to save profile. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-blue-200">Loading your profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-lg">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        {[1, 2].map((step) => (
                            <div
                                key={step}
                                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300 ${step < currentStep
                                    ? 'bg-green-500 text-white'
                                    : step === currentStep
                                        ? 'bg-blue-600 text-white ring-4 ring-blue-600/30'
                                        : 'bg-slate-700 text-slate-400'
                                    }`}
                            >
                                {step < currentStep ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    step
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-4 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white font-bold text-2xl shadow-lg mb-4">
                            TL
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {currentStep === 1 && `Welcome, ${profile?.display_name || 'there'}!`}
                            {currentStep === 2 && "Confirm Your Profile"}
                        </h1>
                        <p className="text-blue-200/80">
                            {currentStep === 1 && "Complete your profile to get started"}
                            {currentStep === 2 && "Everything look good?"}
                        </p>
                    </div>

                    {/* Form content */}
                    <div className="px-8 py-6">
                        {/* Step 1: Avatar, Nick Name, Phone */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/20 transition-all group-hover:ring-blue-500/50">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                                                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {uploadingImage ? (
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <p className="mt-2 text-sm text-slate-400">Click to change photo</p>
                                </div>

                                {/* Display Name (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Your Name
                                    </label>
                                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70">
                                        {profile?.display_name || 'Not set'}
                                    </div>
                                </div>

                                {/* Nick Name (Editable) */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Nick Name <span className="text-slate-400">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={nickName}
                                        onChange={(e) => setNickName(e.target.value)}
                                        placeholder="What should we call you?"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">Displayed in compact views and notifications</p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Phone Number <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 (555) 123-4567"
                                            className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${errors.phone ? 'border-red-500' : 'border-white/20'
                                                } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="mt-2 text-sm text-red-400">{errors.phone}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Review */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* Profile Card */}
                                <div className="bg-white/5 rounded-2xl p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/20">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                                    <span className="text-2xl text-slate-400">
                                                        {profile?.display_name?.charAt(0) || '?'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-white">{profile?.display_name}</h3>
                                            {nickName && (
                                                <p className="text-blue-300 text-sm">&quot;{nickName}&quot;</p>
                                            )}
                                            {profile?.title && (
                                                <p className="text-slate-400 text-sm">{profile.title}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">Email</p>
                                                <p className="text-white">{user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">Phone</p>
                                                <p className="text-white">{phone}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">Role</p>
                                                <p className="text-white">{profile?.role?.display_name || 'No role assigned'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Success message */}
                                <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                    <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-green-200 text-sm font-medium">You&apos;re all set!</p>
                                        <p className="text-green-200/60 text-xs mt-1">
                                            Click &quot;Complete Setup&quot; to start using Tops Lighting.
                                        </p>
                                    </div>
                                </div>

                                {submitError && (
                                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-red-200 text-sm">{submitError}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer with buttons */}
                    <div className="px-8 pb-8 pt-2">
                        <div className="flex gap-3">
                            {currentStep > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="flex-1 px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                                >
                                    Back
                                </button>
                            )}
                            {currentStep < totalSteps ? (
                                <button
                                    onClick={handleNext}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-xl hover:from-green-500 hover:to-green-400 transition-all shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Complete Setup
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-blue-200/40">
                    © {new Date().getFullYear()} Tops Lighting. All rights reserved.
                </p>
            </div>
        </div>
    )
}
