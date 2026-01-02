import React, { useState } from 'react';
import { AgentPreferences } from '@/types';
import { Save, Check } from 'lucide-react';

interface AgentViewProps {
  preferences: AgentPreferences;
  onSave: (prefs: AgentPreferences) => void;
}

export const AgentView: React.FC<AgentViewProps> = ({ preferences, onSave }) => {
  const [localPrefs, setLocalPrefs] = useState<AgentPreferences>(preferences);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave(localPrefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const update = (field: keyof AgentPreferences, value: any) => {
    setLocalPrefs(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const roles = ['AE', 'BDR', 'Founder', 'CSM', 'VP Sales'];
  
  const toneOptions = [
    { id: 'friendly', label: 'Friendly', desc: 'Conversational and personable' },
    { id: 'direct', label: 'Direct', desc: 'Brief and action-focused' },
    { id: 'professional', label: 'Professional', desc: 'Polished and business-appropriate' },
    { id: 'casual', label: 'Casual', desc: 'Informal and relaxed' },
    { id: 'challenger', label: 'Challenger', desc: 'Thought-provoking and strategic' },
  ];
  
  const styleOptions = [
    { id: 'short', label: 'Short & Punchy', desc: 'Concise and time-efficient' },
    { id: 'detailed', label: 'Detailed', desc: 'Comprehensive with full context' },
    { id: 'urgent', label: 'Urgent', desc: 'Direct call-to-action focused' },
    { id: 'soft', label: 'Soft Touch', desc: 'Gentle and low-pressure' },
    { id: 'storytelling', label: 'Storytelling', desc: 'Narrative-driven approach' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto px-4 w-full">
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
          My AI Agent
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
          Customize how Drift writes emails to match your communication style.
        </p>
      </div>

      <div className="space-y-10">
        {/* Role Section */}
        <section>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Your Role</label>
          <div className="relative">
            <select 
              value={localPrefs.role}
              onChange={(e) => update('role', e.target.value)}
              className="block w-full sm:w-1/2 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 dark:text-white shadow-sm"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
        </section>

        {/* Tone Section */}
        <section>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Tone of Voice</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {toneOptions.map((option) => {
              const isSelected = localPrefs.tone === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => update('tone', option.id)}
                  className={`group relative flex flex-col items-start p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className={`font-semibold text-sm ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {option.label}
                    </span>
                    {isSelected && <Check size={14} className="text-blue-500" strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Style Section */}
        <section>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Follow-Up Style</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {styleOptions.map((option) => {
              const isSelected = localPrefs.style === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => update('style', option.id)}
                   className={`group relative flex flex-col items-start p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className={`font-semibold text-sm ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {option.label}
                    </span>
                    {isSelected && <Check size={14} className="text-blue-500" strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Product Description */}
        <section>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Product / Offer Description
          </label>
          <textarea
            rows={4}
            value={localPrefs.productDescription}
            onChange={(e) => update('productDescription', e.target.value)}
            className="block w-full text-sm rounded-md p-3 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. We sell a project management tool for creative agencies..."
          />
          <p className="text-xs text-gray-500 mt-2">The AI uses this to add context to your emails.</p>
        </section>

        {/* Calendar Link */}
        <section>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Calendar / Booking Link
          </label>
          <input
            type="text"
            value={localPrefs.calendarLink}
            onChange={(e) => update('calendarLink', e.target.value)}
            className="block w-full text-sm rounded-md p-3 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://calendly.com/your-name"
          />
        </section>
      </div>

      {/* Save Section - consistent with RiskEngineView */}
      <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end">
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors ${
            isSaved 
              ? 'bg-emerald-600 text-white cursor-default' 
              : 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900'
          }`}
        >
          {isSaved ? 'Preferences Saved' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};
