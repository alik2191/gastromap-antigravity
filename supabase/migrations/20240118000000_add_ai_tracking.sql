-- Add tracking columns for AI updates
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_ai_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_update_log JSONB,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS social_links TEXT[],
ADD COLUMN IF NOT EXISTS must_try TEXT,
ADD COLUMN IF NOT EXISTS insider_tip TEXT,
ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT[];

-- Add functionality to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
