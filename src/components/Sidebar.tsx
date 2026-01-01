import React, { useState } from 'react';
import { ViewState } from '@/types';
import { Layers, PieChart, Bot, HelpCircle, Settings, X, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, setIsOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: React.ElementType; label: string }) => {
    const isActive = currentView === view || (view === 'deals' && currentView === 'dealDetails');
    
    return (
      <button
        onClick={() => {
          onChangeView(view);
          if (window.innerWidth < 1024) setIsOpen(false);
        }}
        className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group relative ${
          isActive 
            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-gray-200'
        } ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
        title={isCollapsed ? label : ''}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        
        <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Floating Collapse Toggle (Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-9 z-50 w-6 h-6 items-center justify-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full shadow-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-105"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className={`font-semibold text-gray-900 dark:text-white transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              Drift
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem view="deals" icon={Layers} label="Deals" />
          <NavItem view="riskEngine" icon={Shield} label="Risk Engine" />
          <NavItem view="insights" icon={PieChart} label="Insights" />
          <NavItem view="agent" icon={Bot} label="Agent" />
        </nav>

        {/* Bottom Nav */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-zinc-800 space-y-1">
          <NavItem view="help" icon={HelpCircle} label="Help" />
          <NavItem view="settings" icon={Settings} label="Settings" />
          
          <div className={`flex items-center gap-3 px-3 py-2 mt-4 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
              JD
            </div>
            <div className={`transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">john@drift.app</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
