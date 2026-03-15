import {
  Search,
  FolderOpen,
  Box,
  Sparkles,
  BarChart3,
  Clock,
  Grid3X3,
  Zap,
  Megaphone,
  Settings,
  HelpCircle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const mainNav: NavItem[] = [
  { icon: Search, label: "Search" },
  { icon: FolderOpen, label: "Campaigns", active: true },
  { icon: Box, label: "Toolkits" },
  { icon: Sparkles, label: "AI Creative Flows" },
  { icon: BarChart3, label: "Performance" },
  { icon: Clock, label: "Platform Utilization" },
  { icon: Grid3X3, label: "Product catalogs" },
  { icon: Zap, label: "Inbox" },
  { icon: Megaphone, label: "What's New" },
];

const AppSidebar = () => {
  return (
    <aside className="w-[232px] h-screen bg-sidebar flex flex-col fixed left-0 top-0 z-40 border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-5">
        <button className="flex items-center gap-1.5 text-foreground">
          <span className="text-[15px] font-semibold tracking-tight">Celtra</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {mainNav.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors duration-100",
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5">
        <button className="w-full flex items-center gap-3 px-3 py-[7px] rounded-md text-[13px] font-medium text-sidebar-foreground hover:bg-muted hover:text-foreground transition-colors duration-100">
          <Settings className="w-[18px] h-[18px]" strokeWidth={1.8} />
          Account Settings
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-[7px] rounded-md text-[13px] font-medium text-sidebar-foreground hover:bg-muted hover:text-foreground transition-colors duration-100">
          <HelpCircle className="w-[18px] h-[18px]" strokeWidth={1.8} />
          Support
        </button>

        <div className="pt-2 px-1">
          <button className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors duration-100">
            Celtra CE <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="pt-3 px-1 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-[11px] font-semibold text-amber-800">
            A
          </div>
          <span className="text-[13px] text-sidebar-foreground truncate">Alexandra Marti...</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
