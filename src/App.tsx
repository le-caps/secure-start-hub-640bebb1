import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from '@/hooks/useAuth';
import { DemoProvider } from '@/hooks/useDemo';
import { DemoBanner } from '@/components/DemoBanner';

import { Sidebar } from '@/components/Sidebar';
import { DealsView } from '@/views/DealsView';
import { DealDetailView } from '@/views/DealDetailView';
import { AgentView } from '@/views/AgentView';
import { InsightsView } from '@/views/InsightsView';
import { SettingsView } from '@/views/SettingsView';
import { HelpView } from '@/views/HelpView';
import { RiskEngineView } from '@/views/RiskEngineView';
import Auth from '@/pages/Auth';

import { MOCK_DEALS, DEFAULT_PREFERENCES, DEFAULT_USER_PROFILE } from '@/constants';
import { Deal, ViewState, AgentPreferences, UserProfile } from '@/types';
import { computeRiskScore } from '@/services/riskEngine';
import { Menu } from 'lucide-react';

const queryClient = new QueryClient();

// Main App Layout with sidebar navigation
const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('deals');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Deals enriched with risk scoring
  const [deals, setDeals] = useState<Deal[]>(() => {
    return MOCK_DEALS.map((d) => {
      const { score, riskLevel, riskFactors } = computeRiskScore(d, DEFAULT_USER_PROFILE);
      return { ...d, riskScore: score, riskLevel, riskFactors };
    });
  });

  const [preferences, setPreferences] = useState<AgentPreferences>(DEFAULT_PREFERENCES);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Enrich deals with risk when profile changes
  const enrichDealsWithRisk = (dealList: Deal[], profile: UserProfile): Deal[] => {
    return dealList.map((deal) => {
      const { score, riskLevel, riskFactors } = computeRiskScore(deal, profile);
      return {
        ...deal,
        riskScore: score,
        riskLevel,
        riskFactors,
      };
    });
  };

  // Recalculate scores when profile changes
  useEffect(() => {
    setDeals((prev) => enrichDealsWithRisk(prev, userProfile));
  }, [userProfile]);

  const handleSelectDeal = (dealId: string) => {
    setSelectedDealId(dealId);
    setCurrentView('dealDetails');
  };

  const handleUpdateDeal = (updatedDeal: Deal) => {
    const enriched = {
      ...updatedDeal,
      ...computeRiskScore(updatedDeal, userProfile),
    };

    setDeals((prev) =>
      prev.map((d) => (d.id === updatedDeal.id ? enriched : d))
    );
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  const renderView = () => {
    switch (currentView) {
      case 'deals':
        return <DealsView deals={deals} onSelectDeal={handleSelectDeal} />;
      case 'dealDetails':
        if (!selectedDeal) return <DealsView deals={deals} onSelectDeal={handleSelectDeal} />;
        return (
          <DealDetailView
            deal={selectedDeal}
            preferences={preferences}
            onBack={() => setCurrentView('deals')}
            onUpdateDeal={handleUpdateDeal}
          />
        );
      case 'agent':
        return <AgentView preferences={preferences} onSave={setPreferences} />;
      case 'insights':
        return <InsightsView deals={deals} onSelectDeal={handleSelectDeal} />;
      case 'help':
        return <HelpView />;
      case 'riskEngine':
        return (
          <RiskEngineView
            profile={userProfile}
            onUpdateProfile={setUserProfile}
            deals={deals}
          />
        );
      case 'settings':
        return (
          <SettingsView
            profile={userProfile}
            onUpdateProfile={setUserProfile}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            deals={deals}
          />
        );
      default:
        return <DealsView deals={deals} onSelectDeal={handleSelectDeal} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white">
      {/* Demo Banner */}
      <DemoBanner />
      
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 z-30">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            D
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">Drift</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8">
        {renderView()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DemoProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/*" element={<MainApp />} />
              </Routes>
            </DemoProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
