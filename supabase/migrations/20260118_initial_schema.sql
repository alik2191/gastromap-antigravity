-- 1. Таблица профилей пользователей (связана с auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Таблица локаций (кафе, рестораны)
CREATE TABLE public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    price_level TEXT,
    primary_type TEXT,
    photos TEXT[], -- Массив URL фотографий
    tags TEXT[],
    opening_hours JSONB,
    created_by TEXT, -- Email создателя
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Таблица отзывов
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'new', -- new, approved, flagged
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Сохраненные локации (избранное)
CREATE TABLE public.saved_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    personal_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, location_id)
);

-- 5. Статусы регионов (для карты)
CREATE TABLE public.region_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    location_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Включаем Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Пример политики: любой может видеть одобренные локации
CREATE POLICY "Anyone can view approved locations" 
ON public.locations FOR SELECT 
USING (status = 'approved');

-- Пример политики: пользователь может видеть только свой профиль
CREATE POLICY "Users can only view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Автоматическое создание профиля при регистрации через триггер
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
