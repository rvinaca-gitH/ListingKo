-- Development RLS Bypass
-- Allows development to work without proper auth setup

-- For development, create a user that matches our hardcoded dev user ID
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
VALUES ('a1111111-1111-1111-1111-111111111111', 'dev@example.com', 'Development User', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add a development-specific RLS policy that allows writes without auth
-- This policy allows inserts where user_id is the dev user ID (for development only)
CREATE POLICY "Development: Allow dev user writes"
ON public.products FOR INSERT
WITH CHECK (user_id = 'a1111111-1111-1111-1111-111111111111');

-- Similarly for other tables
CREATE POLICY "Development: Allow dev user writes on product_masters"
ON public.product_masters FOR INSERT
WITH CHECK (user_id = 'a1111111-1111-1111-1111-111111111111');

CREATE POLICY "Development: Allow dev user writes on listings"
ON public.listings FOR INSERT
WITH CHECK (user_id = 'a1111111-1111-1111-1111-111111111111');

CREATE POLICY "Development: Allow dev user writes on images"
ON public.images FOR INSERT
WITH CHECK (user_id = 'a1111111-1111-1111-1111-111111111111');
