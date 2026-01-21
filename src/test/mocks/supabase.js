import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
    auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
        })),
    },
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        containedBy: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
    })),
    storage: {
        from: vi.fn(() => ({
            upload: vi.fn(),
            download: vi.fn(),
            remove: vi.fn(),
            list: vi.fn(),
            getPublicUrl: vi.fn(),
        })),
    },
    functions: {
        invoke: vi.fn(),
    },
    rpc: vi.fn(),
};

// Mock Supabase module
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock supabase instance
vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabaseClient,
}));

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
    Object.values(mockSupabaseClient.auth).forEach(fn => {
        if (typeof fn === 'function' && fn.mockReset) {
            fn.mockReset();
        }
    });
    mockSupabaseClient.from.mockClear();
    mockSupabaseClient.rpc.mockClear();
    if (mockSupabaseClient.functions.invoke.mockReset) {
        mockSupabaseClient.functions.invoke.mockReset();
    }
};

// Mock successful responses
export const mockSuccessResponse = (data) => ({
    data,
    error: null,
});

// Mock error responses
export const mockErrorResponse = (message, code = 'ERROR') => ({
    data: null,
    error: {
        message,
        code,
        details: null,
        hint: null,
    },
});

// Mock user data
export const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
    },
    app_metadata: {
        provider: 'email',
    },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
};

// Mock session data
export const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
};

// Mock location data
export const mockLocation = {
    id: 'test-location-id',
    name: 'Test Restaurant',
    type: 'restaurant',
    country: 'Poland',
    city: 'Krakow',
    address: 'Test Street 123',
    description: 'A great test restaurant',
    latitude: 50.0647,
    longitude: 19.9450,
    status: 'approved',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
};

// Mock locations list
export const mockLocations = [
    mockLocation,
    {
        ...mockLocation,
        id: 'test-location-id-2',
        name: 'Test Cafe',
        type: 'cafe',
    },
    {
        ...mockLocation,
        id: 'test-location-id-3',
        name: 'Test Bar',
        type: 'bar',
    },
];
