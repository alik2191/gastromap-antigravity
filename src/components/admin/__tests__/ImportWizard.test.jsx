import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, createMockFile, createMockCSV } from '@/test/utils/testHelpers';
import ImportWizard from '../ImportWizard';
import {
    mockSupabaseClient,
    resetSupabaseMocks,
    mockSuccessResponse,
    mockLocations,
} from '@/test/mocks/supabase';

describe('ImportWizard', () => {
    beforeEach(() => {
        resetSupabaseMocks();
    });

    it('should render wizard steps', () => {
        renderWithProviders(
            <ImportWizard
                isOpen={true}
                onClose={vi.fn()}
                onImportComplete={vi.fn()}
            />
        );

        expect(screen.getByText(/import/i)).toBeInTheDocument();
    });

    it('should handle file upload', async () => {
        const onImportComplete = vi.fn();

        renderWithProviders(
            <ImportWizard
                isOpen={true}
                onClose={vi.fn()}
                onImportComplete={onImportComplete}
            />
        );

        // Create mock CSV file
        const csvContent = createMockCSV(
            ['name', 'city', 'type'],
            [
                ['Cafe 1', 'Krakow', 'cafe'],
                ['Cafe 2', 'Warsaw', 'cafe']
            ]
        );

        const file = createMockFile('locations.csv', csvContent.length, 'text/csv');

        // Find file input and upload
        const fileInput = screen.getByLabelText(/choose file|upload/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/2.*locations?/i)).toBeInTheDocument();
        });
    });

    it('should validate CSV format', async () => {
        renderWithProviders(
            <ImportWizard
                isOpen={true}
                onClose={vi.fn()}
                onImportComplete={vi.fn()}
            />
        );

        // Create invalid CSV (missing required fields)
        const invalidCSV = 'name\nCafe 1\nCafe 2';
        const file = createMockFile('invalid.csv', invalidCSV.length, 'text/csv');

        const fileInput = screen.getByLabelText(/choose file|upload/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/invalid|error/i)).toBeInTheDocument();
        });
    });

    it('should show preview of imported data', async () => {
        renderWithProviders(
            <ImportWizard
                isOpen={true}
                onClose={vi.fn()}
                onImportComplete={vi.fn()}
            />
        );

        const csvContent = createMockCSV(
            ['name', 'city'],
            [['Test Cafe', 'Krakow']]
        );

        const file = createMockFile('test.csv', csvContent.length, 'text/csv');

        const fileInput = screen.getByLabelText(/choose file|upload/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('Test Cafe')).toBeInTheDocument();
            expect(screen.getByText('Krakow')).toBeInTheDocument();
        });
    });

    it('should handle import success', async () => {
        const onImportComplete = vi.fn();

        mockSupabaseClient.functions.invoke.mockResolvedValue(
            mockSuccessResponse({
                created: 2,
                updated: 0,
                errors: 0,
                errorDetails: []
            })
        );

        renderWithProviders(
            <ImportWizard
                isOpen={true}
                onClose={vi.fn()}
                onImportComplete={onImportComplete}
            />
        );

        const csvContent = createMockCSV(
            ['name', 'city'],
            [['Cafe 1', 'Krakow'], ['Cafe 2', 'Warsaw']]
        );

        const file = createMockFile('test.csv', csvContent.length, 'text/csv');

        const fileInput = screen.getByLabelText(/choose file|upload/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Click import button
        const importButton = screen.getByRole('button', { name: /import/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(onImportComplete).toHaveBeenCalled();
        });
    });

    it('should handle import errors', async () => {
        mockSupabaseClient.functions.invoke.mockResolvedValue(
            mockSuccessResponse({
                created: 1,
                updated: 0,
                errors: 1,
                errorDetails: [
                    { row: 2, error: 'Duplicate location' }
                ]
            })
        );

        renderWithProviders(
            <ImportWizard
                isOpen={true}
                onClose={vi.fn()}
                onImportComplete={vi.fn()}
            />
        );

        const csvContent = createMockCSV(
            ['name', 'city'],
            [['Cafe 1', 'Krakow'], ['Cafe 1', 'Krakow']]
        );

        const file = createMockFile('test.csv', csvContent.length, 'text/csv');

        const fileInput = screen.getByLabelText(/choose file|upload/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        const importButton = screen.getByRole('button', { name: /import/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(screen.getByText(/1.*error/i)).toBeInTheDocument();
        });
    });

    it('should allow canceling import', () => {
        const onClose = vi.fn();

        renderWithProviders(
            <ImportWizard
                isOpen={true}
                onClose={onClose}
                onImportComplete={vi.fn()}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancel|close/i });
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });
});
