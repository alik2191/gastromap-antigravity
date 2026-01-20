/**
 * Google Maps Places API enrichment utilities (Server-side via Edge Function)
 * API ключ хранится в Supabase Secrets, все запросы идут через Edge Function
 */

import { api } from '@/api/client';

// Cache to avoid duplicate API calls
const enrichmentCache = new Map();

/**
 * Generate cache key for a location
 */
function getCacheKey(name, address, city, country) {
    return `${name}|${address}|${city}|${country}`.toLowerCase().trim();
}

/**
 * Delay helper for rate limiting
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enrich a single location with Google Maps data via Edge Function
 * @param {object} location - Location object with name, address, city, country
 * @param {object} options - Enrichment options
 * @returns {Promise<object>} Enriched location data with metadata
 */
export async function enrichLocation(location, options = {}) {
    const {
        enrichCoordinates = true,
        enrichRating = true,
        enrichOpeningHours = false,
        enrichPhotos = true,
        enrichWebsite = true,
        enrichPriceRange = true,
        delayMs = 200
    } = options;

    // Check cache first
    const cacheKey = getCacheKey(location.name, location.address, location.city, location.country);
    if (enrichmentCache.has(cacheKey)) {
        return enrichmentCache.get(cacheKey);
    }

    const result = {
        original: { ...location },
        enriched: {},
        metadata: {
            success: false,
            source: 'google_maps_edge_function',
            timestamp: new Date().toISOString(),
            fieldsEnriched: [],
            errors: []
        }
    };

    try {
        // Call Edge Function
        const { data, error } = await api.supabase.functions.invoke('google-maps-enrich', {
            body: {
                locations: [location],
                options: {
                    enrichCoordinates,
                    enrichRating,
                    enrichPhotos,
                    enrichWebsite,
                    enrichPriceRange
                }
            }
        });

        if (error) {
            throw new Error(error.message || 'Edge Function error');
        }

        if (!data || !data.results || data.results.length === 0) {
            throw new Error('No results from Edge Function');
        }

        const edgeFunctionResult = data.results[0];

        // Copy enriched data and metadata from Edge Function response
        result.enriched = edgeFunctionResult.enriched || {};
        result.metadata = {
            ...result.metadata,
            ...edgeFunctionResult.metadata,
            source: 'google_maps_edge_function'
        };

    } catch (error) {
        result.metadata.errors.push(error.message);
        console.error('Error enriching location:', error);
    }

    // Cache the result
    enrichmentCache.set(cacheKey, result);

    return result;
}

/**
 * Enrich multiple locations in batch via Edge Function
 * @param {Array<object>} locations - Array of location objects
 * @param {object} options - Enrichment options
 * @param {function} onProgress - Progress callback (current, total, location, result)
 * @returns {Promise<Array<object>>} Array of enrichment results
 */
export async function enrichLocationsBatch(locations, options = {}, onProgress = null) {
    const results = [];
    const total = locations.length;

    // Process in smaller batches to avoid timeout
    const batchSize = 5;

    for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);

        try {
            // Call Edge Function with batch
            const { data, error } = await api.supabase.functions.invoke('google-maps-enrich', {
                body: {
                    locations: batch,
                    options: {
                        enrichCoordinates: options.enrichCoordinates ?? true,
                        enrichRating: options.enrichRating ?? true,
                        enrichPhotos: options.enrichPhotos ?? true,
                        enrichWebsite: options.enrichWebsite ?? true,
                        enrichPriceRange: options.enrichPriceRange ?? true
                    }
                }
            });

            if (error) {
                throw new Error(error.message || 'Edge Function error');
            }

            if (!data || !data.results) {
                throw new Error('No results from Edge Function');
            }

            // Process results
            for (let j = 0; j < data.results.length; j++) {
                const result = data.results[j];
                const locationIndex = i + j;

                results.push(result);

                // Cache the result
                const location = batch[j];
                const cacheKey = getCacheKey(location.name, location.address, location.city, location.country);
                enrichmentCache.set(cacheKey, result);

                if (onProgress) {
                    onProgress(locationIndex + 1, total, location, result);
                }
            }

        } catch (error) {
            console.error(`Error enriching batch ${i}-${i + batchSize}:`, error);

            // Add error results for this batch
            for (const location of batch) {
                results.push({
                    original: location,
                    enriched: {},
                    metadata: {
                        success: false,
                        source: 'google_maps_edge_function',
                        timestamp: new Date().toISOString(),
                        fieldsEnriched: [],
                        errors: [error.message]
                    }
                });
            }
        }
    }

    return results;
}

