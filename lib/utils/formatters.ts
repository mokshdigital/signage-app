/**
 * Formatting utility functions
 * Used across the app for consistent data display
 */

/**
 * Format a date string to locale string
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "12/11/2024, 6:00:00 PM")
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
}

/**
 * Format a date string to a short date format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Dec 11, 2024")
 */
export function formatDateShort(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format a date string to relative time
 * @param dateString - ISO date string
 * @returns Relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;

    return formatDateShort(dateString);
}

/**
 * Format file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/**
 * Truncate a string to a specified length
 * @param str - Input string
 * @param length - Maximum length
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, length: number): string {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * Format a phone number to a standard format
 * @param phone - Raw phone number
 * @returns Formatted phone number (e.g., "(555) 123-4567")
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone; // Return original if not a standard format
}

/**
 * Capitalize the first letter of a string
 * @param str - Input string
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert a string to title case
 * @param str - Input string
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format a number with commas as thousands separators
 * @param num - Input number
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
    return num.toLocaleString();
}

/**
 * Format currency
 * @param amount - Amount in dollars
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}

/**
 * Format a date string or timestamp to DD-MMM-YYYY
 * @param date - Date string, timestamp, or Date object
 * @returns Formatted date string (e.g., 18-Dec-2025)
 */
export function formatTableDate(date: string | number | Date | null | undefined): string {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
}
