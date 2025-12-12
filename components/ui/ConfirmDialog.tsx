'use client';

import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Dialog title */
    title: string;
    /** Dialog message/description */
    message: string;
    /** Confirm button label */
    confirmLabel?: string;
    /** Cancel button label */
    cancelLabel?: string;
    /** Visual variant affecting confirm button color */
    variant?: 'danger' | 'warning' | 'info';
    /** Whether the action is in progress */
    loading?: boolean;
    /** Called when user confirms */
    onConfirm: () => void;
    /** Called when user cancels or closes */
    onCancel: () => void;
}

/**
 * Confirmation dialog component for destructive or important actions
 * 
 * @example
 * <ConfirmDialog
 *   isOpen={showDeleteConfirm}
 *   title="Delete Technician"
 *   message="Are you sure you want to delete this technician? This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDeleteConfirm(false)}
 * />
 */
export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const variantConfig = {
        danger: {
            icon: '⚠️',
            iconBg: 'bg-red-100',
            buttonVariant: 'danger' as const,
        },
        warning: {
            icon: '⚡',
            iconBg: 'bg-yellow-100',
            buttonVariant: 'primary' as const,
        },
        info: {
            icon: 'ℹ️',
            iconBg: 'bg-blue-100',
            buttonVariant: 'primary' as const,
        },
    };

    const config = variantConfig[variant];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            size="sm"
            showCloseButton={false}
            footer={
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={config.buttonVariant}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center text-2xl`}>
                    {config.icon}
                </div>
                <div>
                    <p className="text-gray-600">{message}</p>
                </div>
            </div>
        </Modal>
    );
}
