-- Add RLS policies for hubspot_tokens table (CRITICAL - currently exposed)
ALTER TABLE public.hubspot_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hubspot tokens"
ON public.hubspot_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hubspot tokens"
ON public.hubspot_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hubspot tokens"
ON public.hubspot_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hubspot tokens"
ON public.hubspot_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing policies for user_roles table (prevent privilege escalation)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);