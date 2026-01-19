
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt, system_instruction, response_json_schema } = await req.json();
        const apiKey = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');


        if (!apiKey) {
            console.error('API Key Error: Neither GOOGLE_API_KEY nor GEMINI_API_KEY is set');
            throw new Error('API Key not configured. Please set GOOGLE_API_KEY or GEMINI_API_KEY in Supabase Edge Function secrets.');
        }


        // Use Gemini Pro (Stable Fallback)
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        let generationConfig = {};

        // Prepare JSON mode if schema is provided
        if (response_json_schema) {
            generationConfig = {
                response_mime_type: "application/json",
                response_schema: response_json_schema
            };
        }

        const payload: any = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined
        };

        if (system_instruction) {
            payload.system_instruction = {
                parts: [{ text: system_instruction }]
            };
        }

        console.log(`Calling Gemini (${model})...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Extract text from the response
        const candidates = data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No candidates returned from Gemini');
        }

        const textOutput = candidates[0].content.parts[0].text;

        let finalResult = textOutput;

        // specific handling if JSON was requested but maybe came back as string
        if (response_json_schema) {
            try {
                if (typeof textOutput === 'string') {
                    finalResult = JSON.parse(textOutput);
                }
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                // Fallback or throw? Ideally throw or ensure valid JSON
            }
        }

        return new Response(JSON.stringify(finalResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });


    } catch (error) {
        console.error('Edge Function Error:', error);

        // Log error to system_logs table
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
            const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.0");
            const supabase = createClient(supabaseUrl, supabaseKey);

            await supabase.from('system_logs').insert({
                level: 'ERROR',
                component: 'invoke-llm',
                message: error.message,
                metadata: {
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return new Response(JSON.stringify({
            error: error.message,
            type: 'llm_error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
