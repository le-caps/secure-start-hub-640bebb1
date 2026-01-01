import { Deal, AgentPreferences } from "@/types";

/**
 * Simulates AI email generation for a follow-up
 * In production, this would call an actual AI service
 */
export async function generateFollowUp(
  deal: Deal,
  preferences: AgentPreferences
): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { contactName, companyName, stage, daysInactive, notes, amount, currency } = deal;
  const { role, tone, style, senderName, calendarLink } = preferences;

  const firstName = contactName.split(' ')[0];
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

  // Generate different templates based on tone and style
  const templates = {
    friendly: {
      short: `Hi ${firstName},

Hope you're doing well! I wanted to check in on the ${deal.name} project we discussed.

It's been ${daysInactive} days since we last connected, and I wanted to make sure you have everything you need to move forward.

Would you have 15 minutes this week for a quick sync?

${calendarLink ? `Book a time here: ${calendarLink}` : ''}

Best,
${senderName || 'Your Account Executive'}`,

      detailed: `Hi ${firstName},

I hope this email finds you well! I wanted to reach out regarding our ongoing conversation about the ${deal.name} opportunity with ${companyName}.

It's been ${daysInactive} days since our last interaction, and I noticed we're currently in the ${stage} phase. I wanted to ensure you have all the resources and information needed to move forward with confidence.

${notes ? `Based on our previous discussions: ${notes.slice(0, 200)}...` : ''}

The investment we discussed (${formattedAmount}) represents significant value for your team, and I'd love to help address any remaining questions or concerns.

Would you be available for a brief call this week to discuss next steps?

${calendarLink ? `Feel free to book a time that works for you: ${calendarLink}` : ''}

Looking forward to hearing from you!

Warm regards,
${senderName || 'Your Account Executive'}`,
    },

    direct: {
      short: `${firstName},

Following up on the ${deal.name} deal (${formattedAmount}).

Current status: ${stage}
Last activity: ${daysInactive} days ago

What's your timeline for a decision?

${calendarLink ? `Schedule here: ${calendarLink}` : ''}

${senderName || 'Your AE'}`,

      detailed: `${firstName},

I'm following up on the ${deal.name} opportunity we've been discussing.

Quick status:
- Deal Value: ${formattedAmount}
- Current Stage: ${stage}
- Days Since Last Contact: ${daysInactive}

${notes ? `Notes from our last conversation: ${notes.slice(0, 150)}` : ''}

I'd like to understand:
1. What's your current priority level for this initiative?
2. Are there any blockers we need to address?
3. What's your decision timeline?

Let me know your availability for a call.

${calendarLink ? `Book directly: ${calendarLink}` : ''}

${senderName || 'Your Account Executive'}`,
    },

    professional: {
      short: `Dear ${firstName},

I am writing to follow up on the ${deal.name} proposal we submitted ${daysInactive} days ago.

Please let me know if you require any additional information to proceed.

Best regards,
${senderName || 'Account Executive'}`,

      detailed: `Dear ${firstName},

I hope this message finds you well. I am reaching out to follow up on our recent discussions regarding the ${deal.name} project with ${companyName}.

As it has been ${daysInactive} days since our last correspondence, I wanted to ensure that all aspects of our proposal (valued at ${formattedAmount}) have been thoroughly reviewed and address any questions that may have arisen.

${notes ? `For reference, our previous discussion covered: ${notes.slice(0, 200)}` : ''}

Currently at the ${stage} stage, I believe we are well-positioned to move forward and would welcome the opportunity to discuss next steps at your convenience.

${calendarLink ? `Please feel free to schedule a meeting at your convenience: ${calendarLink}` : ''}

I look forward to your response.

Best regards,
${senderName || 'Account Executive'}`,
    },
  };

  const selectedTone = templates[tone as keyof typeof templates] || templates.friendly;
  const selectedTemplate = selectedTone[style as keyof typeof selectedTone] || selectedTone.short;

  return selectedTemplate;
}
