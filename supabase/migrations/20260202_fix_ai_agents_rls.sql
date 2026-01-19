-- Fix RLS policies to use profiles instead of auth.users
-- This resolves "permission denied for table users" errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can do everything on ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Authenticated users can read active agents" ON ai_agents;

-- Enable RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Create new policy for admins using profiles table
CREATE POLICY "Admins can do everything on ai_agents"
    ON ai_agents
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Create policy for authenticated users to read active agents
CREATE POLICY "Authenticated users can read active agents"
    ON ai_agents
    FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);
