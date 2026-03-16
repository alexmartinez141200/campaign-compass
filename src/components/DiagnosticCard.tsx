import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { CreativeAsset } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import ChannelIcon from "./ChannelIcon";

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
  rank: number;
  maxRoas: number;
  selected?: boolean;
  showCheckbox?: boolean;
  campaignName?: string;
  onSelectToggle?: (id: string) => void;
  onClick?: () => void;
}

type SortOption = "roas" | "spend";

const getCreativePerformanceScore = (asset: CreativeAsset) => {
  const engagementRate = asset.impressions > 0 ? ((asset.postReactions + asset.postComments + asset.postShares + asset.postSaves) / asset.impressions) * 100 : 0;
  const linkCtr = asset.impressions > 0 ? (asset.linkClicks / asset.impressions) * 100 : 0;
  const clickToLpv = asset.linkClicks > 0 ? (asset.landingPageViews / asset.linkClicks) * 100 : 0;
  const purchaseRate = asset.landingPageViews > 0 ? (asset.conversions / asset.landingPageViews) * 100 : 0;

  const score =
    35 +
    Math.min(20, engagementRate * 6) +
    Math.min(15, linkCtr * 4) +
    Math.min(15, clickToLpv / 6) +
    Math.min(15, purchaseRate * 2.5);

  return Math.max(0, Math.min(100, Math.round(score)));
};

export const DiagnosticHeader = ({ sort, onSortChange, showCheckbox = true }: { sort?: SortOption; onSortChange?: (s: SortOption) => void; showCheckbox?: boolean }) => (
  <div className="flex h-10 items-center border-b border-border/70 px-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 select-none">
    <div className="w-8 flex-shrink-0" />
    <div className="ml-2 min-w-[174px] max-w-[224px] flex-shrink-0">Creative Asset</div>
    <div className="ml-3 min-w-[60px] flex-shrink-0">Channel</div>
    <div className="flex-1" />
    <div className="mr-6 min-w-[70px] flex-shrink-0 text-right">Spend</div>
    <div className="mr-6 min-w-[80px] flex-shrink-0 text-right">Revenue</div>
    <div className="mr-6 min-w-[76px] flex-shrink-0 text-right">ROAS</div>
    <div className="min-w-[120px] flex-shrink-0 text-right">Creative Score</div>
    <div className="ml-4 w-3.5 flex-shrink-0" />
  </div>
);

const DiagnosticCard = ({ asset, index, rank, maxRoas, selected = false, showCheckbox = true, campaignName, onSelectToggle, onClick }: DiagnosticCardProps) => {
  const roasPercent = Math.min((asset.roas / maxRoas) * 100, 100);
  const performanceScore = getCreativePerformanceScore(asset);

  const roasColor =
    roasPercent >= 75 ? "text-accent" :
    roasPercent >= 40 ? "text-foreground" :
    "text-destructive";

  const barColor =
    roasPercent >= 75 ? "bg-accent" :
    roasPercent >= 40 ? "bg-primary" :
    "bg-destructive";

  const scoreColor =
    performanceScore >= 75 ? "text-accent" :
    performanceScore >= 50 ? "text-foreground" :
    "text-destructive";

  return (
    <motion.div
      onClick={showCheckbox ? () => onSelectToggle?.(asset.id) : onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.025 }}
      className={`group flex h-[76px] items-center rounded-xl border border-border/60 px-0 shadow-card transition-all duration-150 ${
        selected
          ? "bg-primary/[0.03] ring-1 ring-primary/15"
          : "bg-card hover:border-border hover:bg-muted/20 hover:shadow-card-hover"
      }`}
    >
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {showCheckbox ? (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelectToggle?.(asset.id)}
              className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
          </div>
        ) : (
          <span className="text-[11px] font-mono font-medium text-muted-foreground/55">{rank + 1}</span>
        )}
      </div>

      <div className="ml-2 flex min-w-[174px] max-w-[224px] flex-shrink-0 items-start gap-3">
        <div className="h-11 w-11 overflow-hidden rounded-lg border border-border/60 bg-muted flex-shrink-0">
          <img src={asset.thumbnail} alt={asset.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{asset.name}</p>
          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{asset.id}</p>
          {campaignName && <p className="mt-0.5 truncate text-[9px] text-muted-foreground/65">{campaignName}</p>}
        </div>
      </div>

      <div className="ml-3 min-w-[60px] flex-shrink-0">
        <ChannelIcon channel={asset.channel} size="sm" />
      </div>

      <div className="flex-1" />

      <div className="mr-6 min-w-[70px] flex-shrink-0 text-right">
        <p className="font-mono text-[13px] font-medium text-muted-foreground">${asset.spend.toLocaleString()}</p>
      </div>

      <div className="mr-6 min-w-[80px] flex-shrink-0 text-right">
        <p className="font-mono text-[13px] font-semibold text-foreground">${asset.purchaseValue.toLocaleString()}</p>
      </div>

      <div className="mr-6 min-w-[76px] flex-shrink-0 text-right">
        <p className={`text-[15px] font-mono font-bold leading-none ${roasColor}`}>{asset.roas.toFixed(1)}x</p>
        <div className="mt-2 ml-auto h-[3px] w-[64px] overflow-hidden rounded-full bg-muted">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${roasPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="min-w-[120px] flex-shrink-0 text-right">
        <p className={`text-[16px] font-mono font-bold leading-none ${scoreColor}`}>{performanceScore}</p>
        <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-muted-foreground">Creative score</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        className="ml-4 flex-shrink-0 rounded-md p-1 transition-colors hover:bg-muted/60"
      >
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 transition-colors group-hover:text-muted-foreground/60" />
      </button>
    </motion.div>
  );
};

export default DiagnosticCard;
