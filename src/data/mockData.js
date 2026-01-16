// Mock data for standalone application without Base44
export const mockLocations = [
    {
        id: '1',
        name: 'Krakow Coffee Roastery',
        name_en: 'Krakow Coffee Roastery',
        name_ru: 'Краковская кофейня',
        city: 'Kraków',
        city_en: 'Krakow',
        city_ru: 'Краков',
        country: 'Poland',
        country_en: 'Poland',
        country_ru: 'Польша',
        address: 'ul. Szeroka 28, 31-053 Kraków',
        latitude: 50.0547,
        longitude: 19.9449,
        type: 'cafe',
        price_range: '$$',
        average_rating: 4.8,
        description: 'Artisanal coffee roastery with expertly crafted espresso drinks',
        description_en: 'Artisanal coffee roastery with expertly crafted espresso drinks',
        description_ru: 'Ремесленная обжарка кофе с изысканными напитками на основе эспрессо',
        image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
        special_labels: ['specialty_coffee', 'breakfast'],
        status: 'published',
        created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        created_by: 'creator@gastromap.app'
    },
    {
        id: '2',
        name: 'Trattoria Roma Antica',
        name_en: 'Trattoria Roma Antica',
        name_ru: 'Тратория Рома Антика',
        city: 'Rome',
        city_en: 'Rome',
        city_ru: 'Рим',
        country: 'Italy',
        country_en: 'Italy',
        country_ru: 'Италия',
        address: 'Via della Croce 81, 00187 Roma',
        latitude: 41.9028,
        longitude: 12.4964,
        type: 'restaurant',
        price_range: '$$$',
        average_rating: 4.9,
        description: 'Traditional Roman cuisine in historic setting',
        description_en: 'Traditional Roman cuisine in historic setting',
        description_ru: 'Традиционная римская кухня в историческом месте',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        special_labels: ['authentic', 'family_owned'],
        status: 'published',
        created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'creator@gastromap.app'
    },
    {
        id: '3',
        name: 'Le Comptoir du Relais',
        name_en: 'Le Comptoir du Relais',
        name_ru: 'Ле Комптуар дю Реле',
        city: 'Paris',
        city_en: 'Paris',
        city_ru: 'Париж',
        country: 'France',
        country_en: 'France',
        country_ru: 'Франция',
        address: '9 Carrefour de l\'Odéon, 75006 Paris',
        latitude: 48.8534,
        longitude: 2.3387,
        type: 'bistro',
        price_range: '$$',
        average_rating: 4.7,
        description: 'Classic Parisian bistro near Luxembourg Gardens',
        description_en: 'Classic Parisian bistro near Luxembourg Gardens',
        description_ru: 'Классическое парижское бистро у Люксембургского сада',
        image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
        special_labels: ['romantic', 'wine_selection'],
        status: 'published',
        created_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'creator@gastromap.app'
    },
    {
        id: '4',
        name: 'Tapas Bar Barcelona',
        name_en: 'Tapas Bar Barcelona',
        name_ru: 'Тапас Бар Барселона',
        city: 'Barcelona',
        city_en: 'Barcelona',
        city_ru: 'Барселона',
        country: 'Spain',
        country_en: 'Spain',
        country_ru: 'Испания',
        address: 'Carrer de Blai 17, 08004 Barcelona',
        latitude: 41.3764,
        longitude: 2.1729,
        type: 'tapas_bar',
        price_range: '$',
        average_rating: 4.6,
        description: 'Authentic tapas and sangria in lively atmosphere',
        description_en: 'Authentic tapas and sangria in lively atmosphere',
        description_ru: 'Аутентичные тапас и сангрия в живой атмосфере',
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
        special_labels: ['local_favorite', 'outdoor_seating'],
        status: 'published',
        created_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'creator@gastromap.app'
    },
    {
        id: '5',
        name: 'Sukiyabashi Jiro',
        name_en: 'Sukiyabashi Jiro',
        name_ru: 'Сукиябаси Дзиро',
        city: 'Tokyo',
        city_en: 'Tokyo',
        city_ru: 'Токио',
        country: 'Japan',
        country_en: 'Japan',
        country_ru: 'Япония',
        address: 'Tsukamoto Sogyo Building B1F, 4-2-15 Ginza, Chuo-ku',
        latitude: 35.6702,
        longitude: 139.7649,
        type: 'sushi',
        price_range: '$$$$',
        average_rating: 5.0,
        description: 'World-renowned sushi restaurant by master Jiro Ono',
        description_en: 'World-renowned sushi restaurant by master Jiro Ono',
        description_ru: 'Всемирно известный суши-ресторан мастера Дзиро Оно',
        image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
        special_labels: ['michelin_star', 'reservation_required'],
        is_hidden_gem: false,
        status: 'published',
        created_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'creator@gastromap.app'
    },
    {
        id: '6',
        name: 'Blue Bottle Coffee',
        name_en: 'Blue Bottle Coffee',
        name_ru: 'Блю Боттл Кофе',
        city: 'San Francisco',
        city_en: 'San Francisco',
        city_ru: 'Сан-Франциско',
        country: 'USA',
        country_en: 'USA',
        country_ru: 'США',
        address: '66 Mint St Plaza, San Francisco, CA 94103',
        latitude: 37.7799,
        longitude: -122.4084,
        type: 'cafe',
        price_range: '$$',
        average_rating: 4.5,
        description: 'Specialty coffee pioneer with minimalist aesthetic',
        description_en: 'Specialty coffee pioneer with minimalist aesthetic',
        description_ru: 'Пионер спешелти кофе с минималистичным дизайном',
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
        special_labels: ['specialty_coffee', 'minimalist'],
        status: 'published',
        created_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'creator@gastromap.app'
    },
    {
        id: '7',
        name: 'Pierogi Heaven',
        name_en: 'Pierogi Heaven',
        name_ru: 'Пирожковый Рай',
        city: 'Kraków',
        city_en: 'Krakow',
        city_ru: 'Краков',
        country: 'Poland',
        country_en: 'Poland',
        country_ru: 'Польша',
        address: 'ul. św. Tomasza 24, 31-027 Kraków',
        latitude: 50.0620,
        longitude: 19.9368,
        type: 'restaurant',
        price_range: '$',
        average_rating: 4.4,
        description: 'Traditional Polish pierogi made fresh daily',
        description_en: 'Traditional Polish pierogi made fresh daily',
        description_ru: 'Традиционные польские пироги, готовятся свежими каждый день',
        image_url: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800&q=80',
        special_labels: ['traditional', 'budget_friendly'],
        is_hidden_gem: true,
        status: 'published',
        created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'creator@gastromap.app'
    },
    {
        id: '8',
        name: 'Gelateria del Teatro',
        name_en: 'Gelateria del Teatro',
        name_ru: 'Джелатерия дель Театро',
        city: 'Rome',
        city_en: 'Rome',
        city_ru: 'Рим',
        country: 'Italy',
        country_en: 'Italy',
        country_ru: 'Италия',
        address: 'Via dei Coronari 65, 00186 Roma',
        latitude: 41.9006,
        longitude: 12.4708,
        type: 'gelato',
        price_range: '$',
        average_rating: 4.9,
        description: 'Artisanal gelato with unique seasonal flavors',
        description_en: 'Artisanal gelato with unique seasonal flavors',
        description_ru: 'Ремесленное мороженое с уникальными сезонными вкусами',
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
        special_labels: ['dessert', 'instagram_worthy'],
        is_hidden_gem: true,
        status: 'published',
        created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'creator@gastromap.app'
    }
];

