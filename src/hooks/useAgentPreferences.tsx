import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { MOCK_AGENT_PREFERENCES } from "@/data/mockData";

export type AgentPreferences = Tables<"agent_preferences">;
export type UpdateAgentPreferencesInput = TablesUpdate<"agent_preferences">;

export function useAgentPreferences() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<AgentPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo mode: no session = use mock data
  const isDemo = !session;

  const fetchPreferences = useCallback(async () => {
    // Demo mode: return mock data immediately
    if (isDemo) {
      setPreferences(MOCK_AGENT_PREFERENCES);
      setLoading(false);
      return;
    }

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
      const message = err instanceof Error ? err.message : "Error loading preferences";
      setError(message);
      console.error("useAgentPreferences: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (input: UpdateAgentPreferencesInput): Promise<AgentPreferences | null> => {
    // Block in demo mode
    if (isDemo) {
      toast({
        variant: "destructive",
        title: "Demo mode",
        description: "Sign in to save your preferences"
      });
      return null;
    }

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
      toast({ title: "Preferences updated" });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error updating preferences";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("useAgentPreferences: update error", err);
      return null;
    }
  };

  return {
    preferences,
    loading,
    error,
    isDemo,
    refetch: fetchPreferences,
    updatePreferences,
  };
}
