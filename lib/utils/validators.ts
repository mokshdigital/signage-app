/**
 * Validation utility functions
 * Used for form validation and data validation across the app
 */

/**
 * Check if a value is not empty (required field validation)
 * @param value - Value to check
 * @returns true if value is not empty
 */
export function isRequired(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if email is valid
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate phone number format
 * Accepts various formats: (555) 123-4567, 555-123-4567, +1 555 123 4567, etc.
 * @param phone - Phone number to validate
 * @returns true if phone number is valid
 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return false;
    // Remove all non-digit characters and check length
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validate minimum length
 * @param value - Value to check
 * @param minLength - Minimum required length
 * @returns true if value meets minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
    return value.trim().length >= minLength;
}

/**
 * Validate maximum length
 * @param value - Value to check
 * @param maxLength - Maximum allowed length
 * @returns true if value is within maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
    return value.trim().length <= maxLength;
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns true if URL is valid
 */
export function isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate file type against allowed extensions
 * @param fileName - File name to check
 * @param allowedExtensions - Array of allowed extensions (without dot)
 * @returns true if file type is allowed
 */
export function isValidFileType(fileName: string, allowedExtensions: string[]): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext !== undefined && allowedExtensions.includes(ext);
}

/**
 * Validate file size
 * @param fileSize - File size in bytes
 * @param maxSizeMB - Maximum allowed size in MB
 * @returns true if file size is within limit
 */
export function isValidFileSize(fileSize: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return fileSize <= maxSizeBytes;
}

/**
 * Validate password strength
 * Requires: minimum 8 characters, at least one uppercase, one lowercase, one number
 * @param password - Password to validate
 * @returns Object with isValid and message
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: 'Password is strong' };
}

/**
 * Validate form data against a schema
 * @param data - Form data to validate
 * @param schema - Validation schema
 * @returns Object with errors (empty if valid)
 */
export function validateForm<T extends Record<string, unknown>>(
    data: T,
    schema: Record<keyof T, (value: unknown) => string | null>
): Record<keyof T, string> {
    const errors = {} as Record<keyof T, string>;

    for (const [field, validator] of Object.entries(schema)) {
        const error = validator(data[field as keyof T]);
        if (error) {
            errors[field as keyof T] = error;
        }
    }

    return errors;
}
