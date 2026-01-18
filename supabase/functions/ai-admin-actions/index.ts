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
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { command, context, systemPrompt: requestSystemPrompt } = await req.json();

        // 1. Fetch Agent Prompt
        let systemPrompt = requestSystemPrompt;
        if (!systemPrompt) {
            const { data: agent } = await supabase
                .from('ai_agents')
                .select('system_prompt')
                .eq('key', 'admin_copilot')
                .single();
            systemPrompt = agent?.system_prompt || 'You are an admin assistant.';
        }

        // 2. Build Prompt to decide tool use (Simulated for this MVP)
        let toolOutput = '';
        let isToolCall = false;

        if (command.includes('stats') || command.includes('статистика')) {
            isToolCall = true;
            // Mock Stats Tool
            const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true });
            const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            toolOutput = `Statistics Tool Output: Locations: ${count}, Users: ${users}`;
        }

        if (command.includes('moderate') || command.includes('модерация')) {
            isToolCall = true;
            // Mock Moderation Tool
            toolOutput = `Moderation Tool: No high-priority flags found currently.`;
        }

        const finalPrompt = `
${systemPrompt}

Current Context: ${JSON.stringify(context || {})}
Admin Command: "${command}"

${isToolCall ? `Tool Execution Result: ${toolOutput}\nAnalyze this result and summarize for the admin.` : ''}

If no tool result is provided, just answer the admin question directly or explain what you can do (stats, moderation).
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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
