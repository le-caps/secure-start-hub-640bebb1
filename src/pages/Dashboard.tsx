import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  LogOut, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  Database,
  Lock
} from "lucide-react";

interface WhoamiResponse {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    created_at: string;
  };
  profile: {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    updated_at: string;
  } | null;
  roles: string[];
  stats: {
    deals_count: number;
  };
  security: {
    rls_isolation_verified: boolean;
    message: string;
  };
  timestamp: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [whoamiData, setWhoamiData] = useState<WhoamiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWhoami = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("No active session");
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke("whoami", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) {
        setError(fnError.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: fnError.message,
        });
      } else {
        setWhoamiData(data);
        toast({
          title: "Test successful",
          description: "Security verification completed",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-test on mount
    testWhoami();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard Sécurisé</h1>
              <p className="text-muted-foreground text-sm">
                Environnement protégé par RLS
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Utilisateur connecté
            </CardTitle>
            <CardDescription>
              Informations de votre session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Utilisateur</p>
                <p className="font-mono text-sm truncate">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Test Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Test de sécurité RLS
                </CardTitle>
                <CardDescription>
                  Vérification que vous ne pouvez pas accéder aux données d'autres utilisateurs
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testWhoami}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !whoamiData && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm mt-2">{error}</p>
              </div>
            )}

            {whoamiData && (
              <div className="space-y-4">
                {/* Security Status */}
                <div className={`rounded-lg p-4 ${
                  whoamiData.security.rls_isolation_verified 
                    ? "bg-green-500/10 border border-green-500/20" 
                    : "bg-destructive/10 border border-destructive/20"
                }`}>
                  <div className="flex items-center gap-2">
                    {whoamiData.security.rls_isolation_verified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {whoamiData.security.rls_isolation_verified 
                        ? "Isolation RLS vérifiée" 
                        : "Problème de sécurité détecté"}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    {whoamiData.security.message}
                  </p>
                </div>

                {/* Profile Info */}
                {whoamiData.profile && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Nom</p>
                      <p className="font-medium">
                        {whoamiData.profile.full_name || "Non défini"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rôles</p>
                      <div className="flex gap-2 mt-1">
                        {whoamiData.roles.length > 0 ? (
                          whoamiData.roles.map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">Aucun rôle</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {whoamiData.stats.deals_count} deals
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Testé à {new Date(whoamiData.timestamp).toLocaleTimeString("fr-FR")}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Architecture sécurisée</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ RLS activé sur 100% des tables</li>
                  <li>✅ Policies explicites par opération (SELECT/INSERT/UPDATE/DELETE)</li>
                  <li>✅ Isolation stricte par utilisateur via auth.uid()</li>
                  <li>✅ Tokens HubSpot accessibles uniquement côté serveur</li>
                  <li>✅ Edge Functions avec vérification Authorization</li>
                  <li>✅ Confirmation email activée</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
