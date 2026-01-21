/**
 * Centralized Error Handler for GastroMap
 * Provides consistent error handling, logging, and user notifications
 */

import { toast } from 'sonner';

/**
 * Error types for classification
 */
export const ErrorType = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    VALIDATION: 'VALIDATION',
    DATABASE: 'DATABASE',
    PERMISSION: 'PERMISSION',
    NOT_FOUND: 'NOT_FOUND',
    UNKNOWN: 'UNKNOWN',
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL',
};

/**
 * Classify error based on error object
 * @param {Error|Object} error - Error object
 * @returns {string} - Error type
 */
export function classifyError(error) {
    if (!error) return ErrorType.UNKNOWN;

    const message = error.message || error.toString();
    const code = error.code || error.status;

    // Network errors
    if (
        message.includes('network') ||
        message.includes('fetch') ||
        code === 'NETWORK_ERROR'
    ) {
        return ErrorType.NETWORK;
    }

    // Auth errors
    if (
        message.includes('auth') ||
        message.includes('unauthorized') ||
        message.includes('session') ||
        code === 401 ||
        code === 403 ||
        error.__isAuthError
    ) {
        return ErrorType.AUTH;
    }

    // Validation errors
    if (
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required') ||
        code === 400 ||
        code === 422
    ) {
        return ErrorType.VALIDATION;
    }

    // Database errors
    if (
        message.includes('database') ||
        message.includes('query') ||
        message.includes('duplicate') ||
        code === 'PGRST' ||
        code?.startsWith?.('23')
    ) {
        return ErrorType.DATABASE;
    }

    // Permission errors
    if (
        message.includes('permission') ||
        message.includes('forbidden') ||
        message.includes('RLS') ||
        code === 403
    ) {
        return ErrorType.PERMISSION;
    }

    // Not found errors
    if (message.includes('not found') || code === 404) {
        return ErrorType.NOT_FOUND;
    }

    return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {string} - User-friendly message
 */
export function getUserFriendlyMessage(error, context = '') {
    const errorType = classifyError(error);
    const contextPrefix = context ? `${context}: ` : '';

    const messages = {
        [ErrorType.NETWORK]: `${contextPrefix}Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.`,
        [ErrorType.AUTH]: `${contextPrefix}Ошибка аутентификации. Пожалуйста, войдите в систему снова.`,
        [ErrorType.VALIDATION]: `${contextPrefix}Проверьте правильность введенных данных.`,
        [ErrorType.DATABASE]: `${contextPrefix}Ошибка при работе с базой данных. Попробуйте позже.`,
        [ErrorType.PERMISSION]: `${contextPrefix}У вас нет прав для выполнения этого действия.`,
        [ErrorType.NOT_FOUND]: `${contextPrefix}Запрашиваемый ресурс не найден.`,
        [ErrorType.UNKNOWN]: `${contextPrefix}Произошла непредвиденная ошибка. Попробуйте позже.`,
    };

    return messages[errorType] || messages[ErrorType.UNKNOWN];
}

/**
 * Log error to console with context
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Object} metadata - Additional metadata
 */
export function logError(error, context = '', metadata = {}) {
    const errorType = classifyError(error);
    const timestamp = new Date().toISOString();

    console.error('[ErrorHandler]', {
        timestamp,
        context,
        errorType,
        message: error.message || error.toString(),
        code: error.code || error.status,
        stack: error.stack,
        metadata,
    });

    // In production, you might want to send this to a logging service
    // e.g., Sentry, LogRocket, etc.
}

/**
 * Handle error with notification and logging
 * @param {Error|Object} error - Error object
 * @param {Object} options - Handler options
 * @param {string} options.context - Context where error occurred
 * @param {boolean} options.showToast - Whether to show toast notification
 * @param {ErrorSeverity} options.severity - Error severity
 * @param {Object} options.metadata - Additional metadata
 * @param {Function} options.onError - Custom error handler callback
 */
export function handleError(error, options = {}) {
    const {
        context = '',
        showToast = true,
        severity = ErrorSeverity.ERROR,
        metadata = {},
        onError,
    } = options;

    // Log error
    logError(error, context, metadata);

    // Show toast notification
    if (showToast) {
        const message = getUserFriendlyMessage(error, context);

        switch (severity) {
            case ErrorSeverity.INFO:
                toast.info(message);
                break;
            case ErrorSeverity.WARNING:
                toast.warning(message);
                break;
            case ErrorSeverity.CRITICAL:
                toast.error(message, { duration: 10000 });
                break;
            case ErrorSeverity.ERROR:
            default:
                toast.error(message);
                break;
        }
    }

    // Call custom error handler if provided
    if (onError && typeof onError === 'function') {
        onError(error);
    }

    // Return error details for further handling
    return {
        type: classifyError(error),
        message: getUserFriendlyMessage(error, context),
        originalError: error,
    };
}

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Error handler options
 * @returns {Function} - Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, options);
            throw error; // Re-throw for caller to handle if needed
        }
    };
}

/**
 * Create error boundary handler for React components
 * @param {string} componentName - Name of the component
 * @returns {Function} - Error handler function
 */
export function createErrorBoundaryHandler(componentName) {
    return (error, errorInfo) => {
        handleError(error, {
            context: `React Error Boundary: ${componentName}`,
            severity: ErrorSeverity.CRITICAL,
            metadata: { errorInfo },
        });
    };
}

/**
 * Validate and handle API response
 * @param {Object} response - API response object
 * @param {string} context - Context of the API call
 * @returns {*} - Response data if successful
 * @throws {Error} - If response contains error
 */
export function validateApiResponse(response, context = 'API Call') {
    if (response && response.error) {
        const error = new Error(response.error.message || 'API Error');
        error.code = response.error.code;
        error.details = response.error.details;
        handleError(error, { context });
        throw error;
    }

    return response.data;
}

export default {
    ErrorType,
    ErrorSeverity,
    classifyError,
    getUserFriendlyMessage,
    logError,
    handleError,
    withErrorHandling,
    createErrorBoundaryHandler,
    validateApiResponse,
};
