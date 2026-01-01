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
    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{deal.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {(metadata?.company as string) ?? "—"}
            </p>
          </div>
          <Badge className={`${stage.color} text-white`}>
            {stage.label}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {formatCurrency(deal.amount)}
          </span>
          <div className={`flex items-center gap-1 text-sm ${riskLevel.color}`}>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos deals et performances
          </p>
        </div>
        <Button onClick={handleCreateDeal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Deal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {deals.length} deals au total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deals Actifs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  En cours de négociation
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deals Gagnés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{wonDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Ce trimestre
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Risque Moyen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${getRiskLevel(avgRisk).color}`}>
                  {avgRisk}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur tous vos deals
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Deals récents</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-6 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucun deal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre premier deal
              </p>
              <Button onClick={handleCreateDeal}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Deal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
