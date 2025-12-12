'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Label text displayed above the input */
    label?: string;
    /** Error message to display */
    error?: string;
    /** Helper text displayed below the input */
    helperText?: string;
    /** Icon to display on the left side */
    leftIcon?: React.ReactNode;
    /** Icon to display on the right side */
    rightIcon?: React.ReactNode;
    /** Whether the input is full width (default: true) */
    fullWidth?: boolean;
}

/**
 * Styled input component with label, error, and helper text support
 * 
 * @example
 * <Input label="Email" type="email" required error={errors.email} />
 * <Input label="Search" leftIcon="🔍" placeholder="Search..." />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = true,
            required,
            className = '',
            type = 'text',
            id,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        const isPasswordType = type === 'password';
        const inputType = isPasswordType && showPassword ? 'text' : type;

        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        required={required}
                        className={`
                            block w-full rounded-lg border transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-0
                            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                            ${leftIcon ? 'pl-10' : 'pl-3'}
                            ${rightIcon || isPasswordType ? 'pr-10' : 'pr-3'}
                            py-2.5
                            ${error
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }
                            ${className}
                        `.replace(/\s+/g, ' ').trim()}
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />
                    {isPasswordType && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    )}
                    {!isPasswordType && rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}
                {!error && helperText && (
                    <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
