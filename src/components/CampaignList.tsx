import { motion } from "framer-motion";
import type { Campaign } from "@/data/mockData";
import { ChevronRight, BarChart3 } from "lucide-react";

interface CampaignListProps {
  campaigns: Campaign[];
  onSelect: (id: string) => void;
}

const formatCurrency = (n: number) => `$${n.toLocaleString()}`;

const CampaignList = ({ campaigns, onSelect }: CampaignListProps) => {
  if (campaigns.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        No campaigns found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map((campaign, i) => {
        const avgRoas = campaign.assets.length > 0
          ? (campaign.assets.reduce((s, a) => s + a.roas, 0) / campaign.assets.length).toFixed(1)
          : "—";
        const totalConversions = campaign.assets.reduce((s, a) => s + a.conversions, 0);
        const spendPct = ((campaign.totalSpend / campaign.totalBudget) * 100).toFixed(0);

        return (
          <motion.button
            key={campaign.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            onClick={() => onSelect(campaign.id)}
            className="w-full flex items-center gap-6 p-5 bg-surface rounded-lg shadow-card hover:shadow-card-hover border border-border transition-all duration-150 text-left group"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[14px] font-semibold text-foreground">{campaign.name}</h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  campaign.status === "active"
                    ? "bg-accent/10 text-accent-teal"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {campaign.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[11px] text-muted-foreground">
                  by <span className="font-medium text-foreground/70">{campaign.owner}</span>
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Created {campaign.createdAt}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Ends {campaign.endDate}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {campaign.assets.length} creatives
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 flex-shrink-0">
              <div className="text-right">
                <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Budget</span>
                <span className="text-[13px] font-mono font-medium text-foreground">{formatCurrency(campaign.totalBudget)}</span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Spend</span>
                <span className="text-[13px] font-mono font-medium text-foreground">{formatCurrency(campaign.totalSpend)}</span>
                <span className="block text-[10px] font-mono text-accent-teal">{spendPct}%</span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Avg ROAS</span>
                <span className="text-[13px] font-mono font-medium text-foreground">{avgRoas}x</span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Conv.</span>
                <span className="text-[13px] font-mono font-medium text-foreground">{totalConversions.toLocaleString()}</span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
};

export default CampaignList;
