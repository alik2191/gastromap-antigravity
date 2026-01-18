
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query, latitude, longitude, language = 'en' } = await req.json();
        const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

        if (!apiKey) {
            throw new Error('GOOGLE_PLACES_API_KEY is not set');
        }

        // Step 1: Find the Place ID
        let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=${language}`;
        if (latitude && longitude) {
            searchUrl += `&location=${latitude},${longitude}&radius=5000`;
        }

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Search API Error: ${searchData.status}`);
        }

        const candidate = searchData.results?.[0];

        if (!candidate) {
            return new Response(JSON.stringify({ found: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Step 2: Get Place Details
        // Fields: name,rating,formatted_phone_number,international_phone_number,opening_hours,website,price_level,reviews,user_ratings_total,formatted_address,url,photos
        const fields = 'name,rating,formatted_phone_number,opening_hours,website,price_level,reviews,user_ratings_total,formatted_address,url,photos';
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=${fields}&key=${apiKey}&language=${language}`;

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== 'OK') {
            throw new Error(`Google Details API Error: ${detailsData.status}`);
        }

        const p = detailsData.result;

        // Helper for Price Level
        const priceMap = { 0: 'Free', 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

        const formattedPlace = {
            name: p.name,
            address: p.formatted_address,
            phone: p.formatted_phone_number,
            website: p.website,
            rating: p.rating,
            reviews_count: p.user_ratings_total,
            price_level: priceMap[p.price_level] || (p.price_level ? '$'.repeat(p.price_level) : null) || 'N/A',
            opening_hours: p.opening_hours?.weekday_text?.join('\n') || (p.opening_hours?.open_now ? 'Open Now' : 'Check hours'),
            google_maps_url: p.url,
            reviews: p.reviews || []
        };

        return new Response(JSON.stringify({
            found: true,
            place: formattedPlace
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
