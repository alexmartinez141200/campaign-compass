import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { CreativeAsset } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import ChannelIcon from "./ChannelIcon";

const rankColors: Record<number, string> = {
  0: "text-yellow-500",
  1: "text-muted-foreground/60",
  2: "text-amber-600",
};

interface MetricProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const Metric = ({ label, value, highlight }: MetricProps) => (
  <div className="flex flex-col items-center min-w-[64px]">
    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{label}</span>
    <span className={`text-[13px] font-mono font-semibold ${highlight ? "text-foreground" : "text-foreground/80"}`}>
      {value}
    </span>
  </div>
);

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
  rank: number;
  maxRoas: number;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
}

const DiagnosticCard = ({ asset, index, rank, maxRoas, selected = false, onSelectToggle }: DiagnosticCardProps) => {
  const isTop = rank === 0;
  const roasPercent = Math.min((asset.roas / maxRoas) * 100, 100);

  // Performance color based on ROAS relative to max
  const roasColor =
    roasPercent >= 75 ? "text-emerald-600" :
    roasPercent >= 40 ? "text-foreground" :
    "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group grid grid-cols-[auto_auto_56px_1fr_auto_auto] items-center gap-x-3 px-4 py-3.5 rounded-xl transition-all duration-150 cursor-pointer border ${
        selected
          ? "border-primary/30 bg-primary/[0.03] shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]"
          : isTop
            ? "border-yellow-200/60 bg-gradient-to-r from-yellow-50/40 to-transparent"
            : "border-border/60 bg-surface hover:border-border hover:shadow-card-hover"
      }`}
    >
      {/* Col 1: Rank + Checkbox */}
      <div className="flex items-center gap-2">
        <span className={`w-5 text-center text-[13px] font-semibold font-mono tabular-nums ${rankColors[rank] || "text-muted-foreground/30"}`}>
          {rank + 1}
        </span>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelectToggle?.(asset.id)}
          className="flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Col 2: Thumbnail */}
      <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-border/40">
        <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
      </div>

      {/* Col 3: Channel badge */}
      <div className="flex justify-center">
        <ChannelIcon channel={asset.channel} size="sm" />
      </div>

      {/* Col 4: Name + ID */}
      <div className="min-w-0 pr-4">
        <h3 className="text-[13px] font-semibold text-foreground truncate leading-tight">{asset.name}</h3>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
          {asset.id} · {asset.dimensions}
        </p>
      </div>

      {/* Col 5: Metrics row */}
      <div className="flex items-center gap-px bg-secondary/50 rounded-lg p-1.5">
        {/* ROAS - hero metric */}
        <div className="flex flex-col items-center min-w-[72px] px-2">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">ROAS</span>
          <span className={`text-lg font-mono font-bold leading-tight ${roasColor}`}>
            {asset.roas}x
          </span>
          {/* Mini bar */}
          <div className="w-full h-[3px] bg-border/60 rounded-full overflow-hidden mt-1">
            <motion.div
              className={`h-full rounded-full ${
                roasPercent >= 75 ? "bg-emerald-500" : roasPercent >= 40 ? "bg-primary" : "bg-destructive"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${roasPercent}%` }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>

        <div className="w-px h-8 bg-border/40 mx-1" />

        <Metric label="CPM" value={`$${asset.cpm.toFixed(2)}`} />
        <div className="w-px h-8 bg-border/40 mx-0.5" />
        <Metric label="CTR" value={`${asset.ctr}%`} />
        <div className="w-px h-8 bg-border/40 mx-0.5" />
        <Metric label="CPC" value={`$${asset.cpc.toFixed(2)}`} />
        <div className="w-px h-8 bg-border/40 mx-0.5" />
        <Metric label="Conv." value={`${asset.conversionRate}%`} />
      </div>

      {/* Col 6: Chevron */}
      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
    </motion.div>
  );
};

export default DiagnosticCard;
