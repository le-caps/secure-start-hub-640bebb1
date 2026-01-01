import { useState } from "react";
import { useRiskSettings } from "@/hooks/useRiskSettings";
import { useDeals } from "@/hooks/useDeals";
import { useDemo } from "@/hooks/useDemo";
import { DemoGateModal } from "@/components/DemoGateModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Shield,
  Save,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { getRiskLevel, DEAL_STAGES } from "@/data/mockData";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RiskEnginePage() {
  const { riskSettings, loading: settingsLoading, updateRiskSettings, isDemo } = useRiskSettings();
  const { deals, loading: dealsLoading } = useDeals();
  const { requireAuth } = useDemo();
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Local state for sliders
  const [maxAmount, setMaxAmount] = useState<number>(riskSettings?.max_deal_amount ?? 100000);
  const [alertThreshold, setAlertThreshold] = useState<number>(riskSettings?.alert_threshold ?? 80);

  // Sync local state when settings load
  useState(() => {
    if (riskSettings) {
      setMaxAmount(riskSettings.max_deal_amount ?? 100000);
      setAlertThreshold(riskSettings.alert_threshold ?? 80);
    }
  });

  const handleSave = async () => {
    if (requireAuth("Sauvegarder les paramètres de risque")) {
      setShowDemoModal(true);
      return;
    }
    await updateRiskSettings({
      max_deal_amount: maxAmount,
      alert_threshold: alertThreshold,
    });
  };

  // Calculate risk stats from deals
  const dealsWithRisk = deals.map((deal) => {
    const metadata = deal.metadata as Record<string, unknown> | null;
    return {
      ...deal,
      riskScore: (metadata?.riskScore as number) ?? 50,
    };
  });

  const highRiskDeals = dealsWithRisk.filter((d) => d.riskScore >= 70);
  const mediumRiskDeals = dealsWithRisk.filter((d) => d.riskScore >= 40 && d.riskScore < 70);
  const lowRiskDeals = dealsWithRisk.filter((d) => d.riskScore < 40);

  const loading = settingsLoading || dealsLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Risk Engine
          </h1>
          <p className="text-muted-foreground">
            Analysez et configurez vos paramètres de risque
          </p>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              Risque Élevé
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{highRiskDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(highRiskDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0))} en jeu
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-yellow-500" />
              Risque Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">{mediumRiskDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(mediumRiskDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0))} en jeu
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              Risque Faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{lowRiskDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(lowRiskDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0))} en jeu
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de risque</CardTitle>
          <CardDescription>
            Configurez vos seuils et alertes de risque
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Montant max par deal</Label>
                  <span className="text-lg font-semibold">
                    {formatCurrency(maxAmount)}
                  </span>
                </div>
                <Slider
                  value={[maxAmount]}
                  onValueChange={([value]) => setMaxAmount(value)}
                  min={10000}
                  max={500000}
                  step={10000}
                />
                <p className="text-sm text-muted-foreground">
                  Les deals dépassant ce montant seront signalés comme à risque
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Seuil d'alerte risque</Label>
                  <span className={`text-lg font-semibold ${getRiskLevel(alertThreshold).color}`}>
                    {alertThreshold}%
                  </span>
                </div>
                <Slider
                  value={[alertThreshold]}
                  onValueChange={([value]) => setAlertThreshold(value)}
                  min={50}
                  max={100}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Recevez des alertes pour les deals dépassant ce seuil de risque
                </p>
              </div>

              <Button onClick={handleSave} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* High Risk Deals List */}
      {highRiskDeals.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Deals à surveiller
            </CardTitle>
            <CardDescription>
              Ces deals nécessitent une attention particulière
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskDeals.map((deal) => {
                const stage = DEAL_STAGES[deal.stage as keyof typeof DEAL_STAGES] ?? DEAL_STAGES.new;
                return (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{deal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(deal.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${stage.color} text-white`}>
                        {stage.label}
                      </Badge>
                      <span className="text-red-600 font-semibold">
                        {deal.riskScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <DemoGateModal 
        open={showDemoModal} 
        onOpenChange={setShowDemoModal}
        action="Sauvegarder les paramètres de risque"
      />
    </div>
  );
}
