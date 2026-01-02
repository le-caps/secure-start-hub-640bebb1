import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { MOCK_RISK_SETTINGS } from "@/data/mockData";
import { UserProfile } from "@/types";
import { DEFAULT_USER_PROFILE } from "@/constants";

export type RiskSettings = Tables<"risk_settings">;
export type UpdateRiskSettingsInput = TablesUpdate<"risk_settings">;

// Extended risk settings that includes the parsed profile preferences
export interface ExtendedRiskSettings extends RiskSettings {
  parsedSettings?: Partial<UserProfile>;
}

export function useRiskSettings() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [riskSettings, setRiskSettings] = useState<ExtendedRiskSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo mode: no session = use mock data
  const isDemo = !session;

  // Performance monitoring: Track last save time to detect excessive updates
  // Consider adding debouncing if settings are saved more than once per second
  const lastSaveTime = useRef<number>(0);

  const fetchRiskSettings = useCallback(async () => {
    // Demo mode: return mock data immediately
    if (isDemo) {
      setRiskSettings(MOCK_RISK_SETTINGS as ExtendedRiskSettings);
      setLoading(false);
      return;
    }

    if (!user) {
      setRiskSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("risk_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        // Create default settings if none exist
        const defaultSettings = {
          stalledThresholdDays: DEFAULT_USER_PROFILE.stalledThresholdDays,
          riskWeightAmount: DEFAULT_USER_PROFILE.riskWeightAmount,
          riskWeightStage: DEFAULT_USER_PROFILE.riskWeightStage,
          riskWeightInactivity: DEFAULT_USER_PROFILE.riskWeightInactivity,
          riskWeightNotes: DEFAULT_USER_PROFILE.riskWeightNotes,
          highValueThreshold: DEFAULT_USER_PROFILE.highValueThreshold,
          riskyStages: DEFAULT_USER_PROFILE.riskyStages,
          riskKeywords: DEFAULT_USER_PROFILE.riskKeywords,
        };

        const insertData: TablesInsert<"risk_settings"> = {
          user_id: user.id,
          max_deal_amount: DEFAULT_USER_PROFILE.highValueThreshold,
          risk_tolerance: "medium",
          alert_threshold: 80,
          settings: defaultSettings,
        };

        const { data: newData, error: insertError } = await supabase
          .from("risk_settings")
          .insert(insertData)
          .select()
          .single();

        if (insertError) throw insertError;
        
        setRiskSettings({
          ...newData,
          parsedSettings: defaultSettings,
        });
      } else {
        // Parse the settings JSON
        const parsedSettings = data.settings as Partial<UserProfile> | null;
        setRiskSettings({
          ...data,
          parsedSettings: parsedSettings || undefined,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading settings";
      setError(message);
      console.error("useRiskSettings: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchRiskSettings();
  }, [fetchRiskSettings]);

  const updateRiskSettings = async (input: UpdateRiskSettingsInput): Promise<RiskSettings | null> => {
    // Block in demo mode
    if (isDemo) {
      toast({
        variant: "destructive",
        title: "Demo mode",
        description: "Sign in to save your risk settings"
      });
      return null;
    }

    if (!user || !riskSettings) return null;

    try {
      const { data, error: updateError } = await supabase
        .from("risk_settings")
        .update(input)
        .eq("id", riskSettings.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const parsedSettings = data.settings as Partial<UserProfile> | null;
      setRiskSettings({
        ...data,
        parsedSettings: parsedSettings || undefined,
      });
      toast({ title: "Settings updated" });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error updating settings";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("useRiskSettings: update error", err);
      return null;
    }
  };

  /**
   * Saves user profile preferences to the risk_settings table in the database.
   * This function persists Risk Engine configuration settings including risk weights,
   * thresholds, risky stages, and risk keywords.
   *
   * @param profilePrefs - Partial user profile object containing settings to save
   * @param profilePrefs.stalledThresholdDays - Number of days before a deal is considered stalled
   * @param profilePrefs.riskWeightAmount - Weight factor for deal amount in risk calculation
   * @param profilePrefs.riskWeightStage - Weight factor for deal stage in risk calculation
   * @param profilePrefs.riskWeightInactivity - Weight factor for inactivity in risk calculation
   * @param profilePrefs.riskWeightNotes - Weight factor for notes/keywords in risk calculation
   * @param profilePrefs.highValueThreshold - Threshold amount for high-value deals
   * @param profilePrefs.riskyStages - Array of stage names considered risky
   * @param profilePrefs.riskKeywords - Array of keywords indicating risk in deal notes
   *
   * @returns Promise<boolean> - Returns true if save was successful, false otherwise
   *
   * @example
   * ```typescript
   * const success = await saveProfilePreferences({
   *   stalledThresholdDays: 30,
   *   riskWeightAmount: 0.3,
   *   riskWeightStage: 0.25,
   *   highValueThreshold: 50000,
   *   riskyStages: ['Negotiation', 'Proposal Sent']
   * });
   * ```
   *
   * @remarks
   * - Blocked in demo mode - shows toast notification and returns false
   * - Updates both the `settings` JSON field and `max_deal_amount` column
   * - Shows success toast notification on completion
   * - Shows error toast notification on failure
   * - Updates local state with the saved settings
   * - **Performance**: Logs warning if called more than once per second
   * - **Best Practice**: Implement debouncing in UI components that call this function
   *   to prevent excessive database writes (e.g., on slider changes)
   */
  const saveProfilePreferences = async (profilePrefs: Partial<UserProfile>): Promise<boolean> => {
    if (isDemo) {
      toast({
        variant: "destructive",
        title: "Demo mode",
        description: "Sign in to save your preferences"
      });
      return false;
    }

    if (!user || !riskSettings) return false;

    // Performance monitoring: Warn if saving too frequently
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTime.current;
    if (lastSaveTime.current > 0 && timeSinceLastSave < 1000) {
      console.warn(
        `[useRiskSettings] Settings saved ${timeSinceLastSave}ms after previous save. ` +
        `Consider implementing debouncing to reduce database load.`
      );
    }
    lastSaveTime.current = now;

    const settingsToSave = {
      stalledThresholdDays: profilePrefs.stalledThresholdDays,
      riskWeightAmount: profilePrefs.riskWeightAmount,
      riskWeightStage: profilePrefs.riskWeightStage,
      riskWeightInactivity: profilePrefs.riskWeightInactivity,
      riskWeightNotes: profilePrefs.riskWeightNotes,
      highValueThreshold: profilePrefs.highValueThreshold,
      riskyStages: profilePrefs.riskyStages,
      riskKeywords: profilePrefs.riskKeywords,
    };

    try {
      const { data, error: updateError } = await supabase
        .from("risk_settings")
        .update({
          settings: settingsToSave,
          max_deal_amount: profilePrefs.highValueThreshold,
        })
        .eq("id", riskSettings.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setRiskSettings({
        ...data,
        parsedSettings: settingsToSave,
      });
      toast({ title: "Preferences saved" });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error saving preferences";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("useRiskSettings: save preferences error", err);
      return false;
    }
  };

  return {
    riskSettings,
    loading,
    error,
    isDemo,
    refetch: fetchRiskSettings,
    updateRiskSettings,
    saveProfilePreferences,
  };
}
