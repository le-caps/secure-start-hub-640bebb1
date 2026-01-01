export type ViewState =
  | 'deals'
  | 'dealDetails'
  | 'insights'
  | 'agent'
  | 'help'
  | 'settings'
  | 'riskEngine';

export type Priority = 'high' | 'medium' | 'low';

export interface Deal {
  id: string;
  name: string;
  companyName: string;
  contactName: string;
  priority: Priority;
  stage: string;
  nextStep: string | null;
  amount: number;
  currency: 'USD' | 'EUR' | 'CAD' | 'GBP';
  daysInStage: number;
  daysInactive: number;
  crmUrl: string;
  lastActivityDate: string;
  notes: string;
  aiFollowUp?: string;
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  riskFactors?: string[];
}

export interface AgentPreferences {
  senderName: string;
  role: 'AE' | 'BDR' | 'Founder' | 'CSM' | 'VP Sales' | 'Other';
  tone: 'friendly' | 'direct' | 'professional' | 'casual' | 'challenger';
  style: 'short' | 'detailed' | 'urgent' | 'soft' | 'storytelling';
  productDescription: string;
  calendarLink: string;
  language: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  title: string;
  country: string;
  language: string;
  timezone: string;
  
  notifications: {
    emailDigest: boolean;
    pushDesktop: boolean;
    marketing: boolean;
  };
 
  stalledThresholdDays: number;
  riskWeightAmount: number;
  riskWeightStage: number;
  riskWeightInactivity: number;
  riskWeightNotes: number;
  
  riskKeywords: {
    word: string;
    weight: number;
  }[];
  
  highValueThreshold: number;
  riskyStages: string[];
}
