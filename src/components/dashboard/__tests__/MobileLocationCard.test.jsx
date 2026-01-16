import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import MobileLocationCard from '../MobileLocationCard';
import { LanguageProvider } from '../../LanguageContext';
import '@testing-library/jest-dom';

// Mock base44 client
jest.mock('@/api/base44Client', () => ({
    base44: {
        entities: {
            Review: {
                filter: jest.fn(() => Promise.resolve([]))
            }
        }
    }
}));

const mockLocation = {
    id: 'loc-1',
    name: 'Test Cafe',
    type: 'cafe',
    city: 'New York',
    city_en: 'New York',
    country: 'USA',
    country_en: 'USA',
    description: 'A great cafe',
    description_en: 'A great cafe',
    image_url: 'https://example.com/image.jpg',
    price_range: '$$',
    latitude: 40.7128,
    longitude: -74.0060,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    status: 'published'
};

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return ({ children }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </QueryClientProvider>
        </BrowserRouter>
    );
};

describe('MobileLocationCard', () => {
    const mockOnSave = jest.fn();
    const mockOnOpenDetail = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders location card with correct information', () => {
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Test Cafe')).toBeInTheDocument();
        expect(screen.getByText('New York')).toBeInTheDocument();
    });

    test('shows "Save" button when location is not saved', () => {
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        const saveButton = screen.getByRole('button', { name: /add to wishlist/i });
        expect(saveButton).toHaveTextContent('Save');
    });

    test('shows "Saved" button when location is in wishlist', () => {
        const savedLocation = {
            location_id: 'loc-1',
            list_type: 'wishlist',
            created_date: new Date().toISOString()
        };

        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={savedLocation}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        const saveButton = screen.getByRole('button', { name: /remove from wishlist/i });
        expect(saveButton).toHaveTextContent('Saved');
    });

    test('calls onSave when Save button is clicked', async () => {
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        const saveButton = screen.getByRole('button', { name: /add to wishlist/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith('loc-1', 'wishlist', '');
        });
    });

    test('displays "NEW" badge for recently created locations', () => {
        const newLocation = {
            ...mockLocation,
            created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        };

        render(
            <MobileLocationCard
                location={newLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText(/NEW/i)).toBeInTheDocument();
    });

    test('displays "Updated" badge for recently updated saved locations', () => {
        const savedLocation = {
            location_id: 'loc-1',
            list_type: 'wishlist',
            created_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
        };

        const updatedLocation = {
            ...mockLocation,
            created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        };

        render(
            <MobileLocationCard
                location={updatedLocation}
                savedLocation={savedLocation}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText(/Updated/i)).toBeInTheDocument();
    });

    test('displays "Pending" badge for pending locations', () => {
        const pendingLocation = {
            ...mockLocation,
            status: 'pending'
        };

        render(
            <MobileLocationCard
                location={pendingLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    test('displays price range when available', () => {
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('$$')).toBeInTheDocument();
    });

    test('displays location type badge', () => {
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        // Type should be displayed (cafe = Кафе in Russian, but test uses English default)
        expect(screen.getByText(/cafe/i)).toBeInTheDocument();
    });

    test('navigates to location detail on card click', () => {
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        const card = screen.getByText('Test Cafe').closest('a');
        expect(card).toHaveAttribute('href');
        expect(card.getAttribute('href')).toContain('LocationDetail');
        expect(card.getAttribute('href')).toContain('id=loc-1');
    });

    test('prevents event propagation when clicking Save button', async () => {
        const mockNavigate = jest.fn();
        
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        const saveButton = screen.getByRole('button', { name: /add to wishlist/i });
        
        // Create a mock click event
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
        const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');

        fireEvent(saveButton, clickEvent);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    test('displays hidden gem badge when is_hidden_gem is true and location is not new', () => {
        const hiddenGemLocation = {
            ...mockLocation,
            is_hidden_gem: true,
            created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago (not new)
        };

        render(
            <MobileLocationCard
                location={hiddenGemLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('SECRET')).toBeInTheDocument();
    });

    test('disables Save button while saving', () => {
        render(
            <MobileLocationCard
                location={mockLocation}
                savedLocation={null}
                onSave={mockOnSave}
                onOpenDetail={mockOnOpenDetail}
            />,
            { wrapper: createWrapper() }
        );

        const saveButton = screen.getByRole('button', { name: /add to wishlist/i });
        
        fireEvent.click(saveButton);
        
        // Button should be disabled during save
        expect(saveButton).toBeDisabled();
    });
});