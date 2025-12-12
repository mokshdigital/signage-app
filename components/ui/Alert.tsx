'use client';

import { ReactNode } from 'react';

export interface AlertProps {
    /** Alert type/variant */
    variant?: 'info' | 'success' | 'warning' | 'error';
    /** Alert title */
    title?: string;
    /** Alert message */
    children: ReactNode;
    /** Whether the alert can be dismissed */
    dismissible?: boolean;
    /** Called when alert is dismissed */
    onDismiss?: () => void;
    /** Custom icon */
    icon?: ReactNode;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Alert/notification component for inline messages
 * 
 * @example
 * <Alert variant="success" title="Success!">Your changes have been saved.</Alert>
 * <Alert variant="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>
 */
export function Alert({
    variant = 'info',
    title,
    children,
    dismissible = false,
    onDismiss,
    icon,
    className = '',
}: AlertProps) {
    const variants = {
        info: {
            container: 'bg-blue-50 border-blue-200 text-blue-800',
            icon: 'ℹ️',
            title: 'text-blue-800',
            dismiss: 'text-blue-600 hover:bg-blue-100',
        },
        success: {
            container: 'bg-green-50 border-green-200 text-green-800',
            icon: '✅',
            title: 'text-green-800',
            dismiss: 'text-green-600 hover:bg-green-100',
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            icon: '⚠️',
            title: 'text-yellow-800',
            dismiss: 'text-yellow-600 hover:bg-yellow-100',
        },
        error: {
            container: 'bg-red-50 border-red-200 text-red-800',
            icon: '❌',
            title: 'text-red-800',
            dismiss: 'text-red-600 hover:bg-red-100',
        },
    };

    const config = variants[variant];

    return (
        <div
            className={`
                rounded-lg border p-4 flex gap-3
                ${config.container}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            role="alert"
        >
            {/* Icon */}
            <div className="flex-shrink-0 text-lg">
                {icon || config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={`font-semibold ${config.title}`}>
                        {title}
                    </h4>
                )}
                <div className={title ? 'mt-1 text-sm' : 'text-sm'}>
                    {children}
                </div>
            </div>

            {/* Dismiss button */}
            {dismissible && onDismiss && (
                <button
                    onClick={onDismiss}
                    className={`
                        flex-shrink-0 rounded-lg p-1.5 -mr-1.5 -mt-1.5
                        transition-colors
                        ${config.dismiss}
                    `.replace(/\s+/g, ' ').trim()}
                    aria-label="Dismiss"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
