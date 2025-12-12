'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Label text displayed above the textarea */
    label?: string;
    /** Error message to display */
    error?: string;
    /** Helper text displayed below the textarea */
    helperText?: string;
    /** Whether the textarea is full width (default: true) */
    fullWidth?: boolean;
    /** Whether to auto-resize based on content */
    autoResize?: boolean;
}

/**
 * Styled textarea component with label and error support
 * 
 * @example
 * <Textarea 
 *   label="Description" 
 *   placeholder="Enter a description..."
 *   rows={4}
 * />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            error,
            helperText,
            fullWidth = true,
            autoResize = false,
            required,
            className = '',
            id,
            onChange,
            ...props
        },
        ref
    ) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (autoResize) {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
            }
            onChange?.(e);
        };

        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    required={required}
                    onChange={handleChange}
                    className={`
                        block w-full rounded-lg border transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                        px-3 py-2.5 resize-y min-h-[80px]
                        ${autoResize ? 'resize-none overflow-hidden' : ''}
                        ${error
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }
                        ${className}
                    `.replace(/\s+/g, ' ').trim()}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
                    {...props}
                />
                {error && (
                    <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}
                {!error && helperText && (
                    <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
