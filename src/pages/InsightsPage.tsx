import { useDeals } from "@/hooks/useDeals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { getStageInfo } from "@/lib/stageFormatter";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Insight {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  description: string;
  value?: string;
}

export function InsightsPage() {
  const { deals, loading } = useDeals();

  // Extract metrics from deals with HubSpot data
  const dealsWithMetrics = deals.map((deal) => {
    const metadata = deal.metadata as Record<string, unknown> | null;
    return {
      ...deal,
      riskScore: (metadata?.riskScore as number) ?? 50,
      daysInStage: (metadata?.daysInStage as number) ?? 0,
      daysInactive: (metadata?.daysInactive as number) ?? 0,
      company: (metadata?.company as string) ?? null,
      nextStep: (metadata?.nextStep as string) ?? null,
    };
  });

  // Calculate insights from deals
  const totalPipeline = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const avgDealSize = deals.length > 0 ? totalPipeline / deals.length : 0;
  
  // Group deals by stage
  const dealsByStage = deals.reduce((acc, deal) => {
    const stage = deal.stage ?? "unknown";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate stage values
  const valueByStage = deals.reduce((acc, deal) => {
    const stage = deal.stage ?? "unknown";
    acc[stage] = (acc[stage] || 0) + (deal.amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const highRiskCount = dealsWithMetrics.filter((d) => d.riskScore >= 70).length;
  const stalledDeals = dealsWithMetrics.filter((d) => d.daysInactive > 7);
  const dealsWithoutNextStep = dealsWithMetrics.filter((d) => !d.nextStep && !["closedwon", "closedlost", "closed_won", "closed_lost"].includes((d.stage ?? "").toLowerCase().replace(/[_-]/g, "")));
  
  const wonDeals = deals.filter((d) => {
    const stage = (d.stage ?? "").toLowerCase().replace(/[_-]/g, "");
    return stage === "closedwon";
  });
  const lostDeals = deals.filter((d) => {
    const stage = (d.stage ?? "").toLowerCase().replace(/[_-]/g, "");
    return stage === "closedlost";
  });
  const winRate = wonDeals.length + lostDeals.length > 0 
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
    : 0;

  // Average days in stage
  const avgDaysInStage = dealsWithMetrics.length > 0
    ? Math.round(dealsWithMetrics.reduce((sum, d) => sum + d.daysInStage, 0) / dealsWithMetrics.length)
    : 0;

  // Generate insights
  const insights: Insight[] = [];

  if (highRiskCount > 0) {
    insights.push({
      id: "high-risk",
      type: "warning",
      title: `${highRiskCount} deal${highRiskCount > 1 ? "s" : ""} à risque élevé`,
      description: "Ces opportunités nécessitent une attention particulière pour éviter les pertes.",
    });
  }

  if (stalledDeals.length > 0) {
    const stalledValue = stalledDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
    insights.push({
      id: "stalled",
      type: "warning",
      title: `${stalledDeals.length} deal${stalledDeals.length > 1 ? "s" : ""} inactif${stalledDeals.length > 1 ? "s" : ""} (>7 jours)`,
      description: `${formatCurrency(stalledValue)} de revenus potentiels en attente de suivi.`,
      value: formatCurrency(stalledValue),
    });
  }

  if (dealsWithoutNextStep.length > 0) {
    insights.push({
      id: "no-next-step",
      type: "info",
      title: `${dealsWithoutNextStep.length} deal${dealsWithoutNextStep.length > 1 ? "s" : ""} sans prochaine étape`,
      description: "Définissez une prochaine action pour maintenir la progression.",
    });
  }

  if (winRate >= 60) {
    insights.push({
      id: "win-rate",
      type: "success",
      title: "Excellent taux de conversion",
      description: `Votre taux de réussite de ${winRate}% est supérieur à la moyenne du marché.`,
      value: `${winRate}%`,
    });
  } else if (winRate > 0 && winRate < 40) {
    insights.push({
      id: "win-rate-low",
      type: "warning",
      title: "Taux de conversion à améliorer",
      description: `Votre taux de ${winRate}% pourrait être optimisé avec un meilleur suivi.`,
      value: `${winRate}%`,
    });
  }

  if (avgDealSize > 50000) {
    insights.push({
      id: "avg-deal",
      type: "success",
      title: "Montant moyen élevé",
      description: "Vos deals ont un montant moyen supérieur à 50K€, signe d'un bon positionnement.",
      value: formatCurrency(avgDealSize),
    });
  }

  if (deals.length === 0) {
    insights.push({
      id: "no-deals",
      type: "info",
      title: "Commencez à créer des deals",
      description: "Ajoutez vos premières opportunités ou synchronisez HubSpot pour obtenir des insights personnalisés.",
    });
  }

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "info":
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type: Insight["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500/5 border-green-500/20";
      case "warning":
        return "bg-amber-500/5 border-amber-500/20";
      case "info":
        return "bg-blue-500/5 border-blue-500/20";
    }
  };

  // Get unique stages sorted by value
  const stagesSortedByValue = Object.entries(valueByStage)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6" />
          Insights
        </h1>
        <p className="text-muted-foreground">
          Analyses et recommandations basées sur vos données
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Pipeline Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taille moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(avgDealSize)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Vélocité moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {avgDaysInStage} <span className="text-sm font-normal text-muted-foreground">jours en stage</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Deals actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {deals.filter((d) => {
                  const stage = (d.stage ?? "").toLowerCase().replace(/[_-]/g, "");
                  return !["closedwon", "closedlost"].includes(stage);
                }).length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recommandations</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Pas encore d'insights</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez plus de deals pour obtenir des recommandations personnalisées
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={getInsightBg(insight.type)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{insight.title}</h3>
                        {insight.value && (
                          <span className="font-semibold">{insight.value}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Stage Distribution with real HubSpot stages */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par étape</CardTitle>
          <CardDescription>
            Distribution de vos deals dans le pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : stagesSortedByValue.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun deal à afficher
            </p>
          ) : (
            <div className="space-y-3">
              {stagesSortedByValue.map(([stage, value]) => {
                const stageInfo = getStageInfo(stage);
                const count = dealsByStage[stage] || 0;
                const percentage = totalPipeline > 0 ? Math.round((value / totalPipeline) * 100) : 0;
                
                return (
                  <div key={stage} className="flex items-center gap-4">
                    <Badge className={`${stageInfo.color} text-white min-w-[140px] justify-center`}>
                      {stageInfo.label}
                    </Badge>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stageInfo.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm min-w-[120px] text-right">
                      <span className="font-medium">{count} deals</span>
                      <span className="text-muted-foreground ml-2">
                        ({formatCurrency(value)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
