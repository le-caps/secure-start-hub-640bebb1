import type { Deal } from "@/hooks/useDeals";
import type { RiskSettings } from "@/hooks/useRiskSettings";
import type { AgentPreferences } from "@/hooks/useAgentPreferences";

// Mock user ID for demo mode
export const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

// Mock Deals for demo mode
export const MOCK_DEALS: Deal[] = [
  {
    id: "demo-deal-001",
    user_id: DEMO_USER_ID,
    name: "Acme Corp - Enterprise License",
    amount: 125000,
    stage: "negotiation",
    hubspot_deal_id: null,
    metadata: {
      company: "Acme Corp",
      contact: "John Smith",
      probability: 75,
      riskScore: 32,
    },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-deal-002",
    user_id: DEMO_USER_ID,
    name: "TechStart Inc - SaaS Subscription",
    amount: 48000,
    stage: "proposal",
    hubspot_deal_id: null,
    metadata: {
      company: "TechStart Inc",
      contact: "Sarah Johnson",
      probability: 60,
      riskScore: 55,
    },
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-deal-003",
    user_id: DEMO_USER_ID,
    name: "Global Industries - Consulting",
    amount: 85000,
    stage: "qualified",
    hubspot_deal_id: null,
    metadata: {
      company: "Global Industries",
      contact: "Michael Chen",
      probability: 45,
      riskScore: 68,
    },
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-deal-004",
    user_id: DEMO_USER_ID,
    name: "StartupXYZ - Pilot Program",
    amount: 15000,
    stage: "new",
    hubspot_deal_id: null,
    metadata: {
      company: "StartupXYZ",
      contact: "Emma Davis",
      probability: 30,
      riskScore: 78,
    },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-deal-005",
    user_id: DEMO_USER_ID,
    name: "MegaCorp - Annual Contract",
    amount: 250000,
    stage: "closed_won",
    hubspot_deal_id: null,
    metadata: {
      company: "MegaCorp",
      contact: "David Wilson",
      probability: 100,
      riskScore: 12,
    },
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Risk Settings for demo mode
export const MOCK_RISK_SETTINGS: RiskSettings = {
  id: "demo-risk-settings-001",
  user_id: DEMO_USER_ID,
  max_deal_amount: 100000,
  risk_tolerance: "medium",
  alert_threshold: 80,
  settings: {
    enableAlerts: true,
    notifyOnHighRisk: true,
    autoFlagThreshold: 75,
  },
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
};

// Mock Agent Preferences for demo mode
export const MOCK_AGENT_PREFERENCES: AgentPreferences = {
  id: "demo-agent-prefs-001",
  user_id: DEMO_USER_ID,
  language: "fr",
  timezone: "Europe/Paris",
  notification_email: true,
  notification_push: false,
  preferences: {
    theme: "system",
    compactMode: false,
    showRiskIndicators: true,
  },
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
};

// Deal stages for display
export const DEAL_STAGES = {
  new: { label: "Nouveau", color: "bg-blue-500" },
  qualified: { label: "Qualifié", color: "bg-purple-500" },
  proposal: { label: "Proposition", color: "bg-yellow-500" },
  negotiation: { label: "Négociation", color: "bg-orange-500" },
  closed_won: { label: "Gagné", color: "bg-green-500" },
  closed_lost: { label: "Perdu", color: "bg-red-500" },
} as const;

// Risk levels for display
export const RISK_LEVELS = {
  low: { label: "Faible", color: "text-green-500", threshold: 40 },
  medium: { label: "Moyen", color: "text-yellow-500", threshold: 70 },
  high: { label: "Élevé", color: "text-red-500", threshold: 100 },
} as const;

export function getRiskLevel(score: number) {
  if (score < RISK_LEVELS.low.threshold) return RISK_LEVELS.low;
  if (score < RISK_LEVELS.medium.threshold) return RISK_LEVELS.medium;
  return RISK_LEVELS.high;
}
