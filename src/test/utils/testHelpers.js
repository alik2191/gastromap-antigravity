import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} - Render result with additional utilities
 */
export function renderWithProviders(ui, options = {}) {
    const {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        }),
        route = '/',
        ...renderOptions
    } = options;

    // Set initial route
    window.history.pushState({}, 'Test page', route);

    function Wrapper({ children }) {
        return (
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>{children}</BrowserRouter>
            </QueryClientProvider>
        );
    }

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        queryClient,
    };
}

/**
 * Wait for async operations to complete
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export const waitFor = (ms = 0) =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a mock file for testing file uploads
 * @param {string} name - File name
 * @param {number} size - File size in bytes
 * @param {string} type - MIME type
 * @returns {File}
 */
export function createMockFile(
    name = 'test.csv',
    size = 1024,
    type = 'text/csv'
) {
    const blob = new Blob(['test content'], { type });
    const file = new File([blob], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
}

/**
 * Mock toast notifications
 */
export const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
};

vi.mock('sonner', () => ({
    toast: mockToast,
    Toaster: () => null,
}));

/**
 * Create mock CSV data
 * @param {Array} headers - CSV headers
 * @param {Array} rows - CSV rows
 * @returns {string}
 */
export function createMockCSV(headers, rows) {
    const headerRow = headers.join(',');
    const dataRows = rows.map((row) => row.join(',')).join('\n');
    return `${headerRow}\n${dataRows}`;
}

/**
 * Mock console methods for testing
 * @returns {Object} - Mocked console with restore function
 */
export function mockConsole() {
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
    };

    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();

    return {
        restore: () => {
            console.log = originalConsole.log;
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
        },
    };
}

/**
 * Create a mock API response
 * @param {*} data - Response data
 * @param {number} delay - Delay in ms
 * @returns {Promise}
 */
export function mockApiResponse(data, delay = 0) {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ data, error: null }), delay);
    });
}

/**
 * Create a mock API error
 * @param {string} message - Error message
 * @param {number} delay - Delay in ms
 * @returns {Promise}
 */
export function mockApiError(message, delay = 0) {
    return new Promise((resolve) => {
        setTimeout(
            () =>
                resolve({
                    data: null,
                    error: { message, code: 'ERROR' },
                }),
            delay
        );
    });
}

/**
 * Suppress React act() warnings in tests
 */
export function suppressActWarnings() {
    const originalError = console.error;
    beforeAll(() => {
        console.error = (...args) => {
            if (
                typeof args[0] === 'string' &&
                args[0].includes('Warning: An update to')
            ) {
                return;
            }
            originalError.call(console, ...args);
        };
    });

    afterAll(() => {
        console.error = originalError;
    });
}
