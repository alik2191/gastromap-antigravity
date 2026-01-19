import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

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

        const requestBody = await req.json();
        console.log('[ai-guide-chat] Received request:', JSON.stringify(requestBody, null, 2));

        const { message, sessionId, userId, userLocation, systemPrompt: requestSystemPrompt } = requestBody;

        // Store userId for error logging (to avoid scope issues in catch block)
        const requestUserId = userId;

        if (!message) {
            console.error('[ai-guide-chat] Missing message in request');
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
        let wishlist = 'Empty';
        let visited = 'Empty';

        try {
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

                    const savedLocations = data || [];
                    wishlist = savedLocations.filter(s => s.list_type === 'wishlist').map(s => s.locations?.name).join(', ') || 'Empty';
                    visited = savedLocations.filter(s => s.list_type === 'visited').map(s => s.locations?.name).join(', ') || 'Empty';
                }
            }
        } catch (ctxError) {
            console.error('Error fetching user context:', ctxError);
            // Continue without context
        }

        // 2. Fetch/Create Chat Session (Non-blocking)
        let useSessionId = sessionId;
        try {
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
                    // Try to create new session
                    // Note: If agent_key FK fails (e.g. agent not found), this insert might fail.
                    // We try-catch this.
                    const { data: newSession, error: createError } = await supabase
                        .from('chat_sessions')
                        .insert({ user_id: userId, title: 'New Chat', agent_key: 'user_guide' })
                        .select('id')
                        .single();

                    if (!createError && newSession) {
                        useSessionId = newSession.id;
                    } else {
                        console.error('Failed to create session:', createError);
                    }
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
        } catch (sessionError) {
            console.error('Session management error:', sessionError);
            // Continue without persistent session
        }

        // 4. System Prompt
        let systemPrompt = requestSystemPrompt;
        if (!systemPrompt) {
            // Try fetch from DB
            const { data: agent } = await supabase
                .from('ai_agents')
                .select('system_prompt')
                .eq('key', 'user_guide')
                .single();

            if (agent?.system_prompt) {
                systemPrompt = agent.system_prompt;
            } else {
                // Fallback
                systemPrompt = `Ты — GastroMap Guide, персональный консьерж по ресторанам и барам. 
Твоя задача — помогать пользователю находить идеальные места на основе его запросов и предпочтений.

У тебя есть доступ к:
1. Списку сохраненных мест пользователя (Wishlist).
2. Списку посещенных мест (Visited).
3. Информации о текущем местоположении (если предоставлено).

Правила:
- Будь вежлив и краток.
- Если пользователь спрашивает "куда сходить?", сначала проверь его Wishlist.
- Предлагай конкретные варианты с объяснением, почему это подойдет.
- Не придумывай несуществующие места.`;
            }
        }

        // 4b. Fetch Relevant Locations (Context)
        let locationsContext = '[]';
        try {
            let locationsQuery = supabase
                .from('locations')
                .select('id, name, city, type, special_labels, description, average_rating, opening_hours, best_time_to_visit')
                .limit(30)
                .order('average_rating', { ascending: false });

            const { data: locationsData } = await locationsQuery;

            if (locationsData) {
                locationsContext = JSON.stringify(locationsData.map(l => ({
                    id: l.id,
                    name: l.name,
                    city: l.city,
                    type: l.type,
                    rating: l.average_rating,
                    labels: l.special_labels,
                    best_time: l.best_time_to_visit
                })));
            }
        } catch (locError) {
            console.error('Error fetching locations context:', locError);
        }

        // 5. Build Final Prompt
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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(finalPrompt);
        const aiResponse = result.response.text();

        // 7. Save AI Response (Non-blocking)
        try {
            if (useSessionId) {
                await supabase.from('chat_messages').insert({
                    session_id: useSessionId,
                    role: 'assistant',
                    content: aiResponse
                });
            }
        } catch (saveError) {
            console.error('Error saving AI response:', saveError);
        }

        return new Response(JSON.stringify({
            reply: aiResponse,
            sessionId: useSessionId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });


    } catch (error) {
        console.error('Edge Function Error:', error);

        // Log error to system_logs table
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
            const supabase = createClient(supabaseUrl, supabaseKey);

            await supabase.from('system_logs').insert({
                level: 'ERROR',
                component: 'ai-guide-chat',
                message: error.message,
                metadata: {
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                    userId: requestUserId || null
                }
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return new Response(JSON.stringify({
            error: error.message,
            type: 'ai_guide_error'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
