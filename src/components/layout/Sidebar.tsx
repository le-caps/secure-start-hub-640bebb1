import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FileText,
  Shield,
  Lightbulb,
  Bot,
  Settings,
  LogOut,
  LogIn,
  FlaskConical,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/deals", icon: FileText, label: "Deals" },
  { to: "/risk-engine", icon: Shield, label: "Risk Engine" },
  { to: "/insights", icon: Lightbulb, label: "Insights" },
  { to: "/agent", icon: Bot, label: "AI Agent" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { isDemo } = useDemo();
  const navigate = useNavigate();

  const handleAuthAction = async () => {
    if (user) {
      await signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar">
      {/* Logo / Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          D
        </div>
        <span className="text-lg font-semibold">Drift</span>
        {isDemo && (
          <Badge 
            variant="outline" 
            className="ml-auto bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs"
          >
            <FlaskConical className="h-3 w-3 mr-1" />
            Demo
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAuthAction}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleAuthAction}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
    </aside>
  );
}
