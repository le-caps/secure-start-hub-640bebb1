import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield,
  Save,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Calendar,
} from "lucide-react";
import { getRiskLevel } from "@/data/mockData";
import { getStageInfo } from "@/lib/stageFormatter";

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
  const [maxAmount, setMaxAmount] = useState<number>(100000);
  const [alertThreshold, setAlertThreshold] = useState<number>(80);
  const [riskyStages, setRiskyStages] = useState<string[]>([]);

  // Sync local state when settings load
  useEffect(() => {
    if (riskSettings) {
      setMaxAmount(riskSettings.max_deal_amount ?? 100000);
      setAlertThreshold(riskSettings.alert_threshold ?? 80);
      const settings = riskSettings.settings as Record<string, unknown> | null;
      setRiskyStages((settings?.riskyStages as string[]) ?? []);
    }
  }, [riskSettings]);

  const handleSave = async () => {
    if (requireAuth("Save risk settings")) {
      setShowDemoModal(true);
      return;
    }
    await updateRiskSettings({
      max_deal_amount: maxAmount,
      alert_threshold: alertThreshold,
      settings: {
        ...((riskSettings?.settings as Record<string, unknown>) ?? {}),
        riskyStages,
      },
    });
  };

  // Extract unique stages from user's deals
  const uniqueStages = [...new Set(deals.map((d) => d.stage).filter(Boolean))] as string[];

  // Calculate risk stats from deals
  const dealsWithRisk = deals.map((deal) => {
    const metadata = deal.metadata as Record<string, unknown> | null;
    const riskScore = (metadata?.riskScore as number) ?? 50;
    const daysInStage = (metadata?.daysInStage as number) ?? 0;
    const daysInactive = (metadata?.daysInactive as number) ?? 0;
    
    // Recalculate risk if stage is in risky stages
    let adjustedRiskScore = riskScore;
    if (riskyStages.includes(deal.stage ?? "")) {
      adjustedRiskScore = Math.min(riskScore + 20, 100);
    }
    
    return {
      ...deal,
      riskScore: adjustedRiskScore,
      daysInStage,
      daysInactive,
    };
  });

  const highRiskDeals = dealsWithRisk.filter((d) => d.riskScore >= 70);
  const mediumRiskDeals = dealsWithRisk.filter((d) => d.riskScore >= 40 && d.riskScore < 70);
  const lowRiskDeals = dealsWithRisk.filter((d) => d.riskScore < 40);

  const loading = settingsLoading || dealsLoading;

  const toggleRiskyStage = (stage: string) => {
    setRiskyStages((prev) =>
      prev.includes(stage)
        ? prev.filter((s) => s !== stage)
        : [...prev, stage]
    );
  };

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
            Analyze and configure your risk settings
          </p>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{highRiskDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(highRiskDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0))} at stake
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-yellow-500" />
              Medium Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">{mediumRiskDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(mediumRiskDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0))} at stake
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              Low Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{lowRiskDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(lowRiskDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0))} at stake
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Settings</CardTitle>
          <CardDescription>
            Configure your risk thresholds and alerts
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
                  <Label>Max amount per deal</Label>
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
                  Deals exceeding this amount will be flagged as risky
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Risk alert threshold</Label>
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
                  Receive alerts for deals exceeding this risk threshold
                </p>
              </div>

              {/* Risky Stages based on user's HubSpot stages */}
              {uniqueStages.length > 0 && (
                <div className="space-y-4">
                  <Label>Risky stages</Label>
                  <p className="text-sm text-muted-foreground">
                    Deals in these stages will have a higher risk score
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uniqueStages.map((stage) => {
                      const stageInfo = getStageInfo(stage);
                      const isChecked = riskyStages.includes(stage);
                      return (
                        <label
                          key={stage}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isChecked 
                              ? "border-red-500/50 bg-red-500/10" 
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleRiskyStage(stage)}
                          />
                          <Badge className={`${stageInfo.color} text-white`}>
                            {stageInfo.label}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button onClick={handleSave} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Save
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
              Deals to Watch
            </CardTitle>
            <CardDescription>
              These deals require special attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskDeals.map((deal) => {
                const stageInfo = getStageInfo(deal.stage);
                const metadata = deal.metadata as Record<string, unknown> | null;
                const company = (metadata?.company as string) ?? null;
                
                return (
                  <div 
                    key={deal.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{deal.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {company && <span>{company}</span>}
                        <span>{formatCurrency(deal.amount)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{deal.daysInStage}d in stage</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{deal.daysInactive}d inactive</span>
                      </div>
                      <Badge className={`${stageInfo.color} text-white`}>
                        {stageInfo.label}
                      </Badge>
                      <span className="text-red-600 font-semibold min-w-[40px] text-right">
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
        action="Save risk settings"
      />
    </div>
  );
}
