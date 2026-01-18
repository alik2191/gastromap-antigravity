import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { message, sessionId, userId, userLocation, systemPrompt: requestSystemPrompt } = await req.json();

        if (!message) {
            throw new Error('Message is required');
        }

        // 1. Get User Context (Wishlist + Visited) - Logic continues below...
        // ... (lines 28-80 remain effectively same logic wise, but I am inserting the prompt logic here to be safe or just before step 5)

        // I will just do the destructuring change here, and then insert the prompt logic further down.
        // Actually, to avoid "systemPrompt used before defined" I should ensure it's defined before usage.

        // Let's just do the whole block replacement to be safe.


        if (!message) {
            throw new Error('Message is required');
        }

        // 1. Get User Context (Wishlist + Visited)
        // Fetches saved locations using user ID or email context if available
        let savedLocations = [];
        if (userId) {
            const userResp = await supabase.auth.admin.getUserById(userId);
            const email = userResp.data.user?.email;
            if (email) {
                const { data } = await supabase
                    .from('saved_locations')
                    .select(`
                        list_type,
                        personal_note,
                        locations ( id, name, city, type, special_labels )
                    `)
                    .eq('user_email', email);
                savedLocations = data || [];
            }
        }

        const wishlist = savedLocations?.filter(s => s.list_type === 'wishlist').map(s => s.locations?.name).join(', ') || 'Empty';
        const visited = savedLocations?.filter(s => s.list_type === 'visited').map(s => s.locations?.name).join(', ') || 'Empty';

        // 2. Fetch Chat History (Active Session)
        let useSessionId = sessionId;
        if (!useSessionId && userId) {
            // Find or create session
            const { data: session } = await supabase
                .from('chat_sessions')
                .select('id')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (session) {
                useSessionId = session.id;
            } else {
                const { data: newSession } = await supabase
                    .from('chat_sessions')
                    .insert({ user_id: userId, title: 'New Chat', agent_key: 'user_guide' })
                    .select('id')
                    .single();
                useSessionId = newSession?.id;
            }
        }

        // 3. Save User Message
        if (useSessionId) {
            await supabase.from('chat_messages').insert({
                session_id: useSessionId,
                role: 'user',
                content: message
            });
        }

        // 4. Determine System Prompt
        let systemPrompt = requestSystemPrompt;
        if (!systemPrompt) {
            const { data: agent } = await supabase
                .from('ai_agents')
                .select('system_prompt')
                .eq('key', 'user_guide')
                .single();
            systemPrompt = agent?.system_prompt || 'You are a helpful assistant.';
        }

        // 4b. Fetch Relevant Locations for Context
        // In a real scaled app, this should use vector search. For now, we fetch top 30 relevant locations.
        let locationsQuery = supabase
            .from('locations')
            .select('id, name, city, type, special_labels, description, average_rating, opening_hours, best_time_to_visit')
            .limit(30);

        // If user location is known, we could order by distance (requires PostGIS or huge memory calc).
        // For simplicity, we order by rating desc to show best places first.
        locationsQuery = locationsQuery.order('average_rating', { ascending: false });

        const { data: locationsData } = await locationsQuery;

        const locationsContext = locationsData ? JSON.stringify(locationsData.map(l => ({
            id: l.id,
            name: l.name,
            city: l.city,
            type: l.type,
            rating: l.average_rating,
            labels: l.special_labels,
            best_time: l.best_time_to_visit
        }))) : '[]';

        // 5. Build Contextual Prompt
        // Limited memory for standard calls - last 5 messages could be fetched here in a real production env
        const finalPrompt = `
${systemPrompt}

User Context:
- Wishlist: ${wishlist}
- Visited: ${visited}
- Current Location: ${userLocation ? JSON.stringify(userLocation) : 'Unknown'}

Available Database Locations (Recommend from here if relevant):
${locationsContext}

User Message: "${message}"
`;


        // 6. Call LLM
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(finalPrompt);
        const aiResponse = result.response.text();

        // 7. Save AI Response
        if (useSessionId) {
            await supabase.from('chat_messages').insert({
                session_id: useSessionId,
                role: 'assistant',
                content: aiResponse
            });
        }

        return new Response(JSON.stringify({
            reply: aiResponse,
            sessionId: useSessionId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
