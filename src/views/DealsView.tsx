import React, { useState, useMemo, useEffect } from "react";
import { Deal, Priority } from "@/types";
import { useDemo } from "@/hooks/useDemo";
import { useHubspot } from "@/hooks/useHubspot";
import { formatStageName } from "@/lib/stageFormatter";
import {
  Clock,
  Search,
  SlidersHorizontal,
  ArrowDownWideNarrow,
  Handshake,
  FileText,
  CheckCircle2,
  Compass,
  ClipboardList,
  CircleDashed,
  User,
  ChevronLeft,
  ChevronRight,
  Building,
  Link2,
  ExternalLink,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";

// ===========================================================
// RISK BADGE — displayed on each card
// ===========================================================
export const RiskBadge = ({
  score,
  level,
}: {
  score?: number;
  level?: "low" | "medium" | "high";
}) => {
  if (score == null || !level) return null;

  const styles = {
    high: "text-risk-high bg-risk-high-bg border-risk-high-border",
    medium: "text-risk-medium bg-risk-medium-bg border-risk-medium-border",
    low: "text-risk-low bg-risk-low-bg border-risk-low-border",
  };

  const labels = {
    high: "High Risk",
    medium: "Medium Risk",
    low: "Low Risk",
  };

  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles[level]}`}
    >
      {labels[level]} · {score}
    </span>
  );
};

// ===========================================================
// PRIORITY BADGE
// ===========================================================
const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    high: "text-priority-high bg-priority-high-bg border-priority-high-border",
    medium: "text-priority-medium bg-priority-medium-bg border-priority-medium-border",
    low: "text-priority-low bg-priority-low-bg border-priority-low-border",
  };

  const labels = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
  };

  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  );
};

// ===========================================================
// STAGE ICON
// ===========================================================
const getStageIcon = (stage: string) => {
  const s = stage.toLowerCase();
  if (s.includes("negotiation"))
    return <Handshake size={15} strokeWidth={1.5} />;
  if (s.includes("proposal")) return <FileText size={15} strokeWidth={1.5} />;
  if (s.includes("qualified") || s.includes("won"))
    return <CheckCircle2 size={15} strokeWidth={1.5} />;
  if (s.includes("discovery")) return <Compass size={15} strokeWidth={1.5} />;
  if (s.includes("evaluation") || s.includes("demo"))
    return <ClipboardList size={15} strokeWidth={1.5} />;
  return <CircleDashed size={15} strokeWidth={1.5} />;
};

// Priority bar (left accent)
const getPriorityBarStyle = (priority: Priority) => {
  switch (priority) {
    case "high":
      return "bg-priority-high";
    case "medium":
      return "bg-priority-medium";
    case "low":
      return "bg-priority-low";
    default:
      return "bg-muted";
  }
};

// ===========================================================
// MAIN DEALS VIEW
// ===========================================================
export const DealsView: React.FC<{
  deals: Deal[];
  onSelectDeal: (dealId: string) => void;
  onRefreshDeals?: () => void;
}> = ({ deals, onSelectDeal, onRefreshDeals }) => {
  const { isDemo } = useDemo();
  const { connected, loading: hubspotLoading, syncing, connect, sync } = useHubspot();
  const ITEMS_PER_PAGE = 6;
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [sortBy, setSortBy] = useState<
    "priority" | "inactive" | "amount" | "name"
  >("priority");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priorityFilter, sortBy]);

  // Refresh deals after sync
  const handleSync = async () => {
    await sync();
    onRefreshDeals?.();
  };

  // ---------------------------------------------------------
  // FILTER + SORT
  // ---------------------------------------------------------
  const filteredAndSortedDeals = useMemo(() => {
    let result = [...deals];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.companyName.toLowerCase().includes(q) ||
          d.contactName.toLowerCase().includes(q)
      );
    }

    if (priorityFilter !== "all") {
      result = result.filter((d) => d.priority === priorityFilter);
    }

    // Sorting rules
    result.sort((a, b) => {
      switch (sortBy) {
        case "priority": {
          const map = { high: 3, medium: 2, low: 1 };
          const diff = map[b.priority] - map[a.priority];
          if (diff !== 0) return diff;
          return b.daysInactive - a.daysInactive;
        }
        case "inactive":
          return b.daysInactive - a.daysInactive;
        case "amount":
          return b.amount - a.amount;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [deals, searchQuery, priorityFilter, sortBy]);

  // ---------------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------------
  const totalPages = Math.ceil(filteredAndSortedDeals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDeals = filteredAndSortedDeals.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  
  // Show HubSpot connection prompt for logged-in users with no HubSpot connection
  if (!isDemo && !connected && !hubspotLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto px-4 w-full">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            My Deals
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
            Connect your CRM to start tracking deals
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
            <Link2 size={40} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connect HubSpot
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
            Sync your deals from HubSpot to track stalled opportunities and get AI-powered insights.
          </p>
          <button 
            onClick={connect}
            className="bg-[#ff7a59] hover:bg-[#ff5c35] text-white px-6 py-3 rounded-md font-medium flex items-center gap-2 transition-colors"
          >
            <ExternalLink size={18} />
            Connect HubSpot
          </button>
          <p className="text-xs text-gray-400 mt-4">
            We only request read access to your deals and properties
          </p>
        </div>
      </div>
    );
  }

  // Show empty state for connected users with no deals yet
  if (!isDemo && connected && deals.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto px-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              My Deals
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
              HubSpot connected — syncing your deals
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full mb-6">
            <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            HubSpot Connected!
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
            No deals synced yet. Click "Sync Now" to fetch your deals from HubSpot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto px-4 w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {isDemo ? "My Stalled Deals (Demo)" : "My Stalled Deals"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
            Action required on {filteredAndSortedDeals.length} opportunities
          </p>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={15} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md text-sm placeholder-gray-400 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Priority filter */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)}
              className="w-full appearance-none pl-8 pr-8 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md text-sm text-gray-700 dark:text-gray-200 shadow-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <SlidersHorizontal
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

          {/* Sort */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "priority" | "inactive" | "amount" | "name")}
              className="w-full appearance-none pl-8 pr-8 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md text-sm text-gray-700 dark:text-gray-200 shadow-sm"
            >
              <option value="priority">Priority</option>
              <option value="inactive">Inactive</option>
              <option value="amount">Value</option>
              <option value="name">Name</option>
            </select>
            <ArrowDownWideNarrow
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* DEAL CARDS */}
      <div className="grid gap-4 max-w-5xl mx-auto w-full">
        {paginatedDeals.length > 0 ? (
          paginatedDeals.map((deal) => {
            const barStyle = getPriorityBarStyle(deal.priority);
            return (
              <div
                key={deal.id}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 relative overflow-hidden pl-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Priority Colored Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${barStyle}`} />
                <div className="relative z-10 flex flex-col gap-4">
                  {/* Top row */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={deal.priority} />
                        <RiskBadge
                          score={deal.riskScore}
                          level={deal.riskLevel}
                        />
                      </div>
                      <button
                        onClick={() => onSelectDeal(deal.id)}
                        className="text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                      >
                        {deal.name}
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Building size={14} className="text-gray-400" />
                        {deal.companyName}
                        <span className="text-gray-300">•</span>
                        <User size={14} className="text-gray-400" />
                        {deal.contactName}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: deal.currency,
                        maximumFractionDigits: 0,
                      }).format(deal.amount)}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 dark:bg-zinc-800" />

                  {/* Bottom row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0 flex-1 min-w-0">
                      {/* Stage */}
                      <div className="flex-1 flex flex-col gap-1 sm:pr-4">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Stage
                        </span>
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                          {getStageIcon(deal.stage)}
                          <span className="truncate font-medium">
                            {formatStageName(deal.stage)}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-zinc-700" />

                      {/* Days in Stage */}
                      <div className="flex-1 flex flex-col gap-1 sm:px-4">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Days in Stage
                        </span>
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                          <Calendar size={15} strokeWidth={1.5} />
                          {deal.daysInStage} days
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-zinc-700" />

                      {/* Inactivity */}
                      <div className="flex-1 flex flex-col gap-1 sm:px-4">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Inactivity
                        </span>
                        <div
                          className={`flex items-center gap-1.5 text-sm font-medium ${
                            deal.daysInactive > 14
                              ? "text-rose-600"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <Clock size={15} strokeWidth={1.5} />
                          {deal.daysInactive} days
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-zinc-700" />

                      {/* Next Step */}
                      <div className="flex-1 flex flex-col gap-1 sm:pl-4">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Next Step
                        </span>
                        <span
                          className="text-sm text-gray-600 dark:text-gray-400 truncate"
                          title={deal.nextStep || ""}
                        >
                          {deal.nextStep || "-"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectDeal(deal.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto rounded-md transition-colors"
                    >
                      View Details
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center py-20">
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-full mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No deals match your search
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
              }}
              className="text-blue-600 hover:underline text-sm font-medium mt-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {filteredAndSortedDeals.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-6">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {startIndex + 1}-
              {Math.min(
                startIndex + ITEMS_PER_PAGE,
                filteredAndSortedDeals.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {filteredAndSortedDeals.length}
            </span>{" "}
            deals
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 text-sm font-medium text-gray-700 dark:text-gray-200">
              Page {currentPage}{" "}
              <span className="text-gray-400">/</span> {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
