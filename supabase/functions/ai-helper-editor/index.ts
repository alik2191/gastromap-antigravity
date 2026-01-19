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
        const apiKey = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            console.error('API Key Error: Neither GOOGLE_API_KEY nor GEMINI_API_KEY is set');
            throw new Error('API Key not configured. Please set GOOGLE_API_KEY or GEMINI_API_KEY in Supabase Edge Function secrets.');
        }

        const { inputText, locationName, systemPrompt } = await req.json();

        if (!inputText) {
            throw new Error('Input text is required');
        }

        let promptToUse = systemPrompt;

        if (!promptToUse) {
            promptToUse = `Ты — профессиональный редактор гастрономического гида GastroMap. Твоя цель — превращать сырой текст описания места в атмосферный, "вкусный" и лаконичный текст. 

Тон (Tone of Voice):
- Дружелюбный, но экспертный.
- Избегай канцеляризмов и штампов.
- Используй красивые эпитеты, но не перебарщивай.
- Текст должен вызывать желание посетить это место.
- Сохраняй факты, не выдумывай того, чего нет в исходном тексте.

Формат вывода:
Верни только отредактированный текст, без кавычек и вступительных слов.`;
        }

        const finalPrompt = `
${promptToUse}

Task: Edit the following text for the location "${locationName || 'Unknown'}".
Input Text:
"""
${inputText}
"""
`;

        // Use Gemini 2.0 Flash (modern, fast model)
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [{ text: finalPrompt }]
            }],
            system_instruction: {
                parts: [{ text: promptToUse }]
            }
        };

        console.log(`Calling Gemini (${model}) for ai-helper-editor...`);

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

        const responseText = candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({
            result: responseText.trim(),
            agent: 'AI Helper Editor'
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
