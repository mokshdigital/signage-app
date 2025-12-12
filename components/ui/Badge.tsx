'use client';

import { ReactNode } from 'react';

export interface BadgeProps {
    /** Visual style variant */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
    /** Badge size */
    size?: 'sm' | 'md' | 'lg';
    /** Badge content */
    children?: ReactNode;
    /** Optional icon */
    icon?: ReactNode;
    /** Whether the badge is a dot (shows no text) */
    dot?: boolean;
    /** Whether to show a pulse animation */
    pulse?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Badge component for status indicators and labels
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" size="sm">Pending</Badge>
 * <Badge variant="danger" dot pulse /> // Shows a pulsing red dot
 */
export function Badge({
    variant = 'default',
    size = 'md',
    children,
    icon,
    dot = false,
    pulse = false,
    className = '',
}: BadgeProps) {
    const variants = {
        default: 'bg-gray-100 text-gray-700 ring-gray-500/10',
        success: 'bg-green-50 text-green-700 ring-green-600/20',
        warning: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
        danger: 'bg-red-50 text-red-700 ring-red-600/20',
        info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    const dotColors = {
        default: 'bg-gray-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
        purple: 'bg-purple-500',
    };

    if (dot) {
        return (
            <span className={`relative inline-flex ${className}`}>
                <span
                    className={`
                        h-2.5 w-2.5 rounded-full ${dotColors[variant]}
                        ${pulse ? 'animate-pulse' : ''}
                    `.replace(/\s+/g, ' ').trim()}
                />
                {pulse && (
                    <span
                        className={`
                            absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping
                            ${dotColors[variant]}
                        `.replace(/\s+/g, ' ').trim()}
                    />
                )}
            </span>
        );
    }

    return (
        <span
            className={`
                inline-flex items-center gap-1 font-medium rounded-full ring-1 ring-inset
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
}

/**
 * Utility function to get badge variant from status string
 */
export function getStatusVariant(status: string): BadgeProps['variant'] {
    const statusMap: Record<string, BadgeProps['variant']> = {
        'available': 'success',
        'active': 'success',
        'completed': 'success',
        'processed': 'success',
        'in-use': 'info',
        'in_use': 'info',
        'busy': 'info',
        'maintenance': 'warning',
        'pending': 'warning',
        'processing': 'warning',
        'inactive': 'default',
        'error': 'danger',
        'failed': 'danger',
        'unavailable': 'danger',
    };

    return statusMap[status.toLowerCase()] || 'default';
}
