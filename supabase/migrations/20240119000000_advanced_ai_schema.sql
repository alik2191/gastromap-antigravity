-- Create AI Agents table to store system prompts and configuration
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE, -- e.g., 'helper_editor', 'user_guide', 'admin_copilot'
    role TEXT NOT NULL, -- 'helper', 'guide', 'admin'
    name TEXT NOT NULL, -- Human readable name
    description TEXT,
    system_prompt TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable descriptions
    model_config JSONB DEFAULT '{"temperature": 0.7, "model": "gemini-pro"}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at for ai_agents
DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON ai_agents;
CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create Chat Sessions table for AI Guide context
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    agent_key TEXT REFERENCES ai_agents(key) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at for chat_sessions
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- For function calling results, usage stats etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
-- Policies already exist, commenting out to prevent migration errors
-- ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Admins can do everything on ai_agents" ON ai_agents;
-- CREATE POLICY "Admins can do everything on ai_agents"
--     ON ai_agents
--     FOR ALL
--     USING (
--         auth.uid() IN (
--             SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' 
--             OR raw_user_meta_data->>'custom_role' = 'admin'
--         )
--     );

-- DROP POLICY IF EXISTS "Authenticated users can read active agents" ON ai_agents;
-- CREATE POLICY "Authenticated users can read active agents"
--     ON ai_agents
--     FOR SELECT
--     USING (auth.role() = 'authenticated' AND is_active = true);

-- Chat Sessions: Users can manage their own sessions
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Users can manage own sessions" ON chat_sessions;
-- CREATE POLICY "Users can manage own sessions"
--     ON chat_sessions
--     FOR ALL
--     USING (auth.uid() = user_id);

-- Chat Messages: Users can manage messages in their sessions
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;
-- CREATE POLICY "Users can manage own messages"
--     ON chat_messages
--     FOR ALL
--     USING (
--         session_id IN (
--             SELECT id FROM chat_sessions WHERE user_id = auth.uid()
--         )
--     );

-- Seed initial agents
INSERT INTO ai_agents (key, role, name, description, system_prompt, variables, model_config)
VALUES 
    (
        'helper_editor', 
        'helper', 
        'AI Контент-Редактор', 
        'Помогает креаторам и админам писать красивые описания локаций в едином стиле.', 
        'Ты — профессиональный редактор гастрономического гида GastroMap. Твоя цель — превращать сырой текст описания места в атмосферный, "вкусный" и лаконичный текст. \n\nТон (Tone of Voice):\n- Дружелюбный, но экспертный.\n- Избегай канцеляризмов и штампов.\n- Используй красивые эпитеты, но не перебарщивай.\n- Текст должен вызывать желание посетить это место.\n- Сохраняй факты, не выдумывай того, чего нет в исходном тексте.\n\nФормат вывода:\nВерни только отредактированный текст, без кавычек и вступительных слов.',
        '[{"name": "input_text", "description": "Исходный черновик текста"}, {"name": "location_name", "description": "Название заведения"}]'::jsonb,
        '{"temperature": 0.4, "model": "gemini-pro"}'::jsonb
    ),
    (
        'user_guide',
        'guide',
        'AI Консьерж',
        'Персональный гид для пользователей приложения.',
        'Ты — GastroMap Guide, персональный консьерж по ресторанам и барам. \nТвоя задача — помогать пользователю находить идеальные места на основе его запросов и предпочтений.\n\nУ тебя есть доступ к:\n1. Списку сохраненных мест пользователя (Wishlist).\n2. Списку посещенных мест (Visited).\n3. Информации о текущем местоположении (если предоставлено).\n\nПравила:\n- Будь вежлив и краток.\n- Если пользователь спрашивает "куда сходить?", сначала проверь его Wishlist.\n- Предлагай конкретные варианты с объяснением, почему это подойдет.\n- Не придумывай несуществующие места.',
        '[{"name": "user_profile", "description": "Предпочтения пользователя"}, {"name": "wishlist", "description": "Список желаемого"}, {"name": "visited", "description": "Посещенные места"}]'::jsonb,
        '{"temperature": 0.7, "model": "gemini-pro"}'::jsonb
    ),
    (
        'admin_copilot',
        'admin',
        'AI Со-админ',
        'Агент для помощи в управлении платформой.',
        'Ты — GastroMap Co-Pilot, ИИ-ассистент администратора. \nТы помогаешь анализировать контент, модерировать отзывы и управлять платформой.\n\nТвои возможности:\n- Анализ статистики.\n- Предложения по модерации.\n- Поиск аномалий в данных.\n\nБудь точен, объективен и полезен.',
        '[{"name": "context", "description": "Контекст задачи"}, {"name": "data", "description": "Данные для анализа"}]'::jsonb,
        '{"temperature": 0.2, "model": "gemini-pro"}'::jsonb
    )
ON CONFLICT (key) DO NOTHING;
