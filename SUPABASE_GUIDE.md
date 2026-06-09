# EcoLens Supabase Setup Guide & Production Specifications

To migrate this full-stack application to a dedicated Supabase cloud solution, run the following SQL scripts in your Supabase SQL Editor and configure your connection client.

---

## 1. Database Schema SQL Scripts

Paste and run the following statements in the **Supabase SQL Editor**:

```sql
-- Create custom profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT NOT NULL,
  daily_limit NUMERIC DEFAULT 15.0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create activities logging table
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT CHECK (category IN ('Transport', 'Food', 'Energy', 'Purchases')) NOT NULL,
  emission_value NUMERIC NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create challenges tracking table
CREATE TABLE public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'declined')) DEFAULT 'pending' NOT NULL,
  tip_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 2. Row Level Security (RLS) & Policies

Enable security protections on your tables so users can only view or adjust their own data rows:

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Row Security Queries
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow update for owners" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Automate user creation profile insert" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Activities Security Queries
CREATE POLICY "Users can fully manage their activities" 
ON public.activities FOR ALL USING (auth.uid() = user_id);

-- 3. Challenges Security Queries
CREATE POLICY "Users can fully search and alter their challenges" 
ON public.challenges FOR ALL USING (auth.uid() = user_id);
```

### Auto-Profile Handler via Database Trigger
To automatically seed a custom profile whenever a new user registers through Supabase auth:

```sql
-- Setup auto-triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, daily_limit)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'Eco Champion'),
    15.0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 3. Connecting your Front-End to Supabase Client

For client side integration, install the client sdk:
```bash
npm install @supabase/supabase-js
```

Initialize your connection file `src/supabaseClient.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
In App.tsx, you can swap out the generic `fetch('/api/*')` with elegant Supabase ORM calls:
```typescript
// Example Load Activities
const { data, error } = await supabase
  .from('activities')
  .select('*')
  .order('created_at', { ascending: false });
```
This is fully supported, secure, and production ready!
