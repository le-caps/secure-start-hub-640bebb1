import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";

interface DemoGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

export function DemoGateModal({ open, onOpenChange, action }: DemoGateModalProps) {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onOpenChange(false);
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Connectez-vous pour continuer
          </DialogTitle>
          <DialogDescription className="text-center">
            {action ? (
              <>
                L'action <span className="font-medium">"{action}"</span> nécessite un compte.
              </>
            ) : (
              "Cette fonctionnalité nécessite un compte pour sauvegarder vos données."
            )}
            <br />
            <span className="text-muted-foreground">
              Créez un compte gratuit pour synchroniser et persister vos données.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleSignIn} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Se connecter / S'inscrire
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Continuer en mode démo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
