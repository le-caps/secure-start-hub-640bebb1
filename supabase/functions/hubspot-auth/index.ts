import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HUBSPOT_CLIENT_ID = Deno.env.get("HUBSPOT_CLIENT_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    if (!HUBSPOT_CLIENT_ID) {
      throw new Error("HUBSPOT_CLIENT_ID not configured");
    }

    // Get user from auth header to include in state
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user ID from JWT for state parameter
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.sub;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/hubspot-callback`;
    const scopes = ["crm.objects.deals.read"];

    // State contains user ID for callback verification
    const state = btoa(JSON.stringify({ userId }));

    const authUrl = new URL("https://app.hubspot.com/oauth/authorize");
    authUrl.searchParams.set("client_id", HUBSPOT_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("state", state);

    console.log("[hubspot-auth] Generated auth URL for user:", userId);

    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[hubspot-auth] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
