-- Add missing columns to profiles table to support User Profile page
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::jsonb;

-- Grant access to these new columns (if policies restricted them, though standard update policy usually covers row)
-- ensuring RLS allows update is already covered by existing policies
