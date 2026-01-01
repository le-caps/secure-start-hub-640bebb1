import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    createdate?: string;
    hs_lastmodifieddate?: string;
    hubspot_owner_id?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const HUBSPOT_CLIENT_ID = Deno.env.get("HUBSPOT_CLIENT_ID");
    const HUBSPOT_CLIENT_SECRET = Deno.env.get("HUBSPOT_CLIENT_SECRET");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user ID from request body or auth header
    let userId: string;
    const body = await req.json().catch(() => ({}));
    
    if (body.userId) {
      userId = body.userId;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub;
    }

    console.log("[hubspot-sync] Starting sync for user:", userId);

    // Get user's HubSpot tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from("hubspot_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      console.log("[hubspot-sync] No HubSpot connection found");
      return new Response(JSON.stringify({ error: "HubSpot not connected", connected: false }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.log("[hubspot-sync] Token expired, refreshing...");
      
      if (!HUBSPOT_CLIENT_ID || !HUBSPOT_CLIENT_SECRET) {
        throw new Error("Missing HubSpot credentials for token refresh");
      }

      const refreshResponse = await fetch("https://api.hubapi.com/oauth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: HUBSPOT_CLIENT_ID,
          client_secret: HUBSPOT_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token,
        }),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error("[hubspot-sync] Token refresh failed:", errorText);
        
        // Token is invalid, delete it
        await supabase.from("hubspot_tokens").delete().eq("user_id", userId);
        
        return new Response(JSON.stringify({ error: "HubSpot token expired", connected: false }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newTokenData = await refreshResponse.json();
      accessToken = newTokenData.access_token;
      const newExpiresAt = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();

      await supabase
        .from("hubspot_tokens")
        .update({
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
          expires_at: newExpiresAt,
        })
        .eq("user_id", userId);

      console.log("[hubspot-sync] Token refreshed successfully");
    }

    // Fetch deals from HubSpot
    console.log("[hubspot-sync] Fetching deals from HubSpot...");
    const dealsResponse = await fetch(
      "https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,createdate,hs_lastmodifieddate",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!dealsResponse.ok) {
      const errorText = await dealsResponse.text();
      console.error("[hubspot-sync] Failed to fetch deals:", errorText);
      throw new Error("Failed to fetch deals from HubSpot");
    }

    const dealsData = await dealsResponse.json();
    const hubspotDeals: HubSpotDeal[] = dealsData.results || [];
    console.log("[hubspot-sync] Fetched", hubspotDeals.length, "deals");

    // Sync deals to database
    let synced = 0;
    for (const deal of hubspotDeals) {
      const dealRecord = {
        user_id: userId,
        hubspot_deal_id: deal.id,
        name: deal.properties.dealname || `Deal ${deal.id}`,
        amount: deal.properties.amount ? parseFloat(deal.properties.amount) : null,
        stage: deal.properties.dealstage || "unknown",
        metadata: {
          closedate: deal.properties.closedate,
          createdate: deal.properties.createdate,
          hs_lastmodifieddate: deal.properties.hs_lastmodifieddate,
        },
      };

      const { error: upsertError } = await supabase
        .from("deals")
        .upsert(dealRecord, { 
          onConflict: "user_id,hubspot_deal_id",
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error("[hubspot-sync] Failed to upsert deal:", deal.id, upsertError);
      } else {
        synced++;
      }
    }

    console.log("[hubspot-sync] Synced", synced, "deals");

    return new Response(JSON.stringify({ 
      success: true, 
      synced,
      total: hubspotDeals.length,
      connected: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[hubspot-sync] Error:", err);
    const message = err instanceof Error ? err.message : "Sync failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
