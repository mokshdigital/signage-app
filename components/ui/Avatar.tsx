'use client';

import { ReactNode } from 'react';

export interface AvatarProps {
    /** Image source URL */
    src?: string | null;
    /** Alt text for the image */
    alt?: string;
    /** Fallback text (initials) when no image */
    fallback?: string;
    /** Avatar size */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Whether to show a status indicator */
    status?: 'online' | 'offline' | 'away' | 'busy';
    /** Shape of the avatar */
    shape?: 'circle' | 'rounded';
    /** Additional CSS classes */
    className?: string;
}

/**
 * Avatar component for displaying user images with fallback
 * 
 * @example
 * <Avatar src={user.avatarUrl} alt={user.name} fallback="JD" />
 * <Avatar fallback="TL" size="lg" status="online" />
 */
export function Avatar({
    src,
    alt = '',
    fallback,
    size = 'md',
    status,
    shape = 'circle',
    className = '',
}: AvatarProps) {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-14 h-14 text-lg',
        xl: 'w-20 h-20 text-2xl',
    };

    const statusSizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3.5 h-3.5',
        xl: 'w-4 h-4',
    };

    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
    };

    const shapeClasses = {
        circle: 'rounded-full',
        rounded: 'rounded-lg',
    };

    // Generate initials from fallback or alt
    const getInitials = () => {
        if (fallback) return fallback.slice(0, 2).toUpperCase();
        if (alt) {
            const words = alt.split(' ').filter(Boolean);
            if (words.length >= 2) {
                return (words[0][0] + words[1][0]).toUpperCase();
            }
            return alt.slice(0, 2).toUpperCase();
        }
        return '?';
    };

    // Generate consistent background color from initials
    const getBackgroundColor = () => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-cyan-500',
            'bg-orange-500',
            'bg-teal-500',
        ];
        const initials = getInitials();
        const index = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
        return colors[index];
    };

    return (
        <div className={`relative inline-flex ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className={`
                        object-cover
                        ${sizes[size]}
                        ${shapeClasses[shape]}
                    `.replace(/\s+/g, ' ').trim()}
                />
            ) : (
                <div
                    className={`
                        flex items-center justify-center text-white font-semibold
                        ${sizes[size]}
                        ${shapeClasses[shape]}
                        ${getBackgroundColor()}
                    `.replace(/\s+/g, ' ').trim()}
                    aria-label={alt}
                >
                    {getInitials()}
                </div>
            )}

            {status && (
                <span
                    className={`
                        absolute bottom-0 right-0 block rounded-full ring-2 ring-white
                        ${statusSizes[size]}
                        ${statusColors[status]}
                    `.replace(/\s+/g, ' ').trim()}
                    aria-label={status}
                />
            )}
        </div>
    );
}

/**
 * Avatar group for showing multiple avatars stacked
 */
export function AvatarGroup({
    children,
    max = 4,
    size = 'md',
}: {
    children: ReactNode[];
    max?: number;
    size?: AvatarProps['size'];
}) {
    const displayed = children.slice(0, max);
    const remaining = children.length - max;

    const overlapSizes = {
        xs: '-ml-1.5',
        sm: '-ml-2',
        md: '-ml-2.5',
        lg: '-ml-3',
        xl: '-ml-4',
    };

    return (
        <div className="flex items-center">
            {displayed.map((child, index) => (
                <div
                    key={index}
                    className={`
                        relative inline-block ring-2 ring-white rounded-full
                        ${index > 0 ? overlapSizes[size] : ''}
                    `.replace(/\s+/g, ' ').trim()}
                    style={{ zIndex: displayed.length - index }}
                >
                    {child}
                </div>
            ))}
            {remaining > 0 && (
                <div
                    className={`
                        relative inline-block ring-2 ring-white rounded-full
                        ${overlapSizes[size]}
                    `.replace(/\s+/g, ' ').trim()}
                >
                    <Avatar
                        fallback={`+${remaining}`}
                        size={size}
                    />
                </div>
            )}
        </div>
    );
}
