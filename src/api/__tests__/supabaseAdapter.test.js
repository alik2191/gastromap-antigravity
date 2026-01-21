import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adapter } from '../supabaseAdapter';
import {
    mockSupabaseClient,
    resetSupabaseMocks,
    mockSuccessResponse,
    mockErrorResponse,
    mockUser,
    mockSession,
    mockLocation,
    mockLocations,
} from '@/test/mocks/supabase';

describe('SupabaseAdapter', () => {
    beforeEach(() => {
        resetSupabaseMocks();
    });

    describe('Auth Methods', () => {
        describe('me()', () => {
            it('should return user data when authenticated', async () => {
                mockSupabaseClient.auth.getSession.mockResolvedValue(
                    mockSuccessResponse({ session: mockSession })
                );
                mockSupabaseClient.from.mockReturnValue({
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue(
                        mockSuccessResponse({
                            id: mockUser.id,
                            email: mockUser.email,
                            full_name: 'Test User',
                            is_admin: false,
                        })
                    ),
                });

                const result = await adapter.auth.me();

                expect(result).toBeDefined();
                expect(result.email).toBe(mockUser.email);
                expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
            });

            it('should throw error when not authenticated', async () => {
                mockSupabaseClient.auth.getSession.mockResolvedValue(
                    mockSuccessResponse({ session: null })
                );

                await expect(adapter.auth.me()).rejects.toThrow();
            });

            it('should handle session errors', async () => {
                mockSupabaseClient.auth.getSession.mockResolvedValue(
                    mockErrorResponse('Session error')
                );

                await expect(adapter.auth.me()).rejects.toThrow();
            });
        });

        describe('logout()', () => {
            it('should sign out user successfully', async () => {
                mockSupabaseClient.auth.signOut.mockResolvedValue(
                    mockSuccessResponse({})
                );

                await adapter.auth.logout();

                expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
            });

            it('should handle logout errors', async () => {
                mockSupabaseClient.auth.signOut.mockResolvedValue(
                    mockErrorResponse('Logout failed')
                );

                await expect(adapter.auth.logout()).rejects.toThrow();
            });
        });
    });

    describe('Entity Operations', () => {
        describe('Location Entity', () => {
            describe('list()', () => {
                it('should fetch all locations', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockLocations)),
                    });

                    const result = await adapter.entities.Location.list();

                    expect(result).toEqual(mockLocations);
                    expect(mockSupabaseClient.from).toHaveBeenCalledWith('locations');
                });

                it('should handle list errors', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue(mockErrorResponse('Fetch failed')),
                    });

                    await expect(adapter.entities.Location.list()).rejects.toThrow();
                });

                it('should apply sorting when provided', async () => {
                    const orderMock = vi.fn().mockResolvedValue(mockSuccessResponse(mockLocations));
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        order: orderMock,
                    });

                    await adapter.entities.Location.list({ column: 'name', ascending: true });

                    expect(orderMock).toHaveBeenCalledWith('name', { ascending: true });
                });
            });

            describe('create()', () => {
                it('should create a new location', async () => {
                    const newLocation = {
                        name: 'New Restaurant',
                        type: 'restaurant',
                        country: 'Poland',
                        city: 'Warsaw',
                    };

                    mockSupabaseClient.from.mockReturnValue({
                        insert: vi.fn().mockReturnThis(),
                        select: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue(
                            mockSuccessResponse({ ...newLocation, id: 'new-id' })
                        ),
                    });

                    const result = await adapter.entities.Location.create(newLocation);

                    expect(result).toBeDefined();
                    expect(result.name).toBe(newLocation.name);
                    expect(mockSupabaseClient.from).toHaveBeenCalledWith('locations');
                });

                it('should handle creation errors', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        insert: vi.fn().mockReturnThis(),
                        select: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue(
                            mockErrorResponse('Creation failed')
                        ),
                    });

                    await expect(
                        adapter.entities.Location.create({ name: 'Test' })
                    ).rejects.toThrow();
                });
            });

            describe('update()', () => {
                it('should update an existing location', async () => {
                    const updates = { name: 'Updated Name' };

                    mockSupabaseClient.from.mockReturnValue({
                        update: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        select: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue(
                            mockSuccessResponse({ ...mockLocation, ...updates })
                        ),
                    });

                    const result = await adapter.entities.Location.update(
                        mockLocation.id,
                        updates
                    );

                    expect(result.name).toBe(updates.name);
                });

                it('should handle update errors', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        update: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        select: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue(
                            mockErrorResponse('Update failed')
                        ),
                    });

                    await expect(
                        adapter.entities.Location.update('id', {})
                    ).rejects.toThrow();
                });
            });

            describe('delete()', () => {
                it('should delete a location', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        delete: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue(mockSuccessResponse({})),
                    });

                    await adapter.entities.Location.delete(mockLocation.id);

                    expect(mockSupabaseClient.from).toHaveBeenCalledWith('locations');
                });

                it('should handle deletion errors', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        delete: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue(mockErrorResponse('Delete failed')),
                    });

                    await expect(
                        adapter.entities.Location.delete('id')
                    ).rejects.toThrow();
                });
            });

            describe('get()', () => {
                it('should fetch a single location by id', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue(mockSuccessResponse(mockLocation)),
                    });

                    const result = await adapter.entities.Location.get(mockLocation.id);

                    expect(result).toEqual(mockLocation);
                });

                it('should handle get errors', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue(
                            mockErrorResponse('Not found')
                        ),
                    });

                    await expect(
                        adapter.entities.Location.get('invalid-id')
                    ).rejects.toThrow();
                });
            });

            describe('checkDuplicate()', () => {
                it('should find duplicate location', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        ilike: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue(
                            mockSuccessResponse(mockLocation)
                        ),
                    });

                    const result = await adapter.entities.Location.checkDuplicate(
                        'Test Restaurant',
                        'Test Street 123',
                        'Krakow'
                    );

                    expect(result).toEqual(mockLocation);
                });

                it('should return null when no duplicate found', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        ilike: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue(
                            mockSuccessResponse(null)
                        ),
                    });

                    const result = await adapter.entities.Location.checkDuplicate(
                        'Unique Name',
                        'Unique Address',
                        'Warsaw'
                    );

                    expect(result).toBeNull();
                });

                it('should exclude specific id when checking duplicates', async () => {
                    const neqMock = vi.fn().mockReturnThis();
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        ilike: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: neqMock,
                        limit: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue(
                            mockSuccessResponse(null)
                        ),
                    });

                    await adapter.entities.Location.checkDuplicate(
                        'Test',
                        'Address',
                        'City',
                        'exclude-id'
                    );

                    expect(neqMock).toHaveBeenCalledWith('id', 'exclude-id');
                });
            });

            describe('filter()', () => {
                it('should filter locations by criteria', async () => {
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue(
                            mockSuccessResponse([mockLocation])
                        ),
                    });

                    const result = await adapter.entities.Location.filter({
                        city: 'Krakow',
                    });

                    expect(result).toHaveLength(1);
                });

                it('should apply multiple filters', async () => {
                    const eqMock = vi.fn().mockReturnThis();
                    mockSupabaseClient.from.mockReturnValue({
                        select: vi.fn().mockReturnThis(),
                        eq: eqMock,
                        order: vi.fn().mockResolvedValue(
                            mockSuccessResponse([mockLocation])
                        ),
                    });

                    await adapter.entities.Location.filter({
                        city: 'Krakow',
                        type: 'restaurant',
                    });

                    expect(eqMock).toHaveBeenCalledWith('city', 'Krakow');
                    expect(eqMock).toHaveBeenCalledWith('type', 'restaurant');
                });
            });
        });
    });

    describe('Storage Operations', () => {
        describe('upload()', () => {
            it('should upload file successfully', async () => {
                const mockFile = new File(['content'], 'test.jpg', {
                    type: 'image/jpeg',
                });
                const mockPath = 'uploads/test.jpg';

                mockSupabaseClient.storage.from.mockReturnValue({
                    upload: vi.fn().mockResolvedValue(
                        mockSuccessResponse({ path: mockPath })
                    ),
                });

                const result = await adapter.storage.upload(mockPath, mockFile);

                expect(result).toBeDefined();
                expect(result.path).toBe(mockPath);
            });

            it('should handle upload errors', async () => {
                mockSupabaseClient.storage.from.mockReturnValue({
                    upload: vi.fn().mockResolvedValue(
                        mockErrorResponse('Upload failed')
                    ),
                });

                await expect(
                    adapter.storage.upload('path', new File([], 'test.jpg'))
                ).rejects.toThrow();
            });
        });

        describe('getPublicUrl()', () => {
            it('should return public URL for file', () => {
                const mockUrl = 'https://example.com/file.jpg';
                mockSupabaseClient.storage.from.mockReturnValue({
                    getPublicUrl: vi.fn().mockReturnValue({
                        data: { publicUrl: mockUrl },
                    }),
                });

                const result = adapter.storage.getPublicUrl('file.jpg');

                expect(result).toBe(mockUrl);
            });
        });

        describe('remove()', () => {
            it('should remove files successfully', async () => {
                mockSupabaseClient.storage.from.mockReturnValue({
                    remove: vi.fn().mockResolvedValue(mockSuccessResponse({})),
                });

                await adapter.storage.remove(['file1.jpg', 'file2.jpg']);

                expect(mockSupabaseClient.storage.from).toHaveBeenCalled();
            });

            it('should handle removal errors', async () => {
                mockSupabaseClient.storage.from.mockReturnValue({
                    remove: vi.fn().mockResolvedValue(
                        mockErrorResponse('Remove failed')
                    ),
                });

                await expect(
                    adapter.storage.remove(['file.jpg'])
                ).rejects.toThrow();
            });
        });
    });

    describe('Functions', () => {
        describe('invoke()', () => {
            it('should invoke edge function successfully', async () => {
                const mockResponse = { result: 'success' };
                mockSupabaseClient.functions.invoke.mockResolvedValue(
                    mockSuccessResponse(mockResponse)
                );

                const result = await adapter.functions.invoke('test-function', {
                    param: 'value',
                });

                expect(result).toEqual(mockResponse);
                expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
                    'test-function',
                    { body: { param: 'value' } }
                );
            });

            it('should handle function invocation errors', async () => {
                mockSupabaseClient.functions.invoke.mockResolvedValue(
                    mockErrorResponse('Function failed')
                );

                await expect(
                    adapter.functions.invoke('test-function', {})
                ).rejects.toThrow();
            });
        });
    });
});
