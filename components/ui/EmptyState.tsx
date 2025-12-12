'use client';

import { ReactNode } from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
    /** Icon or emoji to display */
    icon?: ReactNode;
    /** Main title */
    title: string;
    /** Description text */
    description?: string;
    /** Primary action button */
    action?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
    };
    /** Secondary action button */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Whether to use compact styling */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Empty state component for when there's no data to display
 * 
 * @example
 * <EmptyState 
 *   icon="📋"
 *   title="No work orders yet"
 *   description="Upload your first work order to get started"
 *   action={{ label: "Upload Work Order", onClick: () => setShowUpload(true) }}
 * />
 */
export function EmptyState({
    icon = '📭',
    title,
    description,
    action,
    secondaryAction,
    compact = false,
    className = '',
}: EmptyStateProps) {
    return (
        <div
            className={`
                text-center
                ${compact ? 'py-8' : 'py-16'}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
        >
            {/* Icon */}
            <div className={`${compact ? 'text-4xl mb-3' : 'text-6xl mb-4'}`}>
                {typeof icon === 'string' ? (
                    <span role="img" aria-hidden="true">{icon}</span>
                ) : (
                    icon
                )}
            </div>

            {/* Title */}
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className={`mt-2 text-gray-500 max-w-md mx-auto ${compact ? 'text-sm' : 'text-base'}`}>
                    {description}
                </p>
            )}

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className={`flex items-center justify-center gap-3 ${compact ? 'mt-4' : 'mt-6'}`}>
                    {action && (
                        <Button
                            onClick={action.onClick}
                            leftIcon={action.icon}
                            size={compact ? 'sm' : 'md'}
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant="ghost"
                            size={compact ? 'sm' : 'md'}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Error state component for displaying errors
 */
export function ErrorState({
    title = 'Something went wrong',
    description = 'An error occurred while loading this content.',
    onRetry,
    className = '',
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <EmptyState
            icon="❌"
            title={title}
            description={description}
            action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
            className={className}
        />
    );
}

/**
 * No results state for search/filter scenarios
 */
export function NoResults({
    searchTerm,
    onClear,
    className = '',
}: {
    searchTerm?: string;
    onClear?: () => void;
    className?: string;
}) {
    return (
        <EmptyState
            icon="🔍"
            title="No results found"
            description={searchTerm ? `No results for "${searchTerm}". Try adjusting your search.` : 'Try adjusting your filters.'}
            action={onClear ? { label: 'Clear Search', onClick: onClear } : undefined}
            className={className}
        />
    );
}
