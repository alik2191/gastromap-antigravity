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
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
        const apiKey = Deno.env.get('GOOGLE_API_KEY'); // Gemini Key
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { inputText, locationName, systemPrompt } = await req.json();

        if (!inputText) {
            throw new Error('Input text is required');
        }

        if (!apiKey) {
            throw new Error('Google API Key not found');
        }

        let promptToUse = systemPrompt;
        let agentName = 'Custom Agent';

        if (!promptToUse) {
            // Fetch Agent Configuration if no override provided
            const { data: agent, error: agentError } = await supabase
                .from('ai_agents')
                .select('system_prompt, name')
                .eq('key', 'helper_editor')
                .single();

            if (agentError || !agent) {
                console.error('Agent fetch error:', agentError);
                throw new Error('AI Agent configuration not found');
            }
            promptToUse = agent.system_prompt;
            agentName = agent.name;
        }

        const finalPrompt = `
${promptToUse}

Task: Edit the following text for the location "${locationName || 'Unknown'}".
Input Text:
"""
${inputText}
"""
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(finalPrompt);
        const responseText = result.response.text();

        return new Response(JSON.stringify({
            result: responseText.trim(),
            agent: agentName
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
