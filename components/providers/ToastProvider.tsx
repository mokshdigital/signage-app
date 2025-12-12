'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

/**
 * Toast Provider component - wraps the app to provide toast notifications
 * Add this to your root layout.tsx
 * 
 * @example
 * // In layout.tsx:
 * import { ToastProvider } from '@/components/providers/ToastProvider';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ToastProvider>
 *           {children}
 *         </ToastProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <SonnerToaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                    style: {
                        padding: '16px',
                        borderRadius: '8px',
                    },
                }}
            />
        </>
    );
}

// Re-export toast for convenience
export { toast };

/**
 * Utility functions for common toast patterns
 */
export const showToast = {
    success: (message: string, description?: string) => {
        toast.success(message, { description });
    },
    error: (message: string, description?: string) => {
        toast.error(message, { description });
    },
    info: (message: string, description?: string) => {
        toast.info(message, { description });
    },
    warning: (message: string, description?: string) => {
        toast.warning(message, { description });
    },
    loading: (message: string) => {
        return toast.loading(message);
    },
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(promise, messages);
    },
    dismiss: (toastId?: string | number) => {
        toast.dismiss(toastId);
    },
};
