import { useDeals } from "@/hooks/useDeals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { DEAL_STAGES, getRiskLevel } from "@/data/mockData";

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

  // Calculate insights from deals
  const totalPipeline = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const avgDealSize = deals.length > 0 ? totalPipeline / deals.length : 0;
  
  const dealsByStage = deals.reduce((acc, deal) => {
    const stage = deal.stage ?? "new";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dealsWithRisk = deals.map((deal) => {
    const metadata = deal.metadata as Record<string, unknown> | null;
    return {
      ...deal,
      riskScore: (metadata?.riskScore as number) ?? 50,
    };
  });

  const highRiskCount = dealsWithRisk.filter((d) => d.riskScore >= 70).length;
  const wonDeals = deals.filter((d) => d.stage === "closed_won");
  const lostDeals = deals.filter((d) => d.stage === "closed_lost");
  const winRate = wonDeals.length + lostDeals.length > 0 
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
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

  if (dealsByStage["negotiation"] > 2) {
    insights.push({
      id: "negotiation",
      type: "info",
      title: "Deals en négociation active",
      description: `${dealsByStage["negotiation"]} deals sont en phase finale de négociation.`,
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
      description: "Ajoutez vos premières opportunités pour obtenir des insights personnalisés.",
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
            <CardTitle className="text-sm font-medium">Pipeline Total</CardTitle>
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
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className={`text-2xl font-bold ${winRate >= 50 ? "text-green-600" : "text-amber-600"}`}>
                {winRate}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deals actifs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage ?? "")).length}
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

      {/* Stage Distribution */}
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
          ) : (
            <div className="space-y-3">
              {Object.entries(DEAL_STAGES).map(([key, stage]) => {
                const count = dealsByStage[key] || 0;
                const percentage = deals.length > 0 ? Math.round((count / deals.length) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <Badge className={`${stage.color} text-white min-w-[100px] justify-center`}>
                      {stage.label}
                    </Badge>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stage.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[40px] text-right">
                      {count}
                    </span>
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
