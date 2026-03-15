import { BarChart3, Layers, Gauge, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: Layers, label: "Campaigns", active: true },
  { icon: BarChart3, label: "Assets" },
  { icon: Gauge, label: "Benchmarks" },
  { icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  return (
    <aside className="w-60 h-screen bg-sidebar flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight">
            Creative Diagnostics
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-medium">
          Powered by Celtra
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
