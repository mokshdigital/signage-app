import { useState, useCallback } from 'react';

/**
 * Hook for managing modal open/close state with optional data
 * 
 * @example
 * const { isOpen, data, open, close } = useModal<User>();
 * 
 * // Open modal with data
 * open(selectedUser);
 * 
 * // In modal: access data
 * {isOpen && <Modal user={data} onClose={close} />}
 */
export function useModal<T = undefined>() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<T | undefined>(undefined);

    const open = useCallback((modalData?: T) => {
        setData(modalData);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        // Delay clearing data to allow for exit animations
        setTimeout(() => setData(undefined), 300);
    }, []);

    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }, [isOpen, open, close]);

    return {
        isOpen,
        data,
        open,
        close,
        toggle,
    };
}
