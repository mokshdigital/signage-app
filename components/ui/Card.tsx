'use client';

import { ReactNode } from 'react';

export interface CardProps {
    /** Card title */
    title?: string;
    /** Subtitle or description */
    subtitle?: string;
    /** Card content */
    children: ReactNode;
    /** Actions to display in the header (e.g., buttons) */
    headerActions?: ReactNode;
    /** Footer content */
    footer?: ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Whether to add padding to the body */
    noPadding?: boolean;
    /** Whether to add hover effect */
    hoverable?: boolean;
    /** Click handler */
    onClick?: () => void;
}

/**
 * Card component for grouping related content
 * 
 * @example
 * <Card title="Team Members" headerActions={<Button>Add</Button>}>
 *   <UserList users={users} />
 * </Card>
 */
export function Card({
    title,
    subtitle,
    children,
    headerActions,
    footer,
    className = '',
    noPadding = false,
    hoverable = false,
    onClick,
}: CardProps) {
    const hasHeader = title || subtitle || headerActions;

    return (
        <div
            className={`
                bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
                ${hoverable ? 'hover:shadow-md hover:border-gray-300 transition-all duration-200' : ''}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {hasHeader && (
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start gap-4">
                    <div>
                        {title && (
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    {headerActions && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {headerActions}
                        </div>
                    )}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    {footer}
                </div>
            )}
        </div>
    );
}
