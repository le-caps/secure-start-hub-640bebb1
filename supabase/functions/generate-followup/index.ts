import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deal, preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Generating follow-up for deal:", deal.name);
    console.log("With preferences:", JSON.stringify(preferences, null, 2));

    // Build context from deal and preferences
    const senderName = preferences.senderName || "Your Name";
    const role = preferences.role || "AE";
    const tone = preferences.tone || "professional";
    const style = preferences.style || "short";
    const productDescription = preferences.productDescription || "";
    const calendarLink = preferences.calendarLink || "";
    const language = preferences.language || "en";

    const systemPrompt = `You are an expert sales copywriter helping ${role} professionals write effective follow-up emails.

Your writing style:
- Tone: ${tone}
- Style: ${style}
- Language: ${language === "fr" ? "French" : "English"}

Context about the product/service being sold:
${productDescription || "A B2B software solution."}

Important rules:
1. Write a complete email including a subject line
2. Keep it concise and action-oriented
3. Reference specific deal context when available
4. Include a clear call-to-action
5. ${calendarLink ? `Include the booking link: ${calendarLink}` : "Suggest a next step"}
6. Sign off with: ${senderName}`;

    const userPrompt = `Write a follow-up email for this stalled deal:

Deal Name: ${deal.name}
Company: ${deal.companyName}
Contact: ${deal.contactName}
Amount: ${deal.currency} ${deal.amount?.toLocaleString()}
Stage: ${deal.stage}
Days Inactive: ${deal.daysInactive} days
Days in Stage: ${deal.daysInStage} days
Next Step: ${deal.nextStep || "Not defined"}

Notes from CRM:
${deal.notes || "No notes available."}

Write a compelling follow-up email that re-engages this prospect.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data));
      throw new Error("No content generated");
    }

    console.log("Successfully generated follow-up email");

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-followup function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
