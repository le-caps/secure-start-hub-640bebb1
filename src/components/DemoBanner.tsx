import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/hooks/useDemo";
import { LogIn, FlaskConical } from "lucide-react";

export function DemoBanner() {
  const { isDemo } = useDemo();
  const navigate = useNavigate();

  if (!isDemo) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
          >
            <FlaskConical className="h-3 w-3 mr-1" />
            Mode Démo
          </Badge>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Explorez l'app avec des données fictives
          </span>
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate("/auth")}
          className="gap-2"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Se connecter</span>
        </Button>
      </div>
    </div>
  );
}
