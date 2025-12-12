import { useState, useCallback } from 'react';

interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: (() => void) | null;
}

const defaultState: ConfirmDialogState = {
    isOpen: false,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
    onConfirm: null,
};

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

/**
 * Hook for managing confirmation dialogs (replaces window.confirm)
 * 
 * @example
 * const { confirm, dialogProps } = useConfirmDialog();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     variant: 'danger',
 *   });
 *   
 *   if (confirmed) {
 *     await deleteItem(id);
 *   }
 * };
 * 
 * // Render the dialog
 * <ConfirmDialog {...dialogProps} />
 */
export function useConfirmDialog() {
    const [state, setState] = useState<ConfirmDialogState>(defaultState);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title: options.title || defaultState.title,
                message: options.message,
                confirmLabel: options.confirmLabel || defaultState.confirmLabel,
                cancelLabel: options.cancelLabel || defaultState.cancelLabel,
                variant: options.variant || defaultState.variant,
                onConfirm: null,
            });
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setState(defaultState);
        resolvePromise?.(true);
        setResolvePromise(null);
    }, [resolvePromise]);

    const handleCancel = useCallback(() => {
        setState(defaultState);
        resolvePromise?.(false);
        setResolvePromise(null);
    }, [resolvePromise]);

    return {
        confirm,
        dialogProps: {
            isOpen: state.isOpen,
            title: state.title,
            message: state.message,
            confirmLabel: state.confirmLabel,
            cancelLabel: state.cancelLabel,
            variant: state.variant,
            onConfirm: handleConfirm,
            onCancel: handleCancel,
        },
    };
}
