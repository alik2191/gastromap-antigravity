// Mock Base44 Client for standalone operation
import {
    mockLocations,
    mockSavedLocations,
    mockRegionStatuses,
    mockSubscriptions,
    mockFeedback,
    mockModerationRounds,
    mockCreatorAnswers,
    mockUsers,
    mockReviews,
    mockReviewQuestions,
    mockLocationBranches
} from '@/data/mockData';

// Helper to simulate async operations
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Local storage helpers
const getFromStorage = (key, defaultValue = []) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Storage save error:', e);
    }
};

// Initialize storage with mock data if empty
if (!localStorage.getItem('mockLocations')) {
    saveToStorage('mockLocations', mockLocations);
}
if (!localStorage.getItem('mockSavedLocations')) {
    saveToStorage('mockSavedLocations', mockSavedLocations);
}
if (!localStorage.getItem('mockRegionStatuses')) {
    saveToStorage('mockRegionStatuses', mockRegionStatuses);
}
if (!localStorage.getItem('mockUsers')) {
    saveToStorage('mockUsers', mockUsers);
}
if (!localStorage.getItem('mockReviews')) {
    saveToStorage('mockReviews', mockReviews);
}

// Mock entity with CRUD operations
class MockEntity {
    constructor(name, defaultData = []) {
        this.name = name;
        this.storageKey = `mock${name}`;
        this.defaultData = defaultData;
    }

    async list(sortField) {
        await delay();
        let data = getFromStorage(this.storageKey, this.defaultData);

        // Simple sorting by created_date if sortField starts with '-'
        if (sortField && sortField.startsWith('-')) {
            const field = sortField.substring(1);
            data = [...data].sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                if (!aVal) return 1;
                if (!bVal) return -1;
                return new Date(bVal) - new Date(aVal);
            });
        }

        return data;
    }

    async filter(criteria) {
        await delay();
        const all = getFromStorage(this.storageKey, this.defaultData);
        return all.filter(item => {
            return Object.keys(criteria).every(key => item[key] === criteria[key]);
        });
    }

    async create(data) {
        await delay();
        const all = getFromStorage(this.storageKey, this.defaultData);
        const newItem = {
            ...data,
            id: `${this.name.toLowerCase()}-${Date.now()}`,
            created_date: new Date().toISOString()
        };
        all.push(newItem);
        saveToStorage(this.storageKey, all);
        return newItem;
    }

    async update(id, data) {
        await delay();
        const all = getFromStorage(this.storageKey, this.defaultData);
        const index = all.findIndex(item => item.id === id);
        if (index === -1) throw new Error(`${this.name} not found`);
        all[index] = { ...all[index], ...data };
        saveToStorage(this.storageKey, all);
        return all[index];
    }

    async delete(id) {
        await delay();
        const all = getFromStorage(this.storageKey, this.defaultData);
        const filtered = all.filter(item => item.id !== id);
        saveToStorage(this.storageKey, filtered);
        return { success: true };
    }

    async get(id) {
        await delay();
        const all = getFromStorage(this.storageKey, this.defaultData);
        const item = all.find(item => item.id === id);
        if (!item) throw new Error(`${this.name} not found`);
        return item;
    }
}

