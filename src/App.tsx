import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoProvider } from "@/hooks/useDemo";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import { DashboardPage } from "./pages/DashboardPage";
import { DealsPage } from "./pages/DealsPage";
import { RiskEnginePage } from "./pages/RiskEnginePage";
import { InsightsPage } from "./pages/InsightsPage";
import { AgentPage } from "./pages/AgentPage";
import { SettingsPage } from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                }
              />
              <Route
                path="/deals"
                element={
                  <AppLayout>
                    <DealsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/risk-engine"
                element={
                  <AppLayout>
                    <RiskEnginePage />
                  </AppLayout>
                }
              />
              <Route
                path="/insights"
                element={
                  <AppLayout>
                    <InsightsPage />
                  </AppLayout>
                }
              />
              <Route
                path="/agent"
                element={
                  <AppLayout>
                    <AgentPage />
                  </AppLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DemoProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
