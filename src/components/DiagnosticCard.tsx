import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { CreativeAsset } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import ChannelIcon from "./ChannelIcon";

const rankStyle = "text-muted-foreground/60";

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
  rank: number;
  maxRoas: number;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
  onClick?: () => void;
}

/** Column header row — render once above the list */
export const DiagnosticHeader = () => (
  <div className="flex items-center h-8 px-4 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/60 select-none">
    <div className="w-6 flex-shrink-0" /> {/* rank */}
    <div className="ml-2.5 w-4 flex-shrink-0" /> {/* checkbox */}
    <div className="ml-3 w-11 flex-shrink-0" /> {/* thumbnail */}
    <div className="ml-3 min-w-[130px] max-w-[180px] flex-shrink-0">Creative Asset</div>
    <div className="ml-3 min-w-[60px] flex-shrink-0">Channel</div>
    <div className="flex-1" />
    <div className="mr-6 min-w-[70px] text-right flex-shrink-0">Spend</div>
    <div className="w-px mr-5 flex-shrink-0" />
    <div className="min-w-[60px] mr-5 flex-shrink-0">ROAS</div>
    <div className="min-w-[56px] mr-4 flex-shrink-0 text-center">CPM</div>
    <div className="min-w-[40px] mr-4 flex-shrink-0 text-center">CTR</div>
    <div className="min-w-[48px] mr-4 flex-shrink-0 text-center">CPC</div>
    <div className="min-w-[44px] flex-shrink-0 text-center">Conv.</div>
    <div className="w-3.5 ml-4 flex-shrink-0" />
  </div>
);

const DiagnosticCard = ({ asset, index, rank, maxRoas, selected = false, onSelectToggle, onClick }: DiagnosticCardProps) => {
  const roasPercent = Math.min((asset.roas / maxRoas) * 100, 100);

  const roasColor =
    roasPercent >= 75 ? "text-emerald-600" :
    roasPercent >= 40 ? "text-foreground" :
    "text-destructive";

  const barColor =
    roasPercent >= 75 ? "bg-emerald-500" :
    roasPercent >= 40 ? "bg-primary" :
    "bg-destructive";

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.025 }}
      className={`group flex items-center h-[68px] px-4 rounded-lg cursor-pointer transition-all duration-100 border ${
        selected
          ? "border-primary/25 bg-primary/[0.02]"
          : isTop
            ? "border-yellow-300/30 bg-yellow-50/30"
            : "border-transparent bg-surface hover:bg-muted/30"
      }`}
    >
      {/* Rank */}
      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold font-mono flex-shrink-0 ${
        rankStyles[rank] || "text-muted-foreground/40"
      }`}>
        {rank + 1}
      </div>

      {/* Checkbox */}
      <div className="ml-2.5 flex-shrink-0">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelectToggle?.(asset.id)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Thumbnail */}
      <div className="ml-3 w-11 h-11 rounded-md overflow-hidden flex-shrink-0 bg-muted">
        <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
      </div>

      {/* Name */}
      <div className="ml-3 min-w-[130px] max-w-[180px] flex-shrink-0">
        <p className="text-[13px] font-medium text-foreground truncate leading-tight">{asset.name}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{asset.id}</p>
      </div>

      {/* Channel */}
      <div className="ml-3 min-w-[60px] flex-shrink-0">
        <ChannelIcon channel={asset.channel} size="sm" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Spend */}
      <div className="mr-6 text-right min-w-[70px] flex-shrink-0">
        <p className="text-[13px] font-mono text-muted-foreground font-medium">${asset.spend.toLocaleString()}</p>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-border/60 mr-5 flex-shrink-0" />

      {/* ROAS */}
      <div className="min-w-[60px] mr-5 flex-shrink-0">
        <p className={`text-[15px] font-mono font-bold leading-tight ${roasColor}`}>{asset.roas}x</p>
        <div className="w-full h-[2px] bg-border/50 rounded-full overflow-hidden mt-1">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${roasPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* CPM */}
      <div className="min-w-[56px] mr-4 flex-shrink-0 text-center">
        <p className="text-[13px] font-mono font-medium text-foreground">${asset.cpm.toFixed(2)}</p>
      </div>

      {/* CTR */}
      <div className="min-w-[40px] mr-4 flex-shrink-0 text-center">
        <p className="text-[13px] font-mono font-medium text-foreground">{asset.ctr}%</p>
      </div>

      {/* CPC */}
      <div className="min-w-[48px] mr-4 flex-shrink-0 text-center">
        <p className="text-[13px] font-mono font-medium text-foreground">${asset.cpc.toFixed(2)}</p>
      </div>

      {/* Conv Rate */}
      <div className="min-w-[44px] flex-shrink-0 text-center">
        <p className="text-[13px] font-mono font-medium text-foreground">{asset.conversionRate}%</p>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-3.5 h-3.5 ml-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors flex-shrink-0" />
    </motion.div>
  );
};

export default DiagnosticCard;
