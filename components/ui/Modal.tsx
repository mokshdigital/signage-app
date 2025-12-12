'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { Button } from './Button';

export interface ModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Modal content */
    children: ReactNode;
    /** Modal size */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Whether to show close button in footer */
    showCloseButton?: boolean;
    /** Custom footer content (replaces default close button) */
    footer?: ReactNode;
    /** Whether clicking backdrop closes modal */
    closeOnBackdropClick?: boolean;
    /** Whether pressing Escape closes modal */
    closeOnEscape?: boolean;
}

/**
 * Modal dialog component with backdrop, animations, and keyboard support
 * 
 * @example
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirm Delete">
 *   <p>Are you sure you want to delete this item?</p>
 * </Modal>
 */
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    footer,
    closeOnBackdropClick = true,
    closeOnEscape = true,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle escape key and focus management
    useEffect(() => {
        if (!isOpen) return;

        // Store the currently focused element
        previousActiveElement.current = document.activeElement as HTMLElement;

        // Handle escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        };

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleEscape);

        // Focus the modal
        modalRef.current?.focus();

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
            // Restore focus to previously active element
            previousActiveElement.current?.focus();
        };
    }, [isOpen, onClose, closeOnEscape]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw] w-full',
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`
                    relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]}
                    max-h-[90vh] overflow-hidden
                    animate-in zoom-in-95 slide-in-from-bottom-4 duration-200
                `.replace(/\s+/g, ' ').trim()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-4">
                    {children}
                </div>

                {/* Footer */}
                {(footer || showCloseButton) && (
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                        {footer || (
                            <Button onClick={onClose} variant="secondary" fullWidth>
                                Close
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
