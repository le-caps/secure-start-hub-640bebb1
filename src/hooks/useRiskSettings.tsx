import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type RiskSettings = Tables<"risk_settings">;
export type UpdateRiskSettingsInput = TablesUpdate<"risk_settings">;

export function useRiskSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskSettings = useCallback(async () => {
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
        const insertData: TablesInsert<"risk_settings"> = {
          user_id: user.id,
          max_deal_amount: 100000,
          risk_tolerance: "medium",
          alert_threshold: 80,
          settings: null,
        };

        const { data: newData, error: insertError } = await supabase
          .from("risk_settings")
          .insert(insertData)
          .select()
          .single();

        if (insertError) throw insertError;
        setRiskSettings(newData);
      } else {
        setRiskSettings(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur chargement paramètres";
      setError(message);
      console.error("useRiskSettings: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRiskSettings();
  }, [fetchRiskSettings]);

  const updateRiskSettings = async (input: UpdateRiskSettingsInput): Promise<RiskSettings | null> => {
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

      setRiskSettings(data);
      toast({ title: "Paramètres mis à jour" });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur mise à jour";
      toast({ variant: "destructive", title: "Erreur", description: message });
      console.error("useRiskSettings: update error", err);
      return null;
    }
  };

  return {
    riskSettings,
    loading,
    error,
    refetch: fetchRiskSettings,
    updateRiskSettings,
  };
}