export const mockSavedLocations = [
    {
        id: 'saved-1',
        user_email: 'demo@gastromap.app',
        location_id: '1',
        list_type: 'wishlist', // 'wishlist' or 'visited'
        personal_note: 'Want to try their specialty coffee',
        created_date: new Date().toISOString()
    },
    {
        id: 'saved-2',
        user_email: 'demo@gastromap.app',
        location_id: '2',
        list_type: 'visited',
        personal_note: 'Amazing carbonara! Will visit again',
        rating: 5,
        created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const mockRegionStatuses = [
    {
        id: 'region-1',
        region_name: 'Poland',
        region_type: 'country',
        is_active: true,
        is_coming_soon: false,
        image_url: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80'
    },
    {
        id: 'region-2',
        region_name: 'Italy',
        region_type: 'country',
        is_active: true,
        is_coming_soon: false,
        image_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80'
    },
    {
        id: 'region-3',
        region_name: 'France',
        region_type: 'country',
        is_active: true,
        is_coming_soon: false,
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80'
    }
];

export const mockReviewQuestions = [
    {
        id: 'q1',
        question_text: 'Is this location suitable for laptop work?',
        field_name: 'laptop_friendly',
        suggested_answer_text: 'Review mentions: "Great place to work with laptop, fast wifi"',
        proposed_tags: []
    },
    {
        id: 'q2',
        question_text: 'Does this place serve specialty coffee?',
        field_name: 'specialty_coffee',
        suggested_answer_text: 'Tags include "Specialty Coffee"',
        proposed_tags: ['specialty_coffee']
    }
];

export const mockSubscriptions = [
    {
        id: 'sub-1',
        user_email: 'demo@gastromap.app',
        status: 'active',
        plan: 'monthly',
        amount_paid: 9.99,
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        city: 'Krakow',
        country: 'Poland'
    }
];

export const mockFeedback = [
    {
        id: 'feedback-1',
        user_email: 'user1@example.com',
        message: 'Great app! Would love to see more locations in Asia.',
        status: 'new',
        created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const mockModerationRounds = [];

export const mockCreatorAnswers = [];

export const mockUsers = [
    {
        id: 'user-1',
        email: 'demo@gastromap.app',
        name: 'Demo User',
        role: 'admin',
        custom_role: 'admin',
        created_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'user-2',
        email: 'creator@gastromap.app',
        name: 'Creator User',
        role: 'creator',
        custom_role: 'creator',
        created_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'user-3',
        email: 'user@gastromap.app',
        name: 'Regular User',
        role: 'user',
        custom_role: null,
        created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const mockReviews = [
    {
        id: 'review-1',
        location_id: '1',
        user_email: 'user@gastromap.app',
        rating: 5,
        comment: 'Amazing coffee! Best in Krakow.',
        status: 'approved',
        is_hidden: false,
        created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
];
export const mockLocationBranches = [];
