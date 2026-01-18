-- Add missing tables identified in audit

-- 1. Subscriptions Table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT,
    status TEXT DEFAULT 'active', -- active, expired, cancelled
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Feedback Table
CREATE TABLE public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    message TEXT,
    type TEXT, -- bug, feature, contact
    status TEXT DEFAULT 'new', -- new, read, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Moderation Rounds Table (For AI/Community moderation)
CREATE TABLE public.moderation_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending_creator_answers', -- pending_creator_answers, pending_admin_review, approved, rejected
    yes_count INTEGER DEFAULT 0,
    no_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Creator Answers Table (Gamification/Moderation)
CREATE TABLE public.creator_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_question_id UUID REFERENCES public.moderation_rounds(id) ON DELETE CASCADE,
    creator_email TEXT, -- or user_id
    answer_type TEXT, -- yes, no, custom
    custom_answer TEXT,
    proposed_tags_add TEXT[],
    proposed_tags_remove TEXT[],
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Location Branches (Referenced in adapter, less critical but good to have)
CREATE TABLE public.location_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    name TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_branches ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Open for now to ensure functionality, verify later)
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Moderation is generally public/creator access
CREATE POLICY "Anyone can view moderation rounds" ON public.moderation_rounds FOR SELECT USING (true);
CREATE POLICY "Creators can insert answers" ON public.creator_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can view answers" ON public.creator_answers FOR SELECT USING (true);
