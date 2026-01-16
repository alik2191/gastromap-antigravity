// Mock data for the application
export const mockLocations = [
    // Poland
    {
        id: 1,
        name: 'Krakow Coffee Roastery',
        country: 'Poland',
        countryCode: 'PL',
        city: 'Krakow',
        description: 'Artisanal coffee roastery with expertly crafted espresso drinks and cozy atmosphere',
        address: 'ul. Floriańska 12, Krakow',
        latitude: 50.0647,
        longitude: 19.9450,
        type: '☕ Cafe',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
        tags: ['Coffee', 'Breakfast', 'Cozy'],
        rating: 4.8
    },
    {
        id: 2,
        name: 'Pierogi Heaven',
        country: 'Poland',
        countryCode: 'PL',
        city: 'Krakow',
        description: 'Traditional Polish restaurant serving authentic pierogi with modern twists',
        address: 'ul. Grodzka 45, Krakow',
        latitude: 50.0615,
        longitude: 19.9365,
        type: '🍴 Restaurant',
        image: 'https://images.unsplash.com/photo-1562967916-d8271385b7a8?w=800&h=600&fit=crop',
        tags: ['Polish Cuisine', 'Traditional', 'Family-Friendly'],
        rating: 4.7
    },
    {
        id: 3,
        name: 'Warsaw Skyline Bistro',
        country: 'Poland',
        countryCode: 'PL',
        city: 'Warsaw',
        description: 'Contemporary bistro with panoramic cityviews and innovative European cuisine',
        address: 'Złota 44, Warsaw',
        latitude: 52.2297,
        longitude: 21.0122,
        type: '🍴 Restaurant',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
        tags: ['Fine Dining', 'Modern', 'Rooftop'],
        rating: 4.9
    },

    // Italy
    {
        id: 4,
        name: 'Trattoria Roma Antica',
        country: 'Italy',
        countryCode: 'IT',
        city: 'Rome',
        description: 'Family-run trattoria serving authentic Roman cuisine since 1960',
        address: 'Via della Lungaretta 88, Rome',
        latitude: 41.8902,
        longitude: 12.4731,
        type: '🍴 Restaurant',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
        tags: ['Italian', 'Traditional', 'Pasta'],
        rating: 4.8
    },
    {
        id: 5,
        name: 'Caffè Florian',
        country: 'Italy',
        countryCode: 'IT',
        city: 'Venice',
        description: 'Historic café in Piazza San Marco, operating since 1720',
        address: 'Piazza San Marco 57, Venice',
        latitude: 45.4335,
        longitude: 12.3389,
        type: '☕ Cafe',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop',
        tags: ['Historic', 'Coffee', 'Iconic'],
        rating: 4.6
    },
    {
        id: 6,
        name: 'Gelateria del Teatro',
        country: 'Italy',
        countryCode: 'IT',
        city: 'Rome',
        description: 'Artisanal gelato made fresh daily with seasonal ingredients',
        address: 'Via dei Coronari 65, Rome',
        latitude: 41.8986,
        longitude: 12.4691,
        type: '🍨 Gelato',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
        tags: ['Gelato', 'Dessert', 'Artisanal'],
        rating: 4.9
    },

    // France
    {
        id: 7,
        name: 'Le Comptoir du Relais',
        country: 'France',
        countryCode: 'FR',
        city: 'Paris',
        description: 'Classic Parisian bistro with seasonal menu and wine selection',
        address: '9 Carrefour de l\'Odéon, Paris',
        latitude: 48.8515,
        longitude: 2.3398,
        type: '🍴 Restaurant',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
        tags: ['French', 'Bistro', 'Wine'],
        rating: 4.7
    },
    {
        id: 8,
        name: 'Boulangerie Poilâne',
        country: 'France',
        countryCode: 'FR',
        city: 'Paris',
        description: 'Legendary bakery famous for sourdough bread and apple tarts',
        address: '8 Rue du Cherche-Midi, Paris',
        latitude: 48.8508,
        longitude: 2.3265,
        type: '🥐 Bakery',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
        tags: ['Bakery', 'Bread', 'Pastries'],
        rating: 4.8
    },

    // Spain
    {
        id: 9,
        name: 'Tickets Bar',
        country: 'Spain',
        countryCode: 'ES',
        city: 'Barcelona',
        description: 'Avant-garde tapas bar by renowned chef Albert Adrià',
        address: 'Av. del Paral·lel 164, Barcelona',
        latitude: 41.3746,
        longitude: 2.1559,
        type: '🍴 Restaurant',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
        tags: ['Tapas', 'Modern', 'Innovative'],
        rating: 4.9
    },
    {
        id: 10,
        name: 'La Boqueria Market',
        country: 'Spain',
        countryCode: 'ES',
        city: 'Barcelona',
        description: 'Vibrant public market with fresh produce and local delicacies',
        address: 'La Rambla 91, Barcelona',
        latitude: 41.3818,
        longitude: 2.1713,
        type: '🛒 Market',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop',
        tags: ['Market', 'Fresh Food', 'Local'],
        rating: 4.7
    },

    // Japan
    {
        id: 11,
        name: 'Sukiyabashi Jiro',
        country: 'Japan',
        countryCode: 'JP',
        city: 'Tokyo',
        description: 'Three-Michelin-starred sushi restaurant by master Jiro Ono',
        address: '4 Chome-2-15 Ginza, Tokyo',
        latitude: 35.6709,
        longitude: 139.7632,
        type: '🍣 Sushi',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
        tags: ['Sushi', 'Fine Dining', 'Michelin'],
        rating: 5.0
    },
    {
        id: 12,
        name: 'Ichiran Ramen',
        country: 'Japan',
        countryCode: 'JP',
        city: 'Tokyo',
        description: 'Famous for tonkotsu ramen in private dining booths',
        address: '1-22-7 Jinnan, Shibuya, Tokyo',
        latitude: 35.6625,
        longitude: 139.6989,
        type: '🍜 Ramen',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
        tags: ['Ramen', 'Casual', 'Authentic'],
        rating: 4.6
    },

    // USA
    {
        id: 13,
        name: 'The French Laundry',
        country: 'USA',
        countryCode: 'US',
        city: 'Yountville',
        description: 'Three-Michelin-star restaurant by chef Thomas Keller',
        address: '6640 Washington St, Yountville, CA',
        latitude: 38.4020,
        longitude: -122.3610,
        type: '🍴 Restaurant',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
        tags: ['Fine Dining', 'French', 'Michelin'],
        rating: 5.0
    },
    {
        id: 14,
        name: 'Blue Bottle Coffee',
        country: 'USA',
        countryCode: 'US',
        city: 'San Francisco',
        description: 'Specialty coffee roaster with minimalist aesthetic',
        address: '66 Mint Plaza, San Francisco, CA',
        latitude: 37.7820,
        longitude: -122.4076,
        type: '☕ Cafe',
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
        tags: ['Coffee', 'Specialty', 'Modern'],
        rating: 4.5
    },
    {
        id: 15,
        name: 'Joe\'s Pizza',
        country: 'USA',
        countryCode: 'US',
        city: 'New York',
        description: 'Iconic NYC pizza joint serving classic New York slices since 1975',
        address: '7 Carmine St, New York, NY',
        latitude: 40.7306,
        longitude: -74.0022,
        type: '🍕 Pizza',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
        tags: ['Pizza', 'Classic', 'Casual'],
        rating: 4.7
    }
];

