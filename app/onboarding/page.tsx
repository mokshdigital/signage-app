'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface FormErrors {
    display_name?: string;
    phone?: string;
    alternate_email?: string;
    avatar?: string;
}

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // User state
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

    // Form state
    const [displayName, setDisplayName] = useState('')
    const [phone, setPhone] = useState('')
    const [alternateEmail, setAlternateEmail] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    // Error state
    const [errors, setErrors] = useState<FormErrors>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Current step state for multi-step form feel
    const [currentStep, setCurrentStep] = useState(1)
    const totalSteps = 3

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

            // Pre-fill name from Google if available
            if (user.user_metadata?.full_name) {
                setDisplayName(user.user_metadata.full_name)
            } else if (user.user_metadata?.name) {
                setDisplayName(user.user_metadata.name)
            }

            // Pre-fill avatar from Google if available
            if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
                const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
                setAvatarPreview(googleAvatar)
                setAvatarUrl(googleAvatar)
            }

            // Check if profile already exists and is complete
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile?.onboarding_completed) {
                router.push('/dashboard')
                return
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
            if (!displayName.trim()) {
                newErrors.display_name = 'Name is required'
            } else if (displayName.trim().length < 2) {
                newErrors.display_name = 'Name must be at least 2 characters'
            }
        }

        if (step === 2) {
            if (!phone.trim()) {
                newErrors.phone = 'Phone number is required'
            } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(phone.trim())) {
                newErrors.phone = 'Please enter a valid phone number'
            }

            if (alternateEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alternateEmail.trim())) {
                newErrors.alternate_email = 'Please enter a valid email address'
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file
        if (!file.type.startsWith('image/')) {
            setErrors({ ...errors, avatar: 'Please select an image file' })
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors({ ...errors, avatar: 'Image must be less than 5MB' })
            return
        }

        setUploadingImage(true)
        setErrors({ ...errors, avatar: undefined })

        try {
            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string)
            }
            reader.readAsDataURL(file)

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('user-avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) {
                // If bucket doesn't exist, we'll use the preview URL
                console.warn('Storage upload failed, using data URL:', uploadError)
                // Keep the preview as avatar URL for now
                setAvatarUrl(null) // Will use preview
            } else {
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('user-avatars')
                    .getPublicUrl(filePath)

                setAvatarUrl(publicUrl)
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            setErrors({ ...errors, avatar: 'Failed to upload image' })
        } finally {
            setUploadingImage(false)
        }
    }

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return
        if (!user) return

        setSubmitting(true)
        setSubmitError(null)

        try {
            // Find invitation for this user
            const { data: invitation } = await supabase
                .from('invitations')
                .select('*, role:roles(user_type)')
                .ilike('email', user.email || '')
                .is('claimed_at', null)
                .maybeSingle()

            // Determine user_type from the role
            // The role.user_type is the source of truth for internal/external classification
            // Default to 'internal' if no role is assigned (e.g., uninvited user)
            const userType = invitation?.role?.user_type || 'internal'

            // Use avatarUrl if uploaded, or keep the Google avatar
            const finalAvatarUrl = avatarUrl || avatarPreview

            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    display_name: displayName.trim(),
                    avatar_url: finalAvatarUrl,
                    phone: phone.trim(),
                    alternate_email: alternateEmail.trim() || null,

                    // Fields from invitation or defaults
                    user_type: userType,
                    role_id: invitation?.role_id || null,
                    title: invitation?.job_title || null,

                    onboarding_completed: true,
                })

            if (error) throw error

            // If we used an invitation, mark it as claimed
            if (invitation) {
                await supabase
                    .from('invitations')
                    .update({
                        claimed_at: new Date().toISOString(),
                        claimed_by: user.id
                    })
                    .eq('id', invitation.id)
            }

            // Redirect to dashboard
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                TL
                            </div>
                        </div>
                    </div>
                    <p className="mt-6 text-blue-200 font-medium">Setting up your account...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-lg">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3].map((step) => (
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
                            {currentStep === 1 && "Welcome to Tops Lighting!"}
                            {currentStep === 2 && "Contact Information"}
                            {currentStep === 3 && "Review Your Profile"}
                        </h1>
                        <p className="text-blue-200/80">
                            {currentStep === 1 && "Let's set up your profile to get started"}
                            {currentStep === 2 && "How can we reach you?"}
                            {currentStep === 3 && "Everything look good?"}
                        </p>
                    </div>

                    {/* Form content */}
                    <div className="px-8 py-6">
                        {/* Step 1: Name & Avatar */}
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
                                    <p className="mt-3 text-sm text-blue-200/60">
                                        Click to upload your photo
                                    </p>
                                    {errors.avatar && (
                                        <p className="mt-1 text-sm text-red-400">{errors.avatar}</p>
                                    )}
                                </div>

                                {/* Display Name */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Full Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className={`w-full px-4 py-3 bg-white/10 border ${errors.display_name ? 'border-red-500' : 'border-white/20'
                                            } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    />
                                    {errors.display_name && (
                                        <p className="mt-2 text-sm text-red-400">{errors.display_name}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Contact Info */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
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

                                {/* Alternate Email */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Alternate Email <span className="text-slate-400">(optional)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            value={alternateEmail}
                                            onChange={(e) => setAlternateEmail(e.target.value)}
                                            placeholder="alternate@example.com"
                                            className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${errors.alternate_email ? 'border-red-500' : 'border-white/20'
                                                } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                        />
                                    </div>
                                    {errors.alternate_email && (
                                        <p className="mt-2 text-sm text-red-400">{errors.alternate_email}</p>
                                    )}
                                    <p className="mt-2 text-xs text-slate-400">
                                        Your primary email ({user?.email}) will be used for sign-in
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                {/* Profile Card Preview */}
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/20">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                                                    <span className="text-2xl text-white font-bold">
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white">{displayName}</h3>
                                            <p className="text-blue-200/60 text-sm">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    Title pending
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">Primary Email</p>
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

                                        {alternateEmail && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs">Alternate Email</p>
                                                    <p className="text-white">{alternateEmail}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info Note */}
                                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-amber-200 text-sm font-medium">Your role will be assigned by an administrator</p>
                                        <p className="text-amber-200/60 text-xs mt-1">
                                            You&apos;ll get access to features based on your assigned role.
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
