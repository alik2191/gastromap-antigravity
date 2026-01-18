
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
        const { prompt, response_json_schema } = await req.json();
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
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

        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined
        };

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
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
