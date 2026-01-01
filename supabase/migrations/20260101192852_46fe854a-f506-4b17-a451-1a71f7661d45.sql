-- Add unique constraint on hubspot_deal_id for upsert operations
ALTER TABLE public.deals ADD CONSTRAINT deals_hubspot_deal_id_unique UNIQUE (hubspot_deal_id);