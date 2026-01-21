import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.test.{js,jsx}',
                '**/*.spec.{js,jsx}',
                'dist/',
                'e2e/',
            ],
        },
        include: ['src/**/*.{test,spec}.{js,jsx}'],
        exclude: ['node_modules', 'dist', 'e2e'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
