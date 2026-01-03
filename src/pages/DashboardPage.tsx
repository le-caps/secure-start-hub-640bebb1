import { useState } from "react";
import { useDeals, type Deal } from "@/hooks/useDeals";
import { useDemo } from "@/hooks/useDemo";
import { DemoGateModal } from "@/components/DemoGateModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { DEAL_STAGES, getRiskLevel } from "@/data/mockData";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function DealCard({ deal }: { deal: Deal }) {
  const metadata = deal.metadata as Record<string, unknown> | null;
  const riskScore = (metadata?.riskScore as number) ?? 50;
  const riskLevel = getRiskLevel(riskScore);
  const stage = DEAL_STAGES[deal.stage as keyof typeof DEAL_STAGES] ?? DEAL_STAGES.new;

  return (
    <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{deal.name}</h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {(metadata?.company as string) ?? "—"}
            </p>
          </div>
          <Badge className={`${stage.color} text-white ml-3 shrink-0`}>
            {stage.label}
          </Badge>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-xl font-bold tracking-tight">
            {formatCurrency(deal.amount)}
          </span>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${riskLevel.color}`}>
            <AlertTriangle className="h-4 w-4" />
            <span>{riskScore}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { deals, loading, isDemo } = useDeals();
  const { requireAuth } = useDemo();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoAction, setDemoAction] = useState<string>("");

  const handleCreateDeal = () => {
    if (requireAuth("Créer un deal")) {
      setDemoAction("Créer un deal");
      setShowDemoModal(true);
      return;
    }
    // TODO: Navigate to create deal
  };

  // Calculate stats
  const totalValue = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const activeDeals = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage ?? ""));
  const wonDeals = deals.filter(d => d.stage === "closed_won");
  const avgRisk = deals.length > 0 
    ? Math.round(deals.reduce((sum, d) => {
        const meta = d.metadata as Record<string, unknown> | null;
        return sum + ((meta?.riskScore as number) ?? 50);
      }, 0) / deals.length)
    : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Vue d'ensemble de vos deals et performances
          </p>
        </div>
        <Button onClick={handleCreateDeal} className="gap-2" size="lg">
          <Plus className="h-4 w-4" />
          Nouveau Deal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold tracking-tight">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {deals.length} deals au total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deals Actifs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold tracking-tight">{activeDeals.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  En cours de négociation
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deals Gagnés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500/70" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight">{wonDeals.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ce trimestre
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risque Moyen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className={`text-2xl font-bold tracking-tight ${getRiskLevel(avgRisk).color}`}>
                  {avgRisk}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur tous vos deals
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <div>
        <h2 className="text-xl font-semibold mb-5 tracking-tight">Deals récents</h2>
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-6 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-1">Aucun deal</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                Commencez par créer votre premier deal
              </p>
              <Button onClick={handleCreateDeal} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Deal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {deals.slice(0, 6).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>

      <DemoGateModal 
        open={showDemoModal} 
        onOpenChange={setShowDemoModal}
        action={demoAction}
      />
    </div>
  );
}
