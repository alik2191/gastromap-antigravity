import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Location {
    name: string
    address?: string
    city: string
    country: string
    latitude?: number
    longitude?: number
    website?: string
    image_url?: string
    price_range?: string
}

interface EnrichmentOptions {
    enrichCoordinates?: boolean
    enrichRating?: boolean
    enrichPhotos?: boolean
    enrichWebsite?: boolean
    enrichPriceRange?: boolean
}

interface EnrichmentResult {
    original: Location
    enriched: Record<string, any>
    metadata: {
        success: boolean
        source: string
        timestamp: string
        fieldsEnriched: string[]
        errors: string[]
    }
}

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'
const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode'

async function searchPlace(query: string): Promise<any> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not configured')
    }

    const url = new URL(`${PLACES_API_BASE}/textsearch/json`)
    url.searchParams.append('query', query)
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0]
    }

    if (data.status === 'ZERO_RESULTS') {
        return null
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('Google Maps API quota exceeded')
    }

    throw new Error(`Places API error: ${data.status}`)
}

async function getPlaceDetails(placeId: string): Promise<any> {
    if (!GOOGLE_MAPS_API_KEY) {
        return null
    }

    const url = new URL(`${PLACES_API_BASE}/details/json`)
    url.searchParams.append('place_id', placeId)
    url.searchParams.append('fields', 'name,rating,user_ratings_total,formatted_address,geometry,opening_hours,photos,website,formatted_phone_number,price_level')
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK' && data.result) {
        return data.result
    }

    return null
}

function getPhotoUrl(photoReference: string, maxWidth: number = 800): string | null {
    if (!GOOGLE_MAPS_API_KEY || !photoReference) {
        return null
    }

    return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`
}

function convertPriceLevel(priceLevel: number | undefined): string | null {
    if (priceLevel === undefined || priceLevel === null) return null

    const mapping: Record<number, string> = {
        0: '$',
        1: '$',
        2: '$$',
        3: '$$$',
        4: '$$$$'
    }

    return mapping[priceLevel] || '$$'
}

async function enrichLocation(
    location: Location,
    options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
    const {
        enrichCoordinates = true,
        enrichRating = true,
        enrichPhotos = true,
        enrichWebsite = true,
        enrichPriceRange = true
    } = options

    const result: EnrichmentResult = {
        original: { ...location },
        enriched: {},
        metadata: {
            success: false,
            source: 'google_maps',
            timestamp: new Date().toISOString(),
            fieldsEnriched: [],
            errors: []
        }
    }

    try {
        // Build search query
        const searchQuery = [
            location.name,
            location.address,
            location.city,
            location.country
        ].filter(Boolean).join(', ')

        // Search for the place
        const placeSearchResult = await searchPlace(searchQuery)

        if (!placeSearchResult) {
            result.metadata.errors.push('Place not found in Google Maps')
            return result
        }

        // Get detailed information
        const placeDetails = await getPlaceDetails(placeSearchResult.place_id)

        // Enrich coordinates
        if (enrichCoordinates && (!location.latitude || !location.longitude)) {
            if (placeDetails?.geometry?.location) {
                result.enriched.latitude = placeDetails.geometry.location.lat
                result.enriched.longitude = placeDetails.geometry.location.lng
                result.metadata.fieldsEnriched.push('coordinates')
            } else if (placeSearchResult.geometry?.location) {
                result.enriched.latitude = placeSearchResult.geometry.location.lat
                result.enriched.longitude = placeSearchResult.geometry.location.lng
                result.metadata.fieldsEnriched.push('coordinates')
            }
        }

        // Enrich rating
        if (enrichRating && placeDetails?.rating) {
            result.enriched.google_rating = placeDetails.rating
            result.enriched.google_reviews_count = placeDetails.user_ratings_total || 0
            result.metadata.fieldsEnriched.push('rating')
        }

        // Enrich photos
        if (enrichPhotos && !location.image_url && placeDetails?.photos && placeDetails.photos.length > 0) {
            const photoReference = placeDetails.photos[0].photo_reference
            result.enriched.image_url = getPhotoUrl(photoReference)
            result.metadata.fieldsEnriched.push('photo')
        }

        // Enrich website
        if (enrichWebsite && !location.website && placeDetails?.website) {
            result.enriched.website = placeDetails.website
            result.metadata.fieldsEnriched.push('website')
        }

        // Enrich price range
        if (enrichPriceRange && !location.price_range && placeDetails?.price_level !== undefined) {
            result.enriched.price_range = convertPriceLevel(placeDetails.price_level)
            result.metadata.fieldsEnriched.push('price_range')
        }

        // Enrich phone
        if (placeDetails?.formatted_phone_number) {
            result.enriched.phone = placeDetails.formatted_phone_number
            result.metadata.fieldsEnriched.push('phone')
        }

        // Enrich address if missing
        if (!location.address && placeDetails?.formatted_address) {
            result.enriched.address = placeDetails.formatted_address
            result.metadata.fieldsEnriched.push('address')
        }

        // Store Google Place ID for future reference
        result.enriched.google_place_id = placeSearchResult.place_id

        result.metadata.success = result.metadata.fieldsEnriched.length > 0

    } catch (error) {
        result.metadata.errors.push(error.message)
        console.error('Error enriching location:', error)
    }

    return result
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { locations, options } = await req.json()

        if (!locations || !Array.isArray(locations)) {
            throw new Error('Invalid request: locations array is required')
        }

        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured in Supabase Secrets')
        }

        // Enrich all locations
        const results: EnrichmentResult[] = []

        for (const location of locations) {
            try {
                const result = await enrichLocation(location, options || {})
                results.push(result)

                // Add delay between requests to respect rate limits
                if (locations.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 300))
                }
            } catch (error) {
                results.push({
                    original: location,
                    enriched: {},
                    metadata: {
                        success: false,
                        source: 'google_maps',
                        timestamp: new Date().toISOString(),
                        fieldsEnriched: [],
                        errors: [error.message]
                    }
                })
            }
        }

        return new Response(
            JSON.stringify({ results }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
