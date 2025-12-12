'use client';

export interface LoadingSpinnerProps {
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Loading text to display */
    text?: string;
    /** Color variant */
    variant?: 'primary' | 'white' | 'gray';
    /** Whether to center in container */
    centered?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Loading spinner component for async operations
 * 
 * @example
 * <LoadingSpinner text="Loading technicians..." />
 * <LoadingSpinner size="sm" variant="white" /> // For use on dark backgrounds
 */
export function LoadingSpinner({
    size = 'md',
    text,
    variant = 'primary',
    centered = true,
    className = '',
}: LoadingSpinnerProps) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    const colors = {
        primary: 'text-blue-600',
        white: 'text-white',
        gray: 'text-gray-400',
    };

    const containerClass = centered
        ? 'flex flex-col items-center justify-center gap-3 p-8'
        : 'inline-flex items-center gap-2';

    return (
        <div className={`${containerClass} ${className}`}>
            <svg
                className={`animate-spin ${sizes[size]} ${colors[variant]}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            {text && (
                <span className={`text-sm ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>
                    {text}
                </span>
            )}
        </div>
    );
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton({
    className = '',
    width,
    height,
}: {
    className?: string;
    width?: string | number;
    height?: string | number;
}) {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
            }}
        />
    );
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-3 p-4">
            {/* Header */}
            <div className="flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <Skeleton key={colIdx} className="h-10 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
