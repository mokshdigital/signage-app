'use client';

import { ReactNode, useState, useMemo } from 'react';
import { LoadingSpinner, TableSkeleton } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

export interface Column<T> {
    /** Unique key for the column */
    key: string;
    /** Header label */
    header: string;
    /** Custom render function for cell content */
    render?: (item: T, index: number) => ReactNode;
    /** Cell alignment */
    align?: 'left' | 'center' | 'right';
    /** Additional CSS classes for the cell */
    className?: string;
    /** Whether the column is sortable */
    sortable?: boolean;
    /** Width (e.g., '200px', '20%') */
    width?: string;
}

export interface DataTableProps<T> {
    /** Data array to display */
    data: T[];
    /** Column definitions */
    columns: Column<T>[];
    /** Function to extract unique key from each item */
    keyExtractor: (item: T) => string;
    /** Whether data is loading */
    loading?: boolean;
    /** Message to show when data is empty */
    emptyMessage?: string;
    /** Empty state description */
    emptyDescription?: string;
    /** Empty state action */
    emptyAction?: {
        label: string;
        onClick: () => void;
    };
    /** Called when a row is clicked */
    onRowClick?: (item: T) => void;
    /** Whether to show row hover effect */
    hoverable?: boolean;
    /** Whether rows are striped */
    striped?: boolean;
    /** Whether to show borders between cells */
    bordered?: boolean;
    /** Compact mode with smaller padding */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Generic data table component with sorting, loading states, and customizable columns
 * 
 * @example
 * <DataTable
 *   data={technicians}
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'email', header: 'Email' },
 *     { key: 'status', header: 'Status', render: (item) => <Badge>{item.status}</Badge> },
 *   ]}
 *   keyExtractor={(item) => item.id}
 *   loading={isLoading}
 *   onRowClick={(item) => router.push(`/technicians/${item.id}`)}
 * />
 */
export function DataTable<T>({
    data,
    columns,
    keyExtractor,
    loading = false,
    emptyMessage = 'No data found',
    emptyDescription,
    emptyAction,
    onRowClick,
    hoverable = true,
    striped = false,
    bordered = false,
    compact = false,
    className = '',
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Handle sorting
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortKey) return data;

        return [...data].sort((a, b) => {
            const aValue = (a as any)[sortKey];
            const bValue = (b as any)[sortKey];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortKey, sortDirection]);

    // Loading state
    if (loading) {
        return (
            <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
                <TableSkeleton rows={5} columns={columns.length} />
            </div>
        );
    }

    // Empty state
    if (data.length === 0) {
        return (
            <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
                <EmptyState
                    icon="📭"
                    title={emptyMessage}
                    description={emptyDescription}
                    action={emptyAction}
                    compact
                />
            </div>
        );
    }

    const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';
    const headerPadding = compact ? 'px-4 py-2' : 'px-6 py-3';

    return (
        <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`
                                        ${headerPadding}
                                        text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
                                        ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                                        ${column.align === 'center' ? 'text-center' : ''}
                                        ${column.align === 'right' ? 'text-right' : ''}
                                    `.replace(/\s+/g, ' ').trim()}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {column.header}
                                        {column.sortable && (
                                            <span className="text-gray-400">
                                                {sortKey === column.key ? (
                                                    sortDirection === 'asc' ? '↑' : '↓'
                                                ) : (
                                                    '↕'
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedData.map((item, rowIndex) => (
                            <tr
                                key={keyExtractor(item)}
                                className={`
                                    ${hoverable ? 'hover:bg-gray-50' : ''}
                                    ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                    transition-colors duration-150
                                `.replace(/\s+/g, ' ').trim()}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={`${keyExtractor(item)}-${column.key}`}
                                        className={`
                                            ${cellPadding}
                                            text-sm text-gray-900
                                            ${bordered ? 'border-r border-gray-100 last:border-r-0' : ''}
                                            ${column.align === 'center' ? 'text-center' : ''}
                                            ${column.align === 'right' ? 'text-right' : ''}
                                            ${column.className || ''}
                                        `.replace(/\s+/g, ' ').trim()}
                                    >
                                        {column.render
                                            ? column.render(item, rowIndex)
                                            : ((item as any)[column.key] as ReactNode) ?? '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
