/**
 * General helper utility functions
 */

/**
 * Generate a unique ID
 * @returns A unique string ID
 */
export function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Delay execution for a specified time
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delayMs: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | undefined;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => fn(...args), delayMs);
    };
}

/**
 * Throttle a function
 * @param fn - Function to throttle
 * @param limitMs - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limitMs: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limitMs);
        }
    };
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value - Value to check
 * @returns true if value is empty
 */
export function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Safely access nested object properties
 * @param obj - Object to access
 * @param path - Dot-notation path (e.g., "user.profile.name")
 * @param defaultValue - Default value if path doesn't exist
 * @returns Value at path or default value
 */
export function get<T>(obj: unknown, path: string, defaultValue?: T): T | undefined {
    const keys = path.split('.');
    let result: unknown = obj;

    for (const key of keys) {
        if (result === null || result === undefined) {
            return defaultValue;
        }
        result = (result as Record<string, unknown>)[key];
    }

    return (result as T) ?? defaultValue;
}

/**
 * Group an array of objects by a key
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Object with grouped arrays
 */
export function groupBy<T extends Record<string, unknown>>(
    array: T[],
    key: keyof T
): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {} as Record<string, T[]>);
}

/**
 * Remove duplicates from an array
 * @param array - Array with possible duplicates
 * @param key - Optional key to check for object arrays
 * @returns Array without duplicates
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
    if (key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    return [...new Set(array)];
}

/**
 * Sort an array of objects by a key
 * @param array - Array to sort
 * @param key - Key to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortBy<T extends Record<string, unknown>>(
    array: T[],
    key: keyof T,
    order: 'asc' | 'desc' = 'asc'
): T[] {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
    });
}

/**
 * Convert a comma-separated string to an array
 * @param str - Comma-separated string
 * @returns Array of trimmed strings
 */
export function csvToArray(str: string): string[] {
    if (!str) return [];
    return str
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

/**
 * Convert an array to a comma-separated string
 * @param arr - Array of strings
 * @returns Comma-separated string
 */
export function arrayToCsv(arr: string[]): string {
    return arr.filter(Boolean).join(', ');
}

/**
 * Safely render any value as a string (handles objects)
 * @param value - Any value
 * @returns String representation
 */
export function safeRender(value: unknown): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value, null, 2);
}

/**
 * Format a date string or timestamp to DD-MMM-YYYY
 * @param date - Date string, timestamp, or Date object
 * @returns Formatted date string (e.g., 18-Dec-2025)
 */
export function formatDate(date: string | number | Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
}
