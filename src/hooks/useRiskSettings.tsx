import { useState, useEffect, useCallback } from "react";
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
      const message = err instanceof Error ? err.message : "Erreur chargement paramètres";
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
        title: "Mode démo", 
        description: "Connectez-vous pour sauvegarder vos paramètres de risque" 
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
      toast({ title: "Paramètres mis à jour" });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur mise à jour";
      toast({ variant: "destructive", title: "Erreur", description: message });
      console.error("useRiskSettings: update error", err);
      return null;
    }
  };

  // Save profile preferences to risk_settings
  const saveProfilePreferences = async (profilePrefs: Partial<UserProfile>): Promise<boolean> => {
    if (isDemo) {
      toast({ 
        variant: "destructive", 
        title: "Mode démo", 
        description: "Connectez-vous pour sauvegarder vos paramètres" 
      });
      return false;
    }

    if (!user || !riskSettings) return false;

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
