import Link from 'next/link'

export default function UnauthorizedPage({
    searchParams,
}: {
    searchParams: { email?: string }
}) {
    const email = searchParams.email || 'your email'

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        Access Denied
                    </h1>

                    {/* Message */}
                    <p className="text-gray-300 text-center mb-6">
                        The email <span className="font-semibold text-white">{email}</span> is not
                        registered in our system.
                    </p>

                    {/* Explanation */}
                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <h2 className="text-sm font-semibold text-gray-200 mb-2">
                            How to get access:
                        </h2>
                        <ul className="text-sm text-gray-400 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">1.</span>
                                Contact your administrator to be added to the system.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">2.</span>
                                Once added, you&apos;ll receive a notification.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">3.</span>
                                Return here and sign in again with Google.
                            </li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/login"
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center transition-colors"
                        >
                            Try Again
                        </Link>
                        <a
                            href="mailto:admin@topslighting.com?subject=Access Request for Signage Dashboard&body=Hi, I would like to request access to the Signage Dashboard. My email is: "
                            className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-center transition-colors"
                        >
                            Request Access
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Tops Lighting Signage Dashboard
                </p>
            </div>
        </div>
    )
}
