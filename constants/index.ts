/**
 * Application-wide constants and configuration
 * Centralized location for magic numbers, strings, and configuration values
 */

// =============================================================================
// APP CONFIGURATION
// =============================================================================

export const APP_CONFIG = {
    /** Application name */
    APP_NAME: 'Tops Lighting',

    /** Maximum number of associated files per work order (excluding main file) */
    MAX_ASSOCIATED_FILES: 9,

    /** Maximum file size for uploads (in MB) */
    MAX_FILE_SIZE_MB: 10,

    /** Supported file types for work order uploads */
    SUPPORTED_FILE_TYPES: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp',

    /** Supported image extensions (without dot) */
    SUPPORTED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],

    /** Supported document extensions (without dot) */
    SUPPORTED_DOCUMENT_TYPES: ['pdf', 'doc', 'docx'],

    /** Debounce delay for search inputs (in ms) */
    SEARCH_DEBOUNCE_MS: 300,

    /** Default pagination page size */
    DEFAULT_PAGE_SIZE: 10,

    /** Toast notification duration (in ms) */
    TOAST_DURATION_MS: 4000,
} as const;

// =============================================================================
// STATUS OPTIONS
// =============================================================================

export const STATUS_OPTIONS = {
    /** Equipment status options */
    EQUIPMENT: ['available', 'in-use', 'maintenance'] as const,

    /** Vehicle status options */
    VEHICLE: ['available', 'in-use', 'maintenance'] as const,

    /** Work order processing status */
    WORK_ORDER: ['pending', 'processed', 'failed'] as const,
} as const;

/** Status colors for UI badges */
export const STATUS_COLORS = {
    available: 'success',
    'in-use': 'info',
    maintenance: 'warning',
    pending: 'warning',
    processed: 'success',
    failed: 'danger',
} as const;

// =============================================================================
// ROUTES
// =============================================================================

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    ONBOARDING: '/onboarding',
    DASHBOARD: '/dashboard',
    TECHNICIANS: '/dashboard/technicians',
    EQUIPMENT: '/dashboard/equipment',
    VEHICLES: '/dashboard/vehicles',
    WORK_ORDERS: '/dashboard/work-orders',
} as const;

// =============================================================================
// NAVIGATION
// =============================================================================

export const NAV_ITEMS = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: '📊' },
    { name: 'Technicians', href: ROUTES.TECHNICIANS, icon: '👷' },
    { name: 'Equipment', href: ROUTES.EQUIPMENT, icon: '🔧' },
    { name: 'Vehicles', href: ROUTES.VEHICLES, icon: '🚗' },
    { name: 'Work Orders', href: ROUTES.WORK_ORDERS, icon: '📋' },
] as const;

// =============================================================================
// API ENDPOINTS
// =============================================================================

export const API_ENDPOINTS = {
    PROCESS_WORK_ORDER: '/api/process-work-order',
} as const;

// =============================================================================
// STORAGE BUCKETS
// =============================================================================

export const STORAGE_BUCKETS = {
    WORK_ORDERS: 'work-orders',
    USER_AVATARS: 'user-avatars',
} as const;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export const ERROR_MESSAGES = {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION: 'Please check your input and try again.',
    FILE_TOO_LARGE: `File size exceeds ${APP_CONFIG.MAX_FILE_SIZE_MB}MB limit.`,
    UNSUPPORTED_FILE: 'This file type is not supported.',
} as const;

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

export const SUCCESS_MESSAGES = {
    CREATED: 'Successfully created!',
    UPDATED: 'Successfully updated!',
    DELETED: 'Successfully deleted!',
    SAVED: 'Changes saved!',
    UPLOADED: 'File uploaded successfully!',
    PROCESSED: 'Processing complete!',
} as const;
