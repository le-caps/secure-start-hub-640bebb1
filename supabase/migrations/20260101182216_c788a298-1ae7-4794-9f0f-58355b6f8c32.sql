-- Add unique constraint on deals for hubspot sync upsert
CREATE UNIQUE INDEX IF NOT EXISTS deals_user_hubspot_deal_idx 
ON public.deals (user_id, hubspot_deal_id) 
WHERE hubspot_deal_id IS NOT NULL;