'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    /** Label text displayed above the select */
    label?: string;
    /** Error message to display */
    error?: string;
    /** Helper text displayed below the select */
    helperText?: string;
    /** Options to display in the select */
    options: SelectOption[];
    /** Placeholder option text */
    placeholder?: string;
    /** Whether the select is full width (default: true) */
    fullWidth?: boolean;
}

/**
 * Styled select component with label and error support
 * 
 * @example
 * <Select 
 *   label="Status" 
 *   options={[
 *     { value: 'available', label: 'Available' },
 *     { value: 'in-use', label: 'In Use' },
 *   ]} 
 *   value={status}
 *   onChange={(e) => setStatus(e.target.value)}
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            helperText,
            options,
            placeholder = 'Select an option',
            fullWidth = true,
            required,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    required={required}
                    className={`
                        block w-full rounded-lg border transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                        px-3 py-2.5 pr-10
                        appearance-none bg-white
                        bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%236B7280"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>')] 
                        bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat
                        ${error
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }
                        ${className}
                    `.replace(/\s+/g, ' ').trim()}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}
                {!error && helperText && (
                    <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
