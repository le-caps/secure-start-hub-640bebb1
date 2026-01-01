/**
 * Utility to format HubSpot stage names into readable labels
 * e.g., "presentationscheduled" → "Presentation Scheduled"
 */

// Known HubSpot stage mappings (can be extended)
const HUBSPOT_STAGE_LABELS: Record<string, string> = {
  // Common HubSpot default stages
  appointmentscheduled: "Appointment Scheduled",
  qualifiedtobuy: "Qualified to Buy",
  presentationscheduled: "Presentation Scheduled",
  decisionmakerboughtin: "Decision Maker Bought In",
  contractsent: "Contract Sent",
  closedwon: "Closed Won",
  closedlost: "Closed Lost",
  // Common custom stages
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  discovery: "Discovery",
  demo: "Demo",
  evaluation: "Evaluation",
  onboarding: "Onboarding",
};

// Stage colors based on position in funnel
const STAGE_COLORS: Record<string, string> = {
  // Early stages
  new: "bg-blue-500",
  appointmentscheduled: "bg-blue-500",
  discovery: "bg-blue-400",
  qualified: "bg-purple-500",
  qualifiedtobuy: "bg-purple-500",
  // Middle stages
  demo: "bg-indigo-500",
  presentationscheduled: "bg-indigo-500",
  proposal: "bg-yellow-500",
  evaluation: "bg-yellow-500",
  decisionmakerboughtin: "bg-orange-400",
  negotiation: "bg-orange-500",
  contractsent: "bg-orange-600",
  // Final stages
  closedwon: "bg-green-500",
  closed_won: "bg-green-500",
  closedlost: "bg-red-500",
  closed_lost: "bg-red-500",
  onboarding: "bg-teal-500",
};

/**
 * Format a raw stage identifier into a human-readable label
 */
export function formatStageName(stage: string | null | undefined): string {
  if (!stage) return "Unknown";
  
  const normalized = stage.toLowerCase().replace(/[_-]/g, "");
  
  // Check known mappings first
  if (HUBSPOT_STAGE_LABELS[normalized]) {
    return HUBSPOT_STAGE_LABELS[normalized];
  }
  
  // Check original format mappings
  if (HUBSPOT_STAGE_LABELS[stage.toLowerCase()]) {
    return HUBSPOT_STAGE_LABELS[stage.toLowerCase()];
  }
  
  // Auto-format: split camelCase and add spaces
  const formatted = stage
    // Insert space before uppercase letters
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, " ")
    // Capitalize each word
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  
  return formatted || stage;
}

/**
 * Get a Tailwind background color class for a stage
 */
export function getStageColor(stage: string | null | undefined): string {
  if (!stage) return "bg-gray-500";
  
  const normalized = stage.toLowerCase().replace(/[_-]/g, "");
  
  return STAGE_COLORS[normalized] || STAGE_COLORS[stage.toLowerCase()] || "bg-gray-500";
}

/**
 * Get both label and color for a stage
 */
export function getStageInfo(stage: string | null | undefined): { label: string; color: string } {
  return {
    label: formatStageName(stage),
    color: getStageColor(stage),
  };
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(startDate: string | null | undefined, endDate?: string): number {
  if (!startDate) return 0;
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
