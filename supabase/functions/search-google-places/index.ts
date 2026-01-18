
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
        const { query, latitude, longitude, radius } = await req.json();
        const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

        if (!apiKey) {
            throw new Error('GOOGLE_PLACES_API_KEY is not set');
        }

        // Google Places Text Search (New) or Text Search (Old)
        // Using New Text Search (https://places.googleapis.com/v1/places:searchText) is recommended but sticking to standard existing patterns 
        // often implies "Find Place" or "Text Search" v1. Let's use the standard Text Search API which is reliable.

        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

        // If location provided, bias results
        if (latitude && longitude) {
            // Bias towards location but don't restrict strictly unless requested
            // locationbias=circle:radius@lat,lng
            const r = radius || 5000; // 5km default
            url += `&location=${latitude},${longitude}&radius=${r}`;
        }

        const googleResponse = await fetch(url);
        const data = await googleResponse.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google API Error: ${data.status} - ${data.error_message || ''}`);
        }

        // Return simplified list
        const places = (data.results || []).map(p => ({
            name: p.name,
            address: p.formatted_address,
            latitude: p.geometry?.location?.lat,
            longitude: p.geometry?.location?.lng,
            rating: p.rating,
            user_ratings_total: p.user_ratings_total,
            place_id: p.place_id,
            types: p.types,
            price_level: p.price_level,
            open_now: p.opening_hours?.open_now
        }));

        return new Response(JSON.stringify({ places, raw: data }), {
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
