import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define available tools/actions
const TOOLS = {
    'get_statistics': {
        description: 'Get platform statistics (count of locations, users, reviews)',
        parameters: ['period'] // e.g. 'all_time', 'today'
    },
    'moderate_content': {
        description: 'Check locations for missing data or flagged content',
        parameters: ['type'] // e.g. 'missing_description'
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''; // Needs Service Role for admin actions
        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { command, context } = await req.json();

        if (!command) {
            throw new Error('Command is required');
        }

        // 1. Fetch Agent Prompt
        const { data: agent } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('key', 'admin_copilot')
            .single();

        // 2. Determine Action via LLM
        const prompt = `
${agent?.system_prompt || 'You are an admin assistant.'}

Available Tools:
${JSON.stringify(TOOLS, null, 2)}

User Command: "${command}"

Instructions:
- If the user asks for something that matches a tool, output a JSON object: {"tool": "tool_name", "args": { ... }}
- If no tool matches, output a JSON object: {"error": "I cannot do that yet."}
- If it's just a chat/question, output: {"reply": "..."}

Return ONLY VALID JSON.
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let action;
        try {
            // Clean markdown code blocks if any
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            action = JSON.parse(jsonStr);
        } catch (e) {
            action = { reply: text };
        }

        // 3. Execute Action
        let responseData = {};

        if (action.tool === 'get_statistics') {
            const { count: locCount } = await supabase.from('locations').select('*', { count: 'exact', head: true });
            const { count: userCount } = await supabase.from('saved_locations').select('*', { count: 'exact', head: true }); // Approximation
            responseData = { locations: locCount, saved_items: userCount, status: 'Healthy' };

            // Generate a natural language summary of the stats
            const summaryModel = genAI.getGenerativeModel({ model: "gemini-pro" });
            const summaryRes = await summaryModel.generateContent(`Summarize these stats for an admin: ${JSON.stringify(responseData)}`);
            action.reply = summaryRes.response.text();

        } else if (action.tool === 'moderate_content') {
            const type = action.args?.type || 'missing_description';
            if (type === 'missing_description') {
                const { data: locations } = await supabase
                    .from('locations')
                    .select('id, name, city')
                    .is('description', null)
                    .limit(5);
                responseData = { flagged_locations: locations };
                action.reply = `Found ${locations?.length || 0} locations missing descriptions: ${locations?.map(l => l.name).join(', ')}`;
            } else {
                action.reply = "Unknown moderation type";
            }
        }

        return new Response(JSON.stringify({
            result: action.reply || JSON.stringify(responseData),
            data: responseData,
            tool_used: action.tool
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