/**
 * Clear the enrichment cache
 */
export function clearEnrichmentCache() {
    enrichmentCache.clear();
}

/**
 * Check if Google Maps Edge Function is available
 * @returns {boolean}
 */
export function isGoogleMapsConfigured() {
    // Edge Function is always available if Supabase is configured
    // API key is stored in Supabase Secrets
    return true;
}

/**
 * Geocode an address to get coordinates (via Edge Function)
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number}|null>} Coordinates or null
 */
export async function geocodeAddress(address) {
    try {
        const result = await enrichLocation(
            { name: address, address, city: '', country: '' },
            { enrichCoordinates: true, enrichRating: false, enrichPhotos: false }
        );

        if (result.enriched.latitude && result.enriched.longitude) {
            return {
                lat: result.enriched.latitude,
                lng: result.enriched.longitude
            };
        }

        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

export default {
    enrichLocation,
    enrichLocationsBatch,
    clearEnrichmentCache,
    isGoogleMapsConfigured,
    geocodeAddress
};

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';
const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode';

// Cache to avoid duplicate API calls
const enrichmentCache = new Map();

/**
 * Generate cache key for a location
 */
function getCacheKey(name, address, city, country) {
    return `${name}|${address}|${city}|${country}`.toLowerCase().trim();
}

/**
 * Delay helper for rate limiting
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for a place using Places API Text Search
 * @param {string} query - Search query (e.g., "Cafe Name, Address, City")
 * @returns {Promise<object|null>} Place data or null if not found
 */
async function searchPlace(query) {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not configured');
        return null;
    }

    try {
        const url = new URL(`${PLACES_API_BASE}/textsearch/json`);
        url.searchParams.append('query', query);
        url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            return data.results[0]; // Return first result
        }

        if (data.status === 'ZERO_RESULTS') {
            return null;
        }

        if (data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('Google Maps API quota exceeded');
        }

        throw new Error(`Places API error: ${data.status}`);
    } catch (error) {
        console.error('Error searching place:', error);
        throw error;
    }
}

/**
 * Get detailed place information using Place Details API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<object|null>} Detailed place data
 */
async function getPlaceDetails(placeId) {
    if (!GOOGLE_MAPS_API_KEY) {
        return null;
    }

    try {
        const url = new URL(`${PLACES_API_BASE}/details/json`);
        url.searchParams.append('place_id', placeId);
        url.searchParams.append('fields', 'name,rating,user_ratings_total,formatted_address,geometry,opening_hours,photos,website,formatted_phone_number,price_level');
        url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            return data.result;
        }

        return null;
    } catch (error) {
        console.error('Error getting place details:', error);
        return null;
    }
}

/**
 * Geocode an address to get coordinates
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number}|null>} Coordinates or null
 */
