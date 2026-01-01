import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { UserProfile } from "@/types";
import { DEFAULT_USER_PROFILE } from "@/constants";

export type Profile = Tables<"profiles">;

export function useProfile() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo mode: no session = use default profile
  const isDemo = !session;

  const fetchProfile = useCallback(async () => {
    // Demo mode: return default profile immediately
    if (isDemo || !user) {
      setProfile(DEFAULT_USER_PROFILE);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Merge DB profile with default values for fields not in DB
        setProfile({
          ...DEFAULT_USER_PROFILE,
          name: data.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: data.email || user.email || '',
        });
      } else {
        // No profile exists yet, use auth data
        setProfile({
          ...DEFAULT_USER_PROFILE,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading profile";
      setError(message);
      console.error("useProfile: fetch error", err);
      // Fallback to auth user data on error
      setProfile({
        ...DEFAULT_USER_PROFILE,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
      });
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (isDemo) {
      toast({
        variant: "destructive",
        title: "Demo Mode",
        description: "Sign in to update your profile",
      });
      return false;
    }

    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: updates.name || profile.name,
          email: updates.email || profile.email,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, ...updates }));
      toast({ title: "Profile updated" });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error updating profile";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("useProfile: update error", err);
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    isDemo,
    refetch: fetchProfile,
    updateProfile,
    setProfile, // For local updates that don't need DB sync
  };
}
