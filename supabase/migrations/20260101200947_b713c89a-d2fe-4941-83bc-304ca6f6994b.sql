-- Ensure HubSpot sync upserts work by adding a unique constraint
-- (required for ON CONFLICT(user_id, hubspot_deal_id))
ALTER TABLE public.deals
ADD CONSTRAINT deals_user_id_hubspot_deal_id_key UNIQUE (user_id, hubspot_deal_id);

-- Helpful index for filtering deals by user
CREATE INDEX IF NOT EXISTS idx_deals_user_id_created_at
ON public.deals (user_id, created_at DESC);
