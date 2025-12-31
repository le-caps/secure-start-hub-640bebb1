import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CRITICAL: Extract user from Authorization header - NEVER trust client-sent userId
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("whoami: No Authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's JWT to enforce RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("whoami: Invalid or expired token", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`whoami: Authenticated user ${user.id} (${user.email})`);

    // Fetch user's profile (RLS enforced - can only see own data)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("whoami: Error fetching profile", profileError);
    }

    // Fetch user's roles (RLS enforced)
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("whoami: Error fetching roles", rolesError);
    }

    // Fetch user's deals count (RLS enforced - can only count own deals)
    const { count: dealsCount, error: dealsError } = await supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (dealsError) {
      console.error("whoami: Error counting deals", dealsError);
    }

    // SECURITY CHECK: Try to fetch another user's data (should always return empty)
    const { data: otherUsersDeals } = await supabase
      .from("deals")
      .select("id")
      .neq("user_id", user.id)
      .limit(1);

    const securityCheckPassed = !otherUsersDeals || otherUsersDeals.length === 0;

    const response = {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
      },
      profile: profile || null,
      roles: roles?.map(r => r.role) || [],
      stats: {
        deals_count: dealsCount || 0,
      },
      security: {
        rls_isolation_verified: securityCheckPassed,
        message: securityCheckPassed 
          ? "✅ RLS isolation confirmed: Cannot access other users' data" 
          : "⚠️ Security warning: RLS may not be properly configured",
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`whoami: Response for user ${user.id}`, JSON.stringify(response.security));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("whoami: Unexpected error", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