// Mock Base44 client
export const mockBase44 = {
    auth: {
        me: async () => {
            await delay();
            // Return mock user from AuthContext
            return {
                id: 'demo-user-123',
                email: 'demo@gastromap.app',
                name: 'Demo User',
                role: 'admin',
                custom_role: 'admin'
            };
        },
        redirectToLogin: (url) => {
            console.log('Mock: Redirect to login', url);
            // Don't actually redirect in demo mode
        },
        logout: (url) => {
            console.log('Mock: Logout', url);
            localStorage.removeItem('mockUser');
            if (url) {
                window.location.href = '/';
            }
        },
        updateMe: async (data) => {
            await delay();
            console.log('Mock: updateMe', data);
            return {
                id: 'demo-user-123',
                email: 'demo@gastromap.app',
                name: 'Demo User',
                role: 'admin',
                custom_role: 'admin',
                ...data
            };
        }
    },
    entities: {
        Location: new MockEntity('Locations', mockLocations),
        SavedLocation: new MockEntity('SavedLocations', mockSavedLocations),
        RegionStatus: new MockEntity('RegionStatuses', mockRegionStatuses),
        Subscription: new MockEntity('Subscriptions', mockSubscriptions),
        Feedback: new MockEntity('Feedback', mockFeedback),
        ModerationRound: new MockEntity('ModerationRounds', mockModerationRounds),
        CreatorAnswer: new MockEntity('CreatorAnswers', mockCreatorAnswers),
        User: new MockEntity('Users', mockUsers),
        Review: new MockEntity('Reviews', mockReviews),
        LocationBranch: new MockEntity('LocationBranches', mockLocationBranches)
    },
    agents: {
        listConversations: async () => {
            await delay();
            return []; // No AI agent conversations in demo mode
        },
        getWhatsAppConnectURL: (agentName) => {
            console.log(`Mock: getWhatsAppConnectURL for agent: ${agentName}`);
            return null; // Return null to indicate no WhatsApp integration in demo mode
        }
    },
    integrations: {
        Core: {
            UploadFile: async (file) => {
                await delay();
                console.log('Mock: UploadFile called', file?.name);
                // Return a fake URL for the uploaded file
                return {
                    url: `https://mock-storage.example.com/images/${Date.now()}-${file?.name || 'image.jpg'}`,
                    success: true
                };
            },
            InvokeLLM: async ({ prompt, response_json_schema }) => {
                await delay(1000);
                console.log('Mock: InvokeLLM', prompt);

                // Return mock data based on schema structure
                if (response_json_schema?.properties?.results) {
                    return {
                        results: [
                            { name: "Mock Place 1", address: "Mock St 1, Warsaw, Poland", description: "A popular mock cafe" },
                            { name: "Mock Place 2", address: "Mock St 2, Krakow, Poland", description: "Another nice spot" }
                        ]
                    };
                }

                return {
                    description: "AI-generated mock description: This place is fantastic!",
                    insider_tip: "Try the corner table for best views.",
                    must_try: "Signature Mock Latte",
                    opening_hours: "08:00 - 22:00",
                    ...(response_json_schema?.properties ?
                        Object.keys(response_json_schema.properties).reduce((acc, key) => ({ ...acc, [key]: `Mock ${key}` }), {}) : {})
                };
            }
        }
    },
    functions: {
        invoke: async (functionName, params) => {
            await delay();
            console.log(`Mock function call: ${functionName}`, params);
            // Mock function responses
            if (functionName === 'importLocations') {
                return { data: { created: 0, updated: 0, errors: 0, errorDetails: [], createdIds: [], updatedChanges: [] } };
            }
            if (functionName === 'bulkImportLocations') {
                return { data: { success: 0, failed: 0 } };
            }

            if (functionName === 'searchGooglePlaces') {
                return {
                    data: {
                        success: true,
                        source: 'mock_google',
                        places: [
                            {
                                name: "Mock Google Café",
                                address: "Aleje Jerozolimskie 1, Warsaw, Poland",
                                latitude: 52.2318,
                                longitude: 21.0060,
                                primaryType: "cafe",
                                priceLevel: "PRICE_LEVEL_MODERATE",
                                rating: 4.5,
                                userRatingCount: 120
                            }
                        ]
                    }
                };
            }

            if (functionName === 'normalizeTags') {
                return { data: { normalizedTags: params.tags || [] } };
            }

            if (functionName === 'getCreatorTasks') {
                // Return a random location and question
                const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
                const randomQuestion = mockReviewQuestions[Math.floor(Math.random() * mockReviewQuestions.length)];
                return {
                    data: {
                        success: true,
                        question: randomQuestion,
                        location: randomLocation,
                        remainingCount: 5
                    }
                };
            }

            if (functionName === 'submitCreatorAnswer') {
                return {
                    data: {
                        success: true,
                        total_points: 10
                    }
                };
            }

            return { data: {} };
        }
    },
    appLogs: {
        logUserInApp: async (pageName) => {
            console.log(`Mock: logUserInApp - ${pageName}`);
            return { success: true };
        },
        logEvent: async (name, data) => {
            console.log(`Mock: logEvent - ${name}`, data);
            return { success: true };
        }
    },
    storage: {
        upload: async (path, file) => {
            console.log(`Mock: storage upload to ${path}`);
            return { path };
        },
        getPublicUrl: (path) => {
            return `https://mock-storage.example.com/${path}`;
        }
    }
};
