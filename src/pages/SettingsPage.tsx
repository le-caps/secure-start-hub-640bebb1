import { useState, useEffect } from "react";
import { useAgentPreferences } from "@/hooks/useAgentPreferences";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useHubspot } from "@/hooks/useHubspot";
import { useDeals } from "@/hooks/useDeals";
import { DemoGateModal } from "@/components/DemoGateModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  Save,
  Bell,
  Globe,
  Link2,
  LogOut,
  User,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsPage() {
  const { preferences, loading, updatePreferences, isDemo } = useAgentPreferences();
  const { user, signOut } = useAuth();
  const { requireAuth } = useDemo();
  const { refetch: refetchDeals } = useDeals();
  const hubspot = useHubspot(refetchDeals);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Local state
  const [notificationEmail, setNotificationEmail] = useState(preferences?.notification_email ?? true);
  const [notificationPush, setNotificationPush] = useState(preferences?.notification_push ?? false);
  const [language, setLanguage] = useState(preferences?.language ?? "fr");
  const [timezone, setTimezone] = useState(preferences?.timezone ?? "Europe/Paris");

  // Sync state when preferences load
  useEffect(() => {
    if (preferences) {
      setNotificationEmail(preferences.notification_email ?? true);
      setNotificationPush(preferences.notification_push ?? false);
      setLanguage(preferences.language ?? "fr");
      setTimezone(preferences.timezone ?? "Europe/Paris");
    }
  }, [preferences]);

  const handleSave = async () => {
    if (requireAuth("Sauvegarder les préférences")) {
      setShowDemoModal(true);
      return;
    }
    await updatePreferences({
      notification_email: notificationEmail,
      notification_push: notificationPush,
      language,
      timezone,
    });
  };

  const handleConnectHubspot = () => {
    if (requireAuth("Connexion HubSpot")) {
      setShowDemoModal(true);
      return;
    }
    hubspot.connect();
  };

  const handleDisconnectHubspot = () => {
    if (requireAuth("Déconnexion HubSpot")) {
      setShowDemoModal(true);
      return;
    }
    hubspot.disconnect();
  };

  const handleSyncHubspot = () => {
    if (requireAuth("Synchronisation HubSpot")) {
      setShowDemoModal(true);
      return;
    }
    hubspot.sync();
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return "Jamais";
    const date = new Date(lastSync);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et intégrations
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
          <CardDescription>
            Informations de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDemo ? (
            <div className="text-muted-foreground">
              Connectez-vous pour voir vos informations de profil
            </div>
          ) : (
            <>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configurez comment vous recevez les alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des alertes par email
                  </p>
                </div>
                <Switch
                  checked={notificationEmail}
                  onCheckedChange={setNotificationEmail}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications push</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications dans votre navigateur
                  </p>
                </div>
                <Switch
                  checked={notificationPush}
                  onCheckedChange={setNotificationPush}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Préférences
          </CardTitle>
          <CardDescription>
            Langue et fuseau horaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Langue</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuseau horaire</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                    <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles (UTC-8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Integrations - HubSpot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Intégrations
          </CardTitle>
          <CardDescription>
            Connectez vos outils externes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-orange-500/10 flex items-center justify-center">
                  <span className="text-orange-500 font-bold">H</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">HubSpot</p>
                    {hubspot.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : hubspot.connected ? (
                      hubspot.expired ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expiré
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connecté
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        Déconnecté
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Synchronisez vos deals automatiquement
                  </p>
                </div>
              </div>
            </div>

            {hubspot.connected && !hubspot.loading && (
              <div className="text-sm text-muted-foreground border-t pt-3 mt-3">
                <p>Dernière synchronisation : {formatLastSync(hubspot.lastSync)}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {hubspot.loading ? (
                <Skeleton className="h-9 w-24" />
              ) : hubspot.connected ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSyncHubspot}
                    disabled={hubspot.syncing}
                  >
                    {hubspot.syncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {hubspot.syncing ? "Synchronisation..." : "Synchroniser"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleConnectHubspot}
                  >
                    Reconnecter
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDisconnectHubspot}
                    className="text-destructive hover:text-destructive"
                  >
                    Déconnecter
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleConnectHubspot}>
                  Connecter HubSpot
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" />
        Sauvegarder les préférences
      </Button>

      <DemoGateModal 
        open={showDemoModal} 
        onOpenChange={setShowDemoModal}
        action="Sauvegarder les préférences"
      />
    </div>
  );
}