// Achievement definitions
export const achievementDefinitions = [
    {
        id: 'first_visit',
        title: 'First Taste',
        description: 'Visit your first location',
        icon: '🎯',
        tier: 'bronze',
        requirement: 1
    },
    {
        id: 'explorer',
        title: 'Explorer',
        description: 'Visit 5 different locations',
        icon: '🗺️',
        tier: 'silver',
        requirement: 5
    },
    {
        id: 'world_traveler',
        title: 'World Traveler',
        description: 'Visit 10 different locations',
        icon: '✈️',
        tier: 'gold',
        requirement: 10
    },
    {
        id: 'gastronome',
        title: 'Gastronome',
        description: 'Visit 25 different locations',
        icon: '👨‍🍳',
        tier: 'platinum',
        requirement: 25
    },
    {
        id: 'country_collector',
        title: 'Country Collector',
        description: 'Visit locations in 5 different countries',
        icon: '🌍',
        tier: 'gold',
        requirement: 5
    }
];

// Mock users for admin panel
export const mockUsers = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        joinedAt: '2024-01-15',
        visitedCount: 12,
        subscription: 'free'
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        joinedAt: '2024-02-20',
        visitedCount: 8,
        subscription: 'premium'
    },
    {
        id: 3,
        name: 'Admin User',
        email: 'admin@gastromap.app',
        role: 'admin',
        joinedAt: '2023-12-01',
        visitedCount: 45,
        subscription: 'premium'
    }
];

// Group locations by country
export function getLocationsByCountry() {
    const grouped = {};

    mockLocations.forEach(location => {
        if (!grouped[location.country]) {
            grouped[location.country] = {
                code: location.countryCode,
                locations: []
            };
        }
        grouped[location.country].locations.push(location);
    });

    return grouped;
}

// Get country flags
export function getCountryFlag(countryCode) {
    const flags = {
        'PL': '🇵🇱',
        'IT': '🇮🇹',
        'FR': '🇫🇷',
        'ES': '🇪🇸',
        'JP': '🇯🇵',
        'US': '🇺🇸'
    };
    return flags[countryCode] || '🌍';
}
