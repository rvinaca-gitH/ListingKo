-- Store short-lived OAuth state values so callbacks can be bound to the initiating user.
CREATE TABLE public.oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('shopee', 'lazada', 'tiktok', 'facebook')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_oauth_states_expires_at ON public.oauth_states(expires_at);
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY oauth_states_service_role_only
ON public.oauth_states
USING (false)
WITH CHECK (false);