async function geocodeAddress(address) {
    if (!GOOGLE_MAPS_API_KEY) {
        return null;
    }

    try {
        const url = new URL(`${GEOCODING_API_BASE}/json`);
        url.searchParams.append('address', address);
        url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }

        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

/**
 * Get photo URL from Google Places photo reference
 * @param {string} photoReference - Photo reference from Places API
 * @param {number} maxWidth - Maximum width of the photo
 * @returns {string} Photo URL
 */
function getPhotoUrl(photoReference, maxWidth = 800) {
    if (!GOOGLE_MAPS_API_KEY || !photoReference) {
        return null;
    }

    return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Convert Google price level (0-4) to our price range ($-$$$$)
 * @param {number} priceLevel - Google price level
 * @returns {string} Price range
 */
function convertPriceLevel(priceLevel) {
    if (priceLevel === undefined || priceLevel === null) return null;

    const mapping = {
        0: '$',
        1: '$',
        2: '$$',
        3: '$$$',
        4: '$$$$'
    };

    return mapping[priceLevel] || '$$';
}

/**
 * Enrich a single location with Google Maps data
 * @param {object} location - Location object with name, address, city, country
 * @param {object} options - Enrichment options
 * @returns {Promise<object>} Enriched location data with metadata
 */
export async function enrichLocation(location, options = {}) {
    const {
        enrichCoordinates = true,
        enrichRating = true,
        enrichOpeningHours = true,
        enrichPhotos = true,
        enrichWebsite = true,
        enrichPriceRange = true,
        delayMs = 200 // Delay between API calls to respect rate limits
    } = options;

    // Check cache first
    const cacheKey = getCacheKey(location.name, location.address, location.city, location.country);
    if (enrichmentCache.has(cacheKey)) {
        return enrichmentCache.get(cacheKey);
    }

    const result = {
        original: { ...location },
        enriched: {},
        metadata: {
            success: false,
            source: 'google_maps',
            timestamp: new Date().toISOString(),
            fieldsEnriched: [],
            errors: []
        }
    };

    try {
        // Build search query
        const searchQuery = [
            location.name,
            location.address,
            location.city,
            location.country
        ].filter(Boolean).join(', ');

        // Search for the place
        await delay(delayMs);
        const placeSearchResult = await searchPlace(searchQuery);

        if (!placeSearchResult) {
            result.metadata.errors.push('Place not found in Google Maps');
            enrichmentCache.set(cacheKey, result);
            return result;
        }

        // Get detailed information
        await delay(delayMs);
        const placeDetails = await getPlaceDetails(placeSearchResult.place_id);

        // Enrich coordinates
        if (enrichCoordinates && (!location.latitude || !location.longitude)) {
            if (placeDetails?.geometry?.location) {
                result.enriched.latitude = placeDetails.geometry.location.lat;
                result.enriched.longitude = placeDetails.geometry.location.lng;
                result.metadata.fieldsEnriched.push('coordinates');
            } else if (placeSearchResult.geometry?.location) {
                result.enriched.latitude = placeSearchResult.geometry.location.lat;
                result.enriched.longitude = placeSearchResult.geometry.location.lng;
                result.metadata.fieldsEnriched.push('coordinates');
            }
        }

        // Enrich rating
        if (enrichRating && placeDetails?.rating) {
            result.enriched.google_rating = placeDetails.rating;
            result.enriched.google_ratings_total = placeDetails.user_ratings_total || 0;
            result.metadata.fieldsEnriched.push('rating');
        }

        // Enrich opening hours
        if (enrichOpeningHours && placeDetails?.opening_hours) {
            result.enriched.opening_hours = placeDetails.opening_hours.weekday_text || null;
            result.enriched.is_open_now = placeDetails.opening_hours.open_now || null;
            result.metadata.fieldsEnriched.push('opening_hours');
        }

        // Enrich photos
        if (enrichPhotos && !location.image_url && placeDetails?.photos && placeDetails.photos.length > 0) {
            const photoReference = placeDetails.photos[0].photo_reference;
            result.enriched.image_url = getPhotoUrl(photoReference);
            result.metadata.fieldsEnriched.push('photo');
        }

        // Enrich website
        if (enrichWebsite && !location.website && placeDetails?.website) {
            result.enriched.website = placeDetails.website;
            result.metadata.fieldsEnriched.push('website');
        }

        // Enrich price range
        if (enrichPriceRange && !location.price_range && placeDetails?.price_level !== undefined) {
            result.enriched.price_range = convertPriceLevel(placeDetails.price_level);
            result.metadata.fieldsEnriched.push('price_range');
        }

        // Enrich address if missing
        if (!location.address && placeDetails?.formatted_address) {
            result.enriched.address = placeDetails.formatted_address;
            result.metadata.fieldsEnriched.push('address');
        }

        // Store Google Place ID for future reference
        result.enriched.google_place_id = placeSearchResult.place_id;

        result.metadata.success = result.metadata.fieldsEnriched.length > 0;

    } catch (error) {
        result.metadata.errors.push(error.message);
        console.error('Error enriching location:', error);
    }

    // Cache the result
    enrichmentCache.set(cacheKey, result);

    return result;
}

/**
 * Enrich multiple locations in batch
 * @param {Array<object>} locations - Array of location objects
 * @param {object} options - Enrichment options
 * @param {function} onProgress - Progress callback (current, total, location)
 * @returns {Promise<Array<object>>} Array of enrichment results
 */
export async function enrichLocationsBatch(locations, options = {}, onProgress = null) {
    const results = [];
    const total = locations.length;

    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];

        try {
            const result = await enrichLocation(location, options);
            results.push(result);

            if (onProgress) {
                onProgress(i + 1, total, location, result);
            }
        } catch (error) {
            console.error(`Error enriching location ${i}:`, error);
            results.push({
                original: location,
                enriched: {},
                metadata: {
                    success: false,
                    errors: [error.message]
                }
            });
        }
    }

    return results;
}

/**
 * Clear the enrichment cache
 */
export function clearEnrichmentCache() {
    enrichmentCache.clear();
}

/**
 * Check if Google Maps API is configured
 * @returns {boolean}
 */
export function isGoogleMapsConfigured() {
    return !!GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 0;
}

export default {
    enrichLocation,
    enrichLocationsBatch,
    clearEnrichmentCache,
    isGoogleMapsConfigured,
    geocodeAddress
};
