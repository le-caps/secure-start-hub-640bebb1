import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AgentPreferences = Tables<"agent_preferences">;
export type UpdateAgentPreferencesInput = TablesUpdate<"agent_preferences">;

export function useAgentPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<AgentPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("agent_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        // Create default preferences if none exist
        const insertData: TablesInsert<"agent_preferences"> = {
          user_id: user.id,
          notification_email: true,
          notification_push: false,
          language: "fr",
          timezone: "Europe/Paris",
          preferences: null,
        };

        const { data: newData, error: insertError } = await supabase
          .from("agent_preferences")
          .insert(insertData)
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData);
      } else {
        setPreferences(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur chargement préférences";
      setError(message);
      console.error("useAgentPreferences: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (input: UpdateAgentPreferencesInput): Promise<AgentPreferences | null> => {
    if (!user || !preferences) return null;

    try {
      const { data, error: updateError } = await supabase
        .from("agent_preferences")
        .update(input)
        .eq("id", preferences.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setPreferences(data);
      toast({ title: "Préférences mises à jour" });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur mise à jour";
      toast({ variant: "destructive", title: "Erreur", description: message });
      console.error("useAgentPreferences: update error", err);
      return null;
    }
  };

  return {
    preferences,
    loading,
    error,
    refetch: fetchPreferences,
    updatePreferences,
  };
}
