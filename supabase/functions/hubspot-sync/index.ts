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
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const HUBSPOT_CLIENT_ID = Deno.env.get("HUBSPOT_CLIENT_ID");
    const HUBSPOT_CLIENT_SECRET = Deno.env.get("HUBSPOT_CLIENT_SECRET");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing backend configuration");
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    console.log("[hubspot-sync] Starting sync for user:", userId);

    const { data: tokenData, error: tokenError } = await supabase
      .from("hubspot_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ connected: false, synced: 0, total: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;

    // Refresh HubSpot token if needed
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
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
        const t = await refreshResponse.text();
        console.error("[hubspot-sync] Refresh failed:", t);
        await supabase.from("hubspot_tokens").delete().eq("user_id", userId);
        return new Response(JSON.stringify({ connected: false, synced: 0, total: 0 }), {
          status: 200,
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
          scope: newTokenData.scope || null,
        })
        .eq("user_id", userId);
    }

    const dealsResponse = await fetch(
      "https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,createdate,hs_lastmodifieddate",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!dealsResponse.ok) {
      const t = await dealsResponse.text();
      console.error("[hubspot-sync] Fetch deals failed:", t);
      return new Response(JSON.stringify({ error: "Failed to fetch deals" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dealsJson = await dealsResponse.json();
    const hubspotDeals: HubSpotDeal[] = dealsJson.results || [];

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
        .upsert(dealRecord, { onConflict: "user_id,hubspot_deal_id" });

      if (!upsertError) synced++;
      else console.error("[hubspot-sync] Upsert failed:", deal.id, upsertError);
    }

    return new Response(
      JSON.stringify({ connected: true, synced, total: hubspotDeals.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[hubspot-sync] Error:", err);
    const message = err instanceof Error ? err.message : "Sync failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
