// Centralized constants for the application

export const typeLabels = {
    cafe: "Cafe",
    bar: "Bar",
    restaurant: "Restaurant",
    market: "Market",
    shop: "Shop",
    bakery: "Bakery",
    winery: "Winery"
};

export const typeColors = {
    cafe: "bg-amber-100 text-amber-700",
    bar: "bg-purple-100 text-purple-700",
    restaurant: "bg-rose-100 text-rose-700",
    market: "bg-green-100 text-green-700",
    shop: "bg-blue-100 text-blue-700",
    bakery: "bg-orange-100 text-orange-700",
    winery: "bg-red-100 text-red-700"
};

export const specialLabels = [
    // Specialties & Cuisine
    { id: 'specialtyCoffee', label: 'Specialty Coffee', emoji: '☕', category: 'Specialties' },
    { id: 'fusionCuisine', label: 'Fusion Cuisine', emoji: '🍱', category: 'Specialties' },
    { id: 'chefCuisine', label: 'Chef Cuisine', emoji: '👨‍🍳', category: 'Specialties' },
    { id: 'streetFood', label: 'Street Food', emoji: '🌮', category: 'Specialties' },
    { id: 'tastyDesserts', label: 'Tasty Desserts', emoji: '🍰', category: 'Specialties' },
    { id: 'homemadeDesserts', label: 'Homemade Desserts', emoji: '🧁', category: 'Specialties' },
    { id: 'freshPastries', label: 'Fresh Pastries', emoji: '🥖', category: 'Specialties' },
    { id: 'veganOptions', label: 'Vegan Options', emoji: '🌱', category: 'Specialties' },
    { id: 'glutenFreeOptions', label: 'Gluten-Free', emoji: '🌾', category: 'Specialties' },
    { id: 'locallySourcedIngredients', label: 'Local Ingredients', emoji: '🌿', category: 'Specialties' },
    { id: 'kidsMenu', label: 'Kids Menu', emoji: '👶', category: 'Specialties' },
    { id: 'seasonalMenu', label: 'Seasonal Menu', emoji: '🍂', category: 'Specialties' },

    // Meal Times
    { id: 'breakfastMenu', label: 'Breakfast Menu', emoji: '🥐', category: 'Meal Times' },
    { id: 'allDayBreakfast', label: 'All Day Breakfast', emoji: '🍳', category: 'Meal Times' },
    { id: 'lunchMenu', label: 'Lunch Menu', emoji: '🍱', category: 'Meal Times' },
    { id: 'businessLunch', label: 'Business Lunch', emoji: '💼', category: 'Meal Times' },
    { id: 'lateDinner', label: 'Late Dinner', emoji: '🌙', category: 'Meal Times' },

    // Facilities & Service
    { id: 'coworkingSpace', label: 'Coworking Zone', emoji: '💼', category: 'Facilities' },
    { id: 'petFriendly', label: 'Pet Friendly', emoji: '🐾', category: 'Facilities' },
    { id: 'boardGamesAvailable', label: 'Board Games', emoji: '🎲', category: 'Facilities' },
    { id: 'hookahAvailable', label: 'Hookah', emoji: '💨', category: 'Facilities' },
    { id: 'wheelchairAccessible', label: 'Wheelchair Accessible', emoji: '♿', category: 'Facilities' },
    { id: 'kidsPlayArea', label: 'Kids Play Area', emoji: '🧸', category: 'Facilities' },
    { id: 'highChairsAvailable', label: 'High Chairs', emoji: '👶', category: 'Facilities' },
    { id: 'outdoorSeating', label: 'Outdoor Seating', emoji: '🌳', category: 'Facilities' },
    { id: 'parkingAvailable', label: 'Parking', emoji: '🅿️', category: 'Facilities' },
    { id: 'freeWifi', label: 'Free Wi-Fi', emoji: '📶', category: 'Facilities' },
    { id: 'chargingOutlets', label: 'Charging Outlets', emoji: '🔌', category: 'Facilities' },
    { id: 'deliveryService', label: 'Delivery', emoji: '🚗', category: 'Facilities' },
    { id: 'takeawayAvailable', label: 'Takeaway', emoji: '🥡', category: 'Facilities' },
    { id: 'coatCheck', label: 'Coat Check', emoji: '🧥', category: 'Facilities' },
    { id: 'eventSpace', label: 'Event Space', emoji: '🎊', category: 'Facilities' },

    // Atmosphere & Drinks
    { id: 'cozyRestaurant', label: 'Cozy', emoji: '🕯️', category: 'Atmosphere' },
    { id: 'liveMusic', label: 'Live Music', emoji: '🎵', category: 'Atmosphere' },
    { id: 'djSets', label: 'DJ Sets', emoji: '🎧', category: 'Atmosphere' },
    { id: 'danceFloor', label: 'Dance Floor', emoji: '💃', category: 'Atmosphere' },
    { id: 'karaoke', label: 'Karaoke', emoji: '🎤', category: 'Atmosphere' },
    { id: 'rooftopBar', label: 'Rooftop', emoji: '🌆', category: 'Atmosphere' },
    { id: 'craftCocktails', label: 'Craft Cocktails', emoji: '🍸', category: 'Atmosphere' },
    { id: 'craftBeer', label: 'Craft Beer', emoji: '🍺', category: 'Atmosphere' },
    { id: 'extensiveWineList', label: 'Wine List', emoji: '🍾', category: 'Atmosphere' },
    { id: 'wineTasting', label: 'Wine Tasting', emoji: '🍷', category: 'Atmosphere' },
    { id: 'romanticSetting', label: 'Romantic', emoji: '💖', category: 'Atmosphere' },
    { id: 'localFavorite', label: 'Local Favorite', emoji: '❤️', category: 'Atmosphere' },
    { id: 'quietAtmosphere', label: 'Quiet', emoji: '🤫', category: 'Atmosphere' },
    { id: 'livelyAtmosphere', label: 'Lively', emoji: '🎉', category: 'Atmosphere' },
    { id: 'scenicView', label: 'Scenic View', emoji: '🌅', category: 'Atmosphere' },
    { id: 'happyHour', label: 'Happy Hour', emoji: '🥳', category: 'Atmosphere' },
    { id: 'sportsBroadcasts', label: 'Sports Broadcasts', emoji: '📺', category: 'Atmosphere' },
    { id: 'faceControl', label: 'Face Control', emoji: '🚪', category: 'Atmosphere' },
    { id: 'dressCode', label: 'Dress Code', emoji: '👔', category: 'Atmosphere' },

    // Awards
    { id: 'michelinStar', label: 'Michelin Star', emoji: '⭐', category: 'Awards' },
    { id: 'michelinGuide', label: 'Michelin Guide', emoji: '📖', category: 'Awards' }
];