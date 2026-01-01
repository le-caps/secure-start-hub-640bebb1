import { Deal, AgentPreferences } from '@/types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-followup`;

/**
 * Generates a follow-up email draft based on deal context and user preferences.
 * Uses Lovable AI Gateway through an edge function.
 */
export const generateFollowUp = async (deal: Deal, prefs: AgentPreferences): Promise<string> => {
  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ deal, preferences: prefs }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate follow-up');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("AI generation failed → fallback enabled", error);
    
    // Fallback template
    const firstName = (deal.contactName || '').split(' ')[0] || 'there';
    const senderName = prefs.senderName || '';

    return `Subject: Quick follow-up

Hi ${firstName},

I was thinking about our last conversation and wanted to briefly check in, in case there's anything you're waiting on from my side or any questions that have come up since.

If it's easier to talk things through live, you can grab a time that works best for you here: ${prefs.calendarLink || ''}

${senderName}`.trim();
  }
};
