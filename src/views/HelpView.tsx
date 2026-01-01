import React from 'react';
import { HelpCircle, MessageSquare, Mail, Search } from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-3xl mx-auto px-4 w-full">
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
          Help & Support
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
          Find answers and get in touch with our team.
        </p>
      </div>

      <div className="grid gap-4">
        {/* FAQ Section */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                How does the AI follow-up work?
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drift analyzes your deal context, notes, and preferences to generate personalized follow-up emails that match your tone and style.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                How is the risk score calculated?
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The risk score is calculated based on deal amount, stage, inactivity period, and keywords found in your notes. You can customize the weights in the Risk Engine settings.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Can I integrate with my CRM?
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Yes! Drift integrates with major CRMs like Salesforce and HubSpot. Contact our team to set up your integration.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Live Chat</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Chat with our support team in real-time.
            </p>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
              Start Chat
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Email Support</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Send us an email and we{"'"}ll respond within 24 hours.
            </p>
            <a 
              href="mailto:support@drift.app" 
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium text-center transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Search Documentation</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-sm placeholder-gray-400 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
