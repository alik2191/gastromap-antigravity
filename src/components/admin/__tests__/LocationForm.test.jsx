import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testHelpers';
import LocationForm from '../LocationForm';
import {
    mockSupabaseClient,
    resetSupabaseMocks,
    mockSuccessResponse,
    mockLocation,
} from '@/test/mocks/supabase';

describe('LocationForm', () => {
    beforeEach(() => {
        resetSupabaseMocks();
    });

    it('should render form fields correctly', () => {
        renderWithProviders(<LocationForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    });

    it('should populate form when editing existing location', () => {
        renderWithProviders(
            <LocationForm
                location={mockLocation}
                onSuccess={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByDisplayValue(mockLocation.name)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockLocation.city)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
        const onSuccess = vi.fn();
        renderWithProviders(<LocationForm onSuccess={onSuccess} onCancel={vi.fn()} />);

        const submitButton = screen.getByRole('button', { name: /save|create/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        });

        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should submit form with valid data', async () => {
        const onSuccess = vi.fn();
        mockSupabaseClient.from.mockReturnValue({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue(
                mockSuccessResponse({ ...mockLocation, id: 'new-id' })
            ),
        });

        renderWithProviders(<LocationForm onSuccess={onSuccess} onCancel={vi.fn()} />);

        fireEvent.change(screen.getByLabelText(/name/i), {
            target: { value: 'Test Restaurant' },
        });
        fireEvent.change(screen.getByLabelText(/city/i), {
            target: { value: 'Krakow' },
        });

        const submitButton = screen.getByRole('button', { name: /save|create/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
        });
    });

    it('should call onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        renderWithProviders(<LocationForm onSuccess={vi.fn()} onCancel={onCancel} />);

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalled();
    });

    it('should check for duplicates before saving', async () => {
        const checkDuplicateMock = vi.fn().mockResolvedValue(null);
        mockSupabaseClient.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: checkDuplicateMock,
        });

        renderWithProviders(<LocationForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

        fireEvent.change(screen.getByLabelText(/name/i), {
            target: { value: 'Test Restaurant' },
        });

        await waitFor(() => {
            expect(checkDuplicateMock).toHaveBeenCalled();
        });
    });
});
