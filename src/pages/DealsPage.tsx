import { useState } from "react";
import { useDeals, type Deal } from "@/hooks/useDeals";
import { useDemo } from "@/hooks/useDemo";
import { DemoGateModal } from "@/components/DemoGateModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus,
  Search,
  AlertTriangle,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRiskLevel } from "@/data/mockData";
import { getStageInfo, calculateDaysBetween } from "@/lib/stageFormatter";

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DealRowProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

function DealRow({ deal, onEdit, onDelete }: DealRowProps) {
  const metadata = deal.metadata as Record<string, unknown> | null;
  const riskScore = (metadata?.riskScore as number) ?? 50;
  const riskLevel = getRiskLevel(riskScore);
  const stageInfo = getStageInfo(deal.stage);
  
  // Get HubSpot data from metadata
  const company = (metadata?.company as string) ?? "—";
  const contact = (metadata?.contact as string) ?? "—";
  const nextStep = (metadata?.nextStep as string) ?? null;
  const daysInStage = (metadata?.daysInStage as number) ?? calculateDaysBetween(deal.created_at);
  const daysInactive = (metadata?.daysInactive as number) ?? calculateDaysBetween(deal.updated_at);

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4">
        <div>
          <p className="font-medium">{deal.name}</p>
          <p className="text-sm text-muted-foreground">{company}</p>
          {contact !== "—" && (
            <p className="text-xs text-muted-foreground">{contact}</p>
          )}
        </div>
      </td>
      <td className="p-4 text-right font-medium">
        {formatCurrency(deal.amount)}
      </td>
      <td className="p-4">
        <Badge className={`${stageInfo.color} text-white`}>
          {stageInfo.label}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{daysInStage}j</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className={daysInactive > 7 ? "text-amber-600" : "text-muted-foreground"}>
            {daysInactive}j
          </span>
        </div>
      </td>
      <td className="p-4">
        {nextStep ? (
          <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
            {nextStep}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="p-4">
        <div className={`flex items-center gap-1 ${riskLevel.color}`}>
          <AlertTriangle className="h-4 w-4" />
          <span>{riskScore}%</span>
        </div>
      </td>
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(deal)}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(deal)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export function DealsPage() {
  const { deals, loading, isDemo, deleteDeal } = useDeals();
  const { requireAuth } = useDemo();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoAction, setDemoAction] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateDeal = () => {
    if (requireAuth("Créer un deal")) {
      setDemoAction("Créer un deal");
      setShowDemoModal(true);
      return;
    }
    // TODO: Open create deal modal
  };

  const handleEditDeal = (deal: Deal) => {
    if (requireAuth("Modifier un deal")) {
      setDemoAction("Modifier un deal");
      setShowDemoModal(true);
      return;
    }
    // TODO: Open edit deal modal
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (requireAuth("Supprimer un deal")) {
      setDemoAction("Supprimer un deal");
      setShowDemoModal(true);
      return;
    }
    await deleteDeal(deal.id);
  };

  const filteredDeals = deals.filter((deal) => {
    const metadata = deal.metadata as Record<string, unknown> | null;
    const company = (metadata?.company as string) ?? "";
    const contact = (metadata?.contact as string) ?? "";
    const query = searchQuery.toLowerCase();
    
    return (
      deal.name.toLowerCase().includes(query) ||
      company.toLowerCase().includes(query) ||
      contact.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-muted-foreground">
            Gérez et suivez vos opportunités commerciales
          </p>
        </div>
        <Button onClick={handleCreateDeal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Deal
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un deal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Deals Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 flex-1" />
                </div>
              ))}
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">
                {searchQuery ? "Aucun résultat" : "Aucun deal"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Essayez avec d'autres termes de recherche"
                  : "Commencez par créer votre premier deal"
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateDeal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Deal
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Deal
                    </th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                      Montant
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Stage
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      En stage
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Inactivité
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Next Step
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                      Risque
                    </th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <DealRow
                      key={deal.id}
                      deal={deal}
                      onEdit={handleEditDeal}
                      onDelete={handleDeleteDeal}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DemoGateModal 
        open={showDemoModal} 
        onOpenChange={setShowDemoModal}
        action={demoAction}
      />
    </div>
  );
}
