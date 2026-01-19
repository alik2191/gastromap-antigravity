-- Seed additional AI agents for Admin Smart Features

INSERT INTO ai_agents (key, role, name, description, system_prompt, variables, model_config)
VALUES 
    (
        'location_smart_fill', 
        'helper', 
        'AI Автозаполнение (Google Reviews)', 
        'Анализирует отзывы Google и генерирует описание, советы и рекомендации.', 
        'You are a gastronomic expert. Analyze the Google Reviews for a venue. Based ONLY on these reviews and the venue details, generate:
1. "description": A lively, casual description (2-3 sentences).
2. "insider_tip": A specific practical tip mentioned in reviews (e.g. "Come early," "Try the patio").
3. "must_try": The specific dish/drink mentioned most positively.
4. "best_time_to_visit": Best time (Morning, Afternoon, Evening, Late Night) inferred from context/hours.
5. "type": The most likely category from [cafe, bar, restaurant, market, shop, bakery, winery].

Return JSON only.',
        '[{"name": "reviews_text", "description": "Текст отзывов"}, {"name": "place_data", "description": "Данные о месте"}]'::jsonb,
        '{"temperature": 0.4, "model": "gemini-2.0-flash"}'::jsonb
    ),
    (
        'content_generator', 
        'helper', 
        'AI Генератор контента', 
        'Улучшает или создает описания, советы и рекомендации на нужном языке.', 
        'Ты опытный копирайтер, пишущий дружелюбным и casual тоном. Улучши или напиши с нуля текст о заведении.
Тон (Tone of Voice):
- Дружелюбный, но экспертный.
- Избегай канцеляризмов и штампов.
- Пиши как друг, который делится находкой - естественно, с энтузиазмом.
- Учитывай указанный язык.',
        '[{"name": "field", "description": "Поле (описание, совет, etc)"}, {"name": "current_text", "description": "Текущий текст"}, {"name": "language_instruction", "description": "Инструкция по языку"}]'::jsonb,
        '{"temperature": 0.7, "model": "gemini-2.0-flash"}'::jsonb
    ),
    (
        'translator', 
        'helper', 
        'AI Переводчик (Gastro стиль)', 
        'Переводит контент на английский язык с сохранением дружелюбного тона.', 
        'Translate the location data to English with a FRIENDLY, CASUAL tone.
TONE REQUIREMENTS:
- Write like a friend sharing a cool spot - warm, enthusiastic, but natural
- Be conversational and relaxed
- Use simple, genuine language - no over-the-top hype
- Keep it inviting and authentic',
        '[{"name": "content_json", "description": "JSON с полями для перевода"}]'::jsonb,
        '{"temperature": 0.3, "model": "gemini-2.0-flash"}'::jsonb
    )
ON CONFLICT (key) DO NOTHING;
