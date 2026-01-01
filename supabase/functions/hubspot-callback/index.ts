import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Get frontend URL for redirects
    const FRONTEND_URL = Deno.env.get("SITE_URL") || "https://yvzbwapgqicnuhlyteeq.lovableproject.com";

    if (error) {
      console.error("[hubspot-callback] OAuth error:", error);
      return Response.redirect(`${FRONTEND_URL}/deals?error=oauth_denied`, 302);
    }

    if (!code || !state) {
      console.error("[hubspot-callback] Missing code or state");
      return Response.redirect(`${FRONTEND_URL}/deals?error=missing_params`, 302);
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.userId;
    } catch {
      console.error("[hubspot-callback] Invalid state parameter");
      return Response.redirect(`${FRONTEND_URL}/deals?error=invalid_state`, 302);
    }

    const HUBSPOT_CLIENT_ID = Deno.env.get("HUBSPOT_CLIENT_ID");
    const HUBSPOT_CLIENT_SECRET = Deno.env.get("HUBSPOT_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!HUBSPOT_CLIENT_ID || !HUBSPOT_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[hubspot-callback] Missing environment variables");
      return Response.redirect(`${FRONTEND_URL}/deals?error=config_error`, 302);
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/hubspot-callback`;

    // Exchange code for tokens
    console.log("[hubspot-callback] Exchanging code for tokens...");
    const tokenResponse = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: HUBSPOT_CLIENT_ID,
        client_secret: HUBSPOT_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[hubspot-callback] Token exchange failed:", errorText);
      return Response.redirect(`${FRONTEND_URL}/deals?error=token_exchange_failed`, 302);
    }

    const tokenData = await tokenResponse.json();
    console.log("[hubspot-callback] Token exchange successful");

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Store tokens in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upsert the token (replace if exists)
    const { error: upsertError } = await supabase
      .from("hubspot_tokens")
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        scope: tokenData.scope || null,
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("[hubspot-callback] Failed to store tokens:", upsertError);
      return Response.redirect(`${FRONTEND_URL}/deals?error=storage_failed`, 302);
    }

    console.log("[hubspot-callback] Tokens stored successfully for user:", userId);

    // Note: we don't auto-sync here. After redirect, the UI will let the user trigger sync.

    return Response.redirect(`${FRONTEND_URL}/deals?success=connected`, 302);
  } catch (err) {
    console.error("[hubspot-callback] Unexpected error:", err);
    const FRONTEND_URL = Deno.env.get("SITE_URL") || "https://yvzbwapgqicnuhlyteeq.lovableproject.com";
    return Response.redirect(`${FRONTEND_URL}/deals?error=unexpected`, 302);
  }
});
