import React, { useMemo, useState, useEffect } from "react";
import { Deal, UserProfile } from "@/types";
import { SliderControl } from "@/components/SliderControl";
import { formatStageName } from "@/lib/stageFormatter";
import { useRiskSettings } from "@/hooks/useRiskSettings";
import { useDemo } from "@/hooks/useDemo";
import { DEFAULT_USER_PROFILE } from "@/constants";
import { Loader2 } from "lucide-react";

interface RiskEngineViewProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  deals: Deal[];
}

export const RiskEngineView: React.FC<RiskEngineViewProps> = ({
  profile,
  onUpdateProfile,
  deals,
}) => {
  const { riskSettings, loading, saveProfilePreferences, isDemo } = useRiskSettings();
  const [local, setLocal] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved preferences from risk_settings when available
  useEffect(() => {
    if (riskSettings?.parsedSettings && !isDemo) {
      const savedPrefs = riskSettings.parsedSettings;
      setLocal((prev) => ({
        ...prev,
        stalledThresholdDays: savedPrefs.stalledThresholdDays ?? prev.stalledThresholdDays,
        riskWeightAmount: savedPrefs.riskWeightAmount ?? prev.riskWeightAmount,
        riskWeightStage: savedPrefs.riskWeightStage ?? prev.riskWeightStage,
        riskWeightInactivity: savedPrefs.riskWeightInactivity ?? prev.riskWeightInactivity,
        riskWeightNotes: savedPrefs.riskWeightNotes ?? prev.riskWeightNotes,
        highValueThreshold: savedPrefs.highValueThreshold ?? prev.highValueThreshold,
        riskyStages: savedPrefs.riskyStages ?? prev.riskyStages,
        riskKeywords: savedPrefs.riskKeywords ?? prev.riskKeywords,
      }));
    } else if (isDemo) {
      setLocal(profile);
    }
  }, [riskSettings, isDemo, profile]);

  // Sync with profile changes from parent
  useEffect(() => {
    if (isDemo) {
      setLocal(profile);
    }
  }, [profile, isDemo]);

  const update = (key: keyof UserProfile, value: any) => {
    setLocal((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ---------- SAVE HANDLER ----------
  const handleSave = async () => {
    setSaving(true);
    
    if (isDemo) {
      // Demo mode: just update local state
      onUpdateProfile(local);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setSaving(false);
      return;
    }

    // Save to database
    const success = await saveProfilePreferences(local);
    if (success) {
      onUpdateProfile(local);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  // ---------- RISK DISTRIBUTION ----------
  const { low, med, high, total } = useMemo(() => {
    const lowCount = deals.filter((d) => d.riskLevel === "low").length;
    const medCount = deals.filter((d) => d.riskLevel === "medium").length;
    const highCount = deals.filter((d) => d.riskLevel === "high").length;
    return {
      low: lowCount,
      med: medCount,
      high: highCount,
      total: deals.length,
    };
  }, [deals]);

  const pct = (n: number) => (!total ? 0 : Math.round((n / total) * 100));

  const totalWeight =
    (local.riskWeightAmount || 0) +
    (local.riskWeightStage || 0) +
    (local.riskWeightInactivity || 0) +
    (local.riskWeightNotes || 0);

  // ---------- KEYWORD HANDLERS ----------
  const addKeyword = () => {
    const updated = [...(local.riskKeywords || []), { word: "", weight: 0.1 }];
    update("riskKeywords", updated);
  };

  const updateKeyword = (i: number, field: "word" | "weight", value: any) => {
    const current = local.riskKeywords || [];
    const updated = [...current];
    updated[i] = { ...updated[i], [field]: value };
    update("riskKeywords", updated);
  };

  const deleteKeyword = (i: number) => {
    const updated = (local.riskKeywords || []).filter((_, idx) => idx !== i);
    update("riskKeywords", updated);
  };

  const riskyStages = local.riskyStages || [];

  // Extract unique stages from the user's actual deals
  const uniqueStages = useMemo(() => {
    const stages = deals.map((d) => d.stage).filter(Boolean);
    return [...new Set(stages)];
  }, [deals]);

  // ---------- BUTTON STYLE ----------
  const saveBtnClasses = (isSaved: boolean, isSaving: boolean) =>
    `px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2 ${
      isSaved
        ? "bg-emerald-600 text-white cursor-default"
        : isSaving
        ? "bg-gray-400 text-white cursor-wait"
        : "bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900"
    }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto px-4 w-full">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Deal Risk Engine
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
            Customize how risk is scored across your pipeline.
          </p>
        </div>
        {/* Save button (top-right) */}
        <button onClick={handleSave} disabled={saved || saving} className={saveBtnClasses(saved, saving)}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saved ? "Preferences Saved" : saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      <section className="p-6 rounded-xl bg-white dark:bg-zinc-900 space-y-10 border border-gray-200 dark:border-zinc-800">
        {/* STALLED THRESHOLD */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Stalled Deal Threshold
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Deals inactive longer than this value are flagged as stalled.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={local.stalledThresholdDays}
              min={1}
              max={120}
              onChange={(e) => update("stalledThresholdDays", Number(e.target.value))}
              className="w-28 px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>

        {/* HIGH VALUE THRESHOLD */}
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            High-Value Threshold
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Deals above this amount are considered high-value.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={local.highValueThreshold}
              min={0}
              onChange={(e) => update("highValueThreshold", Number(e.target.value))}
              className="w-40 px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* WEIGHT SLIDERS */}
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Risk Score Weights
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                Math.round(totalWeight * 100) === 100
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
              }`}
            >
              Total: {Math.round(totalWeight * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SliderControl
              label="Deal Amount"
              value={local.riskWeightAmount}
              onChange={(v) => update("riskWeightAmount", v)}
              otherValues={[local.riskWeightStage, local.riskWeightInactivity, local.riskWeightNotes]}
            />
            <SliderControl
              label="Deal Stage"
              value={local.riskWeightStage}
              onChange={(v) => update("riskWeightStage", v)}
              otherValues={[local.riskWeightAmount, local.riskWeightInactivity, local.riskWeightNotes]}
            />
            <SliderControl
              label="Inactivity"
              value={local.riskWeightInactivity}
              onChange={(v) => update("riskWeightInactivity", v)}
              otherValues={[local.riskWeightAmount, local.riskWeightStage, local.riskWeightNotes]}
            />
            <SliderControl
              label="Notes Keywords"
              value={local.riskWeightNotes}
              onChange={(v) => update("riskWeightNotes", v)}
              otherValues={[local.riskWeightAmount, local.riskWeightStage, local.riskWeightInactivity]}
            />
          </div>
        </div>

        {/* KEYWORD RULES */}
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Keyword Rules
          </h3>
          <div className="space-y-4">
            {(local.riskKeywords || []).map((kw, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40"
              >
                <input
                  type="text"
                  value={kw.word}
                  placeholder="keyword…"
                  onChange={(e) => updateKeyword(i, "word", e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
                />
                <div className="w-52">
                  <SliderControl
                    label="Weight"
                    value={kw.weight}
                    onChange={(v) => updateKeyword(i, "weight", v)}
                    otherValues={[]}
                  />
                </div>
                <button
                  onClick={() => deleteKeyword(i)}
                  className="text-xs px-3 py-1 rounded-md border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addKeyword}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              + Add Keyword Rule
            </button>
          </div>
        </div>

        {/* RISKY STAGES - based on user's actual deal stages */}
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Risky Deal Stages
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select stages that should increase the risk score of your deals.
          </p>
          {uniqueStages.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No stages detected yet. Sync your HubSpot deals to see your stages here.
            </p>
          ) : (
            <div className="flex flex-wrap">
              {uniqueStages.map((stage) => {
                const key = stage.toLowerCase();
                const active = riskyStages.includes(key);
                return (
                  <button
                    key={stage}
                    onClick={() =>
                      update(
                        "riskyStages",
                        active
                          ? riskyStages.filter((s) => s !== key)
                          : [...riskyStages, key]
                      )
                    }
                    className={`px-3 py-1.5 text-sm rounded-md border mr-2 mb-2 transition-colors ${
                      active
                        ? "bg-red-100 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                        : "bg-gray-50 border-gray-300 text-gray-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {formatStageName(stage)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RISK DISTRIBUTION */}
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Live Risk Distribution</h3>
          <div className="space-y-4">
            {[
              { label: "Low Risk", count: low, color: "bg-emerald-500" },
              { label: "Medium Risk", count: med, color: "bg-amber-500" },
              { label: "High Risk", count: high, color: "bg-red-500" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{r.label}</span>
                  <span>
                    {r.count} deals • {pct(r.count)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-2 ${r.color} transition-all`} style={{ width: `${pct(r.count)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM SAVE BUTTON */}
        <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end">
          <button onClick={handleSave} disabled={saved || saving} className={saveBtnClasses(saved, saving)}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saved ? "Preferences Saved" : saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </section>
    </div>
  );
};
