import React, { useState, useEffect } from 'react';
import { Deal, AgentPreferences, Priority } from '@/types';
import { generateFollowUp } from '@/services/aiService';
import { formatStageName } from '@/lib/stageFormatter';
import {
  ArrowLeft, Building, User,
  Send, Sparkles, Copy, Check, RefreshCw, AlignLeft,
  ExternalLink, Mail, AlertTriangle
} from 'lucide-react';

const getRiskColorClasses = (level?: 'low' | 'medium' | 'high') => {
  switch (level) {
    case "high":
      return "text-risk-high bg-risk-high-bg border-risk-high-border";
    case "medium":
      return "text-risk-medium bg-risk-medium-bg border-risk-medium-border";
    case "low":
      return "text-risk-low bg-risk-low-bg border-risk-low-border";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
};

interface DealDetailViewProps {
  deal: Deal;
  preferences: AgentPreferences;
  onBack: () => void;
  onUpdateDeal: (deal: Deal) => void;
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    high: "text-priority-high bg-priority-high-bg border-priority-high-border",
    medium: "text-priority-medium bg-priority-medium-bg border-priority-medium-border",
    low: "text-priority-low bg-priority-low-bg border-priority-low-border",
  };

  const labels = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
  };

  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
};

export const DealDetailView: React.FC<DealDetailViewProps> = ({
  deal,
  preferences,
  onBack,
  onUpdateDeal
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setEmailSent(false);

    try {
      const enrichedPrefs: AgentPreferences = {
        ...preferences,
        senderName: preferences.senderName,
        language: preferences.language || 'en',
      };

      const draft = await generateFollowUp(deal, enrichedPrefs);
      setEmailDraft(draft);

    } catch (error) {
      console.error("Failed to generate", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset state when deal changes, but DO NOT auto-generate
  useEffect(() => {
    setEmailDraft('');
    setEmailSent(false);
    setIsGenerating(false);
  }, [deal.id]);

  const handleCopy = () => {
    if (!emailDraft) return;
    navigator.clipboard.writeText(emailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    setEmailSent(true);
    
    const updatedDeal = {
      ...deal,
      lastActivityDate: new Date().toISOString(),
      daysInactive: 0,
      notes: (deal.notes || '') + `\n[${new Date().toLocaleDateString('en-US')}] Follow-up email logged to CRM.`
    };
    onUpdateDeal(updatedDeal);
  };

  const getContactEmail = () => {
    const cleanName = deal.contactName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCompany = deal.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanName}@${cleanCompany}.com`;
  };

  // --------------------------------------------------
  // 🔍 Risk Score Breakdown (basé sur riskFactors)
  // --------------------------------------------------
  const riskFactors = deal.riskFactors || [];

  const factorConfigs = [
    {
      id: 'amount',
      label: 'Deal Amount',
      match: (r: string) => r.toLowerCase().includes('high-value deal'),
    },
    {
      id: 'stage',
      label: 'Deal Stage',
      match: (r: string) => r.toLowerCase().includes('risky stage'),
    },
    {
      id: 'inactivity',
      label: 'Inactivity',
      match: (r: string) => r.toLowerCase().includes('inactive for'),
    },
    {
      id: 'keywords',
      label: 'Notes Keywords',
      match: (r: string) => r.toLowerCase().includes('keyword detected'),
    },
  ] as const;

  const factors = factorConfigs.map(cfg => {
    const reason = riskFactors.find(cfg.match);
    return {
      id: cfg.id,
      label: cfg.label,
      active: Boolean(reason),
      reason,
    };
  });

  const activeCount = factors.filter(f => f.active).length || 1;

  const getShare = (active: boolean) =>
    active ? Math.round(100 / activeCount) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-6xl mx-auto px-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Deals
        </button>

        <a href={deal.crmUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          Open in CRM <ExternalLink size={14} />
        </a>
      </div>
      
      {/* Deal Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {deal.name}
              </h1>
              <PriorityBadge priority={deal.priority} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Building size={14} /> {deal.companyName}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={14} /> {deal.contactName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- MERGED DEAL RISK PANEL ---- */}
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        {/* Top: Icon + Label + Score */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Risk Icon + Labels */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getRiskColorClasses(deal.riskLevel)}`}>
              <AlertTriangle size={20} />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Deal Risk Level
              </span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {deal.riskLevel === "high" && "High Risk"}
                {deal.riskLevel === "medium" && "Medium Risk"}
                {deal.riskLevel === "low" && "Low Risk"}
                {!deal.riskLevel && "Not rated"}
              </span>
            </div>
          </div>

          {/* Right: Score with risk color */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Risk Score</span>
            <span className={`text-2xl font-bold ${
              deal.riskLevel === "high" ? "text-risk-high" :
              deal.riskLevel === "medium" ? "text-risk-medium" :
              deal.riskLevel === "low" ? "text-risk-low" :
              "text-gray-900 dark:text-white"
            }`}>
              {deal.riskScore != null ? `${deal.riskScore}/100` : '—'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-zinc-700 my-4" />

        {/* Breakdown */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Risk Score Breakdown
          </span>

          {factors.map((f) => {
            const share = getShare(f.active);
            const barColor = deal.riskLevel === "high" ? "bg-risk-high" :
                             deal.riskLevel === "medium" ? "bg-risk-medium" :
                             deal.riskLevel === "low" ? "bg-risk-low" :
                             "bg-gray-400";
            return (
              <div key={f.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{f.label}</span>
                  <span>{share}%</span>
                </div>

                <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all`}
                    style={{ width: `${share}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {f.reason
                    ? f.reason
                    : "No specific risk detected for this factor."}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Deal Information */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-full bg-slate-700 dark:bg-slate-600 border-2 border-emerald-500/30 flex items-center justify-center text-white font-semibold">
              {deal.contactName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{deal.contactName}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Mail size={14} />
                <span>{getContactEmail()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-md">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Deal Information
            </h3>
            
            {/* Amount */}
            <div className="mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Deal Value</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency, maximumFractionDigits: 0 }).format(deal.amount)}
              </p>
            </div>

            {/* Vitals List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Inactive
                </span>
                <span className={`text-sm font-medium ${deal.daysInactive > 14 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                  {deal.daysInactive} days
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Days In Stage
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {deal.daysInStage} days
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last Activity
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(deal.lastActivityDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Next Step
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {deal.nextStep || 'Not defined'}
                </span>
              </div>

              {/* Notes Section (Read Only) */}
              <div className="pt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                  <AlignLeft size={14} /> Notes
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-md">
                  {deal.notes || "No notes available."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm h-fit">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Draft follow-up emails based on deal context</p>
              </div>
            </div>
            
            {!emailSent && emailDraft && (
              <button onClick={handleGenerate} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <RefreshCw size={14} />
                Regenerate
              </button>
            )}
          </div>

          {/* Editor / Draft Area */}
          <div className="min-h-[300px] flex flex-col">
            {/* Empty State / Generate Button */}
            {!emailDraft && !isGenerating && !emailSent && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-full mb-4">
                  <Sparkles size={28} className="text-blue-500" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Ready to draft a follow-up email?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                  Generates personalized emails using deal data and your preferences.
                </p>
                <button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2">
                  <Sparkles size={16} />
                  Generate Draft
                </button>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <RefreshCw size={28} className="text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing deal context, notes, and preferences...</p>
              </div>
            )}

            {/* Success State */}
            {emailSent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-4">
                  <Check size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Logged to CRM</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                  Email copied and activity logged to your CRM.
                </p>
                <button onClick={onBack} className="text-blue-600 hover:underline text-sm font-medium">
                  Back to Deals
                </button>
              </div>
            ) : (
              // Draft View
              emailDraft && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Preview</span>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    className="flex-1 w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-md resize-none p-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Generating draft..."
                  />
                </div>
              )
            )}
          </div>

          {/* Actions */}
          {!emailSent && emailDraft && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-gray-400 order-2 sm:order-1 font-medium">
                Using {preferences.role} persona • {preferences.tone} tone
              </p>
              <div className="flex gap-3 order-1 sm:order-2 w-full sm:w-auto">
                <button 
                  onClick={handleSend}
                  className="whitespace-nowrap flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-xs font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                >
                  Log to CRM
                </button>
                <button 
                  onClick={handleCopy}
                  className="whitespace-nowrap flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-4 py-2 shadow-sm text-xs font-medium rounded-md transition-colors"
                >
                  <Copy size={14} />
                  Copy Text
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
