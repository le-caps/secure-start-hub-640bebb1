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
    notes_last_updated?: string;
    hs_next_step?: string;
    description?: string;
    hs_deal_stage_probability?: string;
    days_to_close?: string;
    hs_time_in_current_dealstage?: string;
  };
  associations?: {
    companies?: { results: Array<{ id: string }> };
    contacts?: { results: Array<{ id: string }> };
  };
}

interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
  };
}

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
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

    // Fetch deals with associations
    const dealProperties = [
      "dealname",
      "amount",
      "dealstage",
      "closedate",
      "createdate",
      "hs_lastmodifieddate",
      "notes_last_updated",
      "hs_next_step",
      "description",
      "hs_deal_stage_probability",
      "days_to_close",
      "hs_time_in_current_dealstage",
    ].join(",");

    const dealsUrl = `https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=${dealProperties}&associations=companies,contacts`;
    
    console.log("[hubspot-sync] Fetching deals from:", dealsUrl);
    
    const dealsResponse = await fetch(dealsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

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

    console.log("[hubspot-sync] Found", hubspotDeals.length, "deals");

    // Collect all company and contact IDs
    const companyIds = new Set<string>();
    const contactIds = new Set<string>();

    for (const deal of hubspotDeals) {
      const companies = deal.associations?.companies?.results || [];
      const contacts = deal.associations?.contacts?.results || [];
      
      companies.forEach((c) => companyIds.add(c.id));
      contacts.forEach((c) => contactIds.add(c.id));
    }

    // Fetch companies in batch (use individual fetches as fallback if batch fails)
    const companiesMap = new Map<string, HubSpotCompany>();
    if (companyIds.size > 0) {
      const companyIdsList = Array.from(companyIds).slice(0, 100);
      console.log("[hubspot-sync] Fetching", companyIdsList.length, "companies:", companyIdsList);
      
      // Try batch read first
      try {
        const companiesUrl = `https://api.hubapi.com/crm/v3/objects/companies/batch/read`;
        const companiesResponse = await fetch(companiesUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: ["name"],
            inputs: companyIdsList.map((id) => ({ id })),
          }),
        });

        if (companiesResponse.ok) {
          const companiesJson = await companiesResponse.json();
          console.log("[hubspot-sync] Companies batch response:", JSON.stringify(companiesJson).slice(0, 500));
          for (const company of companiesJson.results || []) {
            companiesMap.set(company.id, company);
          }
          console.log("[hubspot-sync] Fetched", companiesMap.size, "companies via batch");
        } else {
          const errText = await companiesResponse.text();
          console.error("[hubspot-sync] Companies batch failed:", companiesResponse.status, errText);
          
          // Fallback: fetch individually
          for (const companyId of companyIdsList) {
            try {
              const singleUrl = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=name`;
              const singleRes = await fetch(singleUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (singleRes.ok) {
                const company = await singleRes.json();
                companiesMap.set(company.id, company);
              } else {
                const t = await singleRes.text();
                console.error("[hubspot-sync] Company fetch failed:", companyId, singleRes.status, t);
              }
            } catch (e) {
              console.error("[hubspot-sync] Error fetching company", companyId, e);
            }
          }
          console.log("[hubspot-sync] Fetched", companiesMap.size, "companies via individual calls");
        }
      } catch (e) {
        console.error("[hubspot-sync] Error fetching companies:", e);
      }
    }

    // Fetch contacts in batch (use individual fetches as fallback if batch fails)
    const contactsMap = new Map<string, HubSpotContact>();
    if (contactIds.size > 0) {
      const contactIdsList = Array.from(contactIds).slice(0, 100);
      console.log("[hubspot-sync] Fetching", contactIdsList.length, "contacts:", contactIdsList);
      
      try {
        const contactsUrl = `https://api.hubapi.com/crm/v3/objects/contacts/batch/read`;
        const contactsResponse = await fetch(contactsUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: ["firstname", "lastname"],
            inputs: contactIdsList.map((id) => ({ id })),
          }),
        });

        if (contactsResponse.ok) {
          const contactsJson = await contactsResponse.json();
          console.log("[hubspot-sync] Contacts batch response:", JSON.stringify(contactsJson).slice(0, 500));
          for (const contact of contactsJson.results || []) {
            contactsMap.set(contact.id, contact);
          }
          console.log("[hubspot-sync] Fetched", contactsMap.size, "contacts via batch");
        } else {
          const errText = await contactsResponse.text();
          console.error("[hubspot-sync] Contacts batch failed:", contactsResponse.status, errText);
          
          // Fallback: fetch individually
          for (const contactId of contactIdsList) {
            try {
              const singleUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname`;
              const singleRes = await fetch(singleUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (singleRes.ok) {
                const contact = await singleRes.json();
                contactsMap.set(contact.id, contact);
              } else {
                const t = await singleRes.text();
                console.error("[hubspot-sync] Contact fetch failed:", contactId, singleRes.status, t);
              }
            } catch (e) {
              console.error("[hubspot-sync] Error fetching contact", contactId, e);
            }
          }
          console.log("[hubspot-sync] Fetched", contactsMap.size, "contacts via individual calls");
        }
      } catch (e) {
        console.error("[hubspot-sync] Error fetching contacts:", e);
      }
    }

    // Upsert deals
    let synced = 0;
    for (const deal of hubspotDeals) {
      const companyIdsForDeal = (deal.associations?.companies?.results || [])
        .map((r) => r.id)
        .filter(Boolean);
      const contactIdsForDeal = (deal.associations?.contacts?.results || [])
        .map((r) => r.id)
        .filter(Boolean);

      let companyId = companyIdsForDeal[0];
      let contactId = contactIdsForDeal[0];

      // If multiple associations exist, try to pick the one labeled "Primary"
      if (companyIdsForDeal.length > 1) {
        companyId = (await getPrimaryAssociationId(accessToken, deal.id, "companies")) ?? companyId;
      }
      if (contactIdsForDeal.length > 1) {
        contactId = (await getPrimaryAssociationId(accessToken, deal.id, "contacts")) ?? contactId;
      }

      const company = companyId ? companiesMap.get(companyId) : null;
      const contact = contactId ? contactsMap.get(contactId) : null;
      // Calculate days in stage
      // HubSpot's hs_time_in_current_dealstage is in milliseconds
      const timeInStageMs = deal.properties.hs_time_in_current_dealstage 
        ? parseInt(deal.properties.hs_time_in_current_dealstage) 
        : 0;
      let daysInStage = Math.floor(timeInStageMs / (1000 * 60 * 60 * 24));
      
      // Fallback: if daysInStage is 0 and we have createdate, calculate from createdate
      // This happens when the deal has been in the same stage since creation
      if (daysInStage === 0 && deal.properties.createdate) {
        const createDate = new Date(deal.properties.createdate);
        daysInStage = Math.floor((Date.now() - createDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Calculate days inactive (since last modified)
      const lastModified = deal.properties.hs_lastmodifieddate 
        ? new Date(deal.properties.hs_lastmodifieddate)
        : null;
      const daysInactive = lastModified 
        ? Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const contactName = contact?.properties
        ? [contact.properties.firstname, contact.properties.lastname]
            .filter(Boolean)
            .join(" ") || null
        : null;
      
      console.log(`[hubspot-sync] Deal ${deal.id}: company=${company?.properties?.name}, contact=${contactName}, daysInStage=${daysInStage}, daysInactive=${daysInactive}`);

      const dealRecord = {
        user_id: userId,
        hubspot_deal_id: deal.id,
        name: deal.properties.dealname || `Deal ${deal.id}`,
        amount: deal.properties.amount ? parseFloat(deal.properties.amount) : null,
        stage: deal.properties.dealstage || "unknown",
        metadata: {
          // Company info
          company: company?.properties?.name || null,
          companyDomain: company?.properties?.domain || null,
          companyIndustry: company?.properties?.industry || null,
          // Contact info
          contact: contactName,
          contactEmail: contact?.properties?.email || null,
          contactPhone: contact?.properties?.phone || null,
          // Deal dates
          closedate: deal.properties.closedate || null,
          createdate: deal.properties.createdate || null,
          lastModifiedDate: deal.properties.hs_lastmodifieddate || null,
          // Deal progress
          nextStep: deal.properties.hs_next_step || null,
          description: deal.properties.description || null,
          probability: deal.properties.hs_deal_stage_probability 
            ? parseFloat(deal.properties.hs_deal_stage_probability)
            : null,
          // Calculated fields
          daysInStage,
          daysInactive,
          daysToClose: deal.properties.days_to_close 
            ? parseInt(deal.properties.days_to_close) 
            : null,
          // Risk score calculated based on inactivity and stage
          riskScore: calculateRiskScore(daysInactive, daysInStage, deal.properties.dealstage),
        },
      };

      const { error: upsertError } = await supabase
        .from("deals")
        .upsert(dealRecord, { onConflict: "user_id,hubspot_deal_id" });

      if (!upsertError) synced++;
      else console.error("[hubspot-sync] Upsert failed:", deal.id, upsertError);
    }

    // Update last sync time in hubspot_tokens
    await supabase
      .from("hubspot_tokens")
      .update({ updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    console.log("[hubspot-sync] Synced", synced, "of", hubspotDeals.length, "deals");

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

async function getPrimaryAssociationId(
  accessToken: string,
  dealId: string,
  toObjectType: "contacts" | "companies",
): Promise<string | null> {
  try {
    const url = `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/${toObjectType}?limit=100`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("[hubspot-sync] Association fetch failed:", {
        dealId,
        toObjectType,
        status: res.status,
        body: t.slice(0, 300),
      });
      return null;
    }

    const json = await res.json();
    const results: Array<any> = Array.isArray(json?.results) ? json.results : [];

    const primary = results.find((r) =>
      (r.associationTypes || []).some(
        (t: any) => String(t?.label || "").toLowerCase() === "primary",
      ),
    );

    const chosen = primary || results[0];
    const id = chosen?.toObjectId;
    return id != null ? String(id) : null;
  } catch (e) {
    console.error("[hubspot-sync] Error fetching associations:", {
      dealId,
      toObjectType,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/**
 * Calculate a risk score based on deal metrics
 * Higher score = higher risk
 */
function calculateRiskScore(
  daysInactive: number,
  daysInStage: number,
  stage: string | undefined
): number {
  let score = 0;

  // Inactivity penalty (max 40 points)
  if (daysInactive > 30) score += 40;
  else if (daysInactive > 14) score += 30;
  else if (daysInactive > 7) score += 20;
  else if (daysInactive > 3) score += 10;

  // Days in stage penalty (max 30 points)
  if (daysInStage > 60) score += 30;
  else if (daysInStage > 30) score += 20;
  else if (daysInStage > 14) score += 10;

  // Stage-based risk (max 30 points)
  const riskyStages = ["closedlost", "closed_lost"];
  const staleStages = ["qualified", "qualifiedtobuy", "appointmentscheduled"];
  
  const normalizedStage = (stage || "").toLowerCase().replace(/[_-]/g, "");
  
  if (riskyStages.some(s => normalizedStage.includes(s.replace(/[_-]/g, "")))) {
    score += 30;
  } else if (staleStages.some(s => normalizedStage.includes(s.replace(/[_-]/g, "")))) {
    score += 15;
  }

  return Math.min(score, 100);
}
