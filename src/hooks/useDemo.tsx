import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./useAuth";

interface DemoContextType {
  isDemo: boolean;
  requireAuth: (action: string) => boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  
  // Demo mode is active when there's no session
  const isDemo = !session;

  // Returns true if auth is required (i.e., in demo mode)
  // Use this to gate persistent actions
  const requireAuth = (action: string): boolean => {
    if (isDemo) {
      console.log(`[Demo Mode] Action blocked: ${action}`);
      return true;
    }
    return false;
  };

  return (
    <DemoContext.Provider value={{ isDemo, requireAuth }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
