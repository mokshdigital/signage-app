import { useState, useCallback } from 'react';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Generic hook for handling async operations with loading and error states
 * 
 * @example
 * const { data, loading, error, execute } = useAsync<User[]>();
 * 
 * const fetchUsers = async () => {
 *   await execute(async () => {
 *     const response = await api.getUsers();
 *     return response.data;
 *   });
 * };
 */
export function useAsync<T>() {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
        setState({ data: null, loading: true, error: null });
        try {
            const result = await asyncFunction();
            setState({ data: result, loading: false, error: null });
            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            setState({ data: null, loading: false, error: err });
            throw err;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data }));
    }, []);

    return {
        ...state,
        execute,
        reset,
        setData,
        isIdle: !state.loading && !state.error && state.data === null,
        isSuccess: !state.loading && !state.error && state.data !== null,
        isError: !state.loading && state.error !== null,
    };
}
