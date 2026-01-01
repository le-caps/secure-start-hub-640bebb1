import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { MOCK_DEALS } from "@/data/mockData";

export type Deal = Tables<"deals">;
export type CreateDealInput = Omit<TablesInsert<"deals">, "user_id" | "id" | "created_at" | "updated_at">;
export type UpdateDealInput = TablesUpdate<"deals">;

export function useDeals() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo mode: no session = use mock data
  // Logged in users see their real deals (empty until HubSpot connected)
  const isDemo = !session;

  const fetchDeals = useCallback(async () => {
    // Demo mode: return mock data immediately
    if (isDemo) {
      setDeals(MOCK_DEALS);
      setLoading(false);
      return;
    }

    // Logged in: fetch from DB (will be empty until HubSpot sync)
    if (!user) {
      setDeals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("deals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setDeals(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading deals";
      setError(message);
      console.error("useDeals: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const createDeal = async (input: CreateDealInput): Promise<Deal | null> => {
    // Block in demo mode
    if (isDemo) {
      toast({ 
        variant: "destructive", 
        title: "Demo Mode", 
        description: "Sign in to create deals" 
      });
      return null;
    }

    if (!user) {
      toast({ variant: "destructive", title: "Not signed in" });
      return null;
    }

    try {
      const insertData: TablesInsert<"deals"> = {
        user_id: user.id,
        name: input.name,
        amount: input.amount ?? null,
        stage: input.stage ?? "new",
        hubspot_deal_id: input.hubspot_deal_id ?? null,
        metadata: input.metadata ?? null,
      };

      const { data, error: insertError } = await supabase
        .from("deals")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      setDeals((prev) => [data, ...prev]);
      toast({ title: "Deal created", description: input.name });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error creating deal";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("useDeals: create error", err);
      return null;
    }
  };

  const updateDeal = async (id: string, input: UpdateDealInput): Promise<Deal | null> => {
    // Block in demo mode
    if (isDemo) {
      toast({ 
        variant: "destructive", 
        title: "Demo Mode", 
        description: "Sign in to update deals" 
      });
      return null;
    }

    if (!user) return null;

    try {
      const { data, error: updateError } = await supabase
        .from("deals")
        .update(input)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setDeals((prev) => prev.map((d) => (d.id === id ? data : d)));
      toast({ title: "Deal updated" });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error updating deal";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("useDeals: update error", err);
      return null;
    }
  };

  const deleteDeal = async (id: string): Promise<boolean> => {
    // Block in demo mode
    if (isDemo) {
      toast({ 
        variant: "destructive", 
        title: "Demo Mode", 
        description: "Sign in to delete deals" 
      });
      return false;
    }

    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from("deals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setDeals((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Deal deleted" });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error deleting deal";
      toast({ variant: "destructive", title: "Error", description: message });
      console.error("useDeals: delete error", err);
      return false;
    }
  };

  return {
    deals,
    loading,
    error,
    isDemo,
    refetch: fetchDeals,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}
