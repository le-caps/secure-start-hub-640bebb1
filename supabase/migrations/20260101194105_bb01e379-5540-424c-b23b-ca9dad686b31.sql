-- Fix HubSpot deals upsert conflict target
-- The hubspot-sync function upserts with onConflict: "user_id,hubspot_deal_id"
-- so the database must have a matching unique constraint.

ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_hubspot_deal_id_unique;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_user_id_hubspot_deal_id_unique UNIQUE (user_id, hubspot_deal_id);
