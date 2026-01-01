import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface HubspotStatus {
  connected: boolean;
  expired?: boolean;
  lastSync?: string;
  scope?: string;
}

export function useHubspot() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<HubspotStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!session) {
      setStatus({ connected: false });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("hubspot-status");
      
      // Even if there's an error, default to not connected
      if (error) {
        console.error("[useHubspot] Status check error:", error);
        setStatus({ connected: false });
      } else {
        setStatus(data || { connected: false });
      }
    } catch (err) {
      console.error("[useHubspot] Status check failed:", err);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const connect = async () => {
    if (!session) {
      toast({ variant: "destructive", title: "Please sign in first" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("hubspot-auth");
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("No auth URL received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start HubSpot connection";
      toast({ variant: "destructive", title: "Error", description: message });
    }
  };

  const disconnect = async () => {
    if (!session) return;

    const confirmed = window.confirm("Disconnect HubSpot? Your synced deals will remain but won't update.");
    if (!confirmed) return;

    try {
      const { error } = await supabase.functions.invoke("hubspot-disconnect");
      
      if (error) throw error;
      
      setStatus({ connected: false });
      toast({ title: "HubSpot disconnected" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect";
      toast({ variant: "destructive", title: "Error", description: message });
    }
  };

  const sync = async () => {
    if (!session || !status.connected) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("hubspot-sync");
      
      if (error) throw error;
      
      toast({ 
        title: "Sync complete", 
        description: `Synced ${data.synced} deals from HubSpot` 
      });
      
      // Refresh status
      await checkStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setSyncing(false);
    }
  };

  return {
    ...status,
    loading,
    syncing,
    connect,
    disconnect,
    sync,
    refresh: checkStatus,
  };
}
