import { useState, useCallback } from 'react';
import { handleError, ErrorSeverity } from '@/lib/errorHandler';

/**
 * Custom hook for error handling in React components
 * @param {Object} options - Hook options
 * @param {string} options.context - Context for error messages
 * @param {Function} options.onError - Custom error handler
 * @returns {Object} - Error state and handlers
 */
export function useErrorHandler(options = {}) {
    const { context = '', onError } = options;
    const [error, setError] = useState(null);
    const [isError, setIsError] = useState(false);

    /**
     * Handle error with toast and logging
     */
    const handleErrorWithToast = useCallback(
        (err, customContext = '', severity = ErrorSeverity.ERROR) => {
            setError(err);
            setIsError(true);

            handleError(err, {
                context: customContext || context,
                severity,
                onError,
            });
        },
        [context, onError]
    );

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
        setIsError(false);
    }, []);

    /**
     * Wrap async function with error handling
     */
    const withErrorHandling = useCallback(
        (fn, customContext = '') => {
            return async (...args) => {
                try {
                    clearError();
                    return await fn(...args);
                } catch (err) {
                    handleErrorWithToast(err, customContext);
                    throw err;
                }
            };
        },
        [clearError, handleErrorWithToast]
    );

    /**
     * Try-catch wrapper for sync operations
     */
    const tryCatch = useCallback(
        (fn, customContext = '') => {
            try {
                clearError();
                return fn();
            } catch (err) {
                handleErrorWithToast(err, customContext);
                return null;
            }
        },
        [clearError, handleErrorWithToast]
    );

    return {
        error,
        isError,
        handleError: handleErrorWithToast,
        clearError,
        withErrorHandling,
        tryCatch,
    };
}

export default useErrorHandler;
