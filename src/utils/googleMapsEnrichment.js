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

