import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { CreativeAsset } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import { formatStoryMetricValue, getCreativeAttributeDrivers } from "@/lib/creative-story";
import ChannelIcon from "./ChannelIcon";

const rankStyle = "text-muted-foreground/60";

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

const sorts: { value: SortOption; label: string }[] = [
  { value: "roas", label: "ROAS" },
  { value: "spend", label: "Spend" },
];

const getProfileMetricKeys = (asset: CreativeAsset) => {
  if (asset.type === "video") return ["duration", "motion", "cta"];
  if (asset.type === "carousel") return ["format", "cta", "funnelStage"];
  return ["format", "brandProminence", "funnelStage"];
};

/** Column header row — render once above the list */
export const DiagnosticHeader = ({ sort, onSortChange, showCheckbox = true }: { sort?: SortOption; onSortChange?: (s: SortOption) => void; showCheckbox?: boolean }) => (
  <div className="flex items-center h-8 px-0 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/60 select-none">
    <div className="w-8 flex-shrink-0" />
    <div className="ml-2 min-w-[174px] max-w-[224px] flex-shrink-0">Creative Asset</div>
    <div className="ml-3 min-w-[60px] flex-shrink-0">Channel</div>
    <div className="flex-1" />
    <div className="mr-6 min-w-[70px] text-right flex-shrink-0">Spend</div>
    <div className="mr-6 min-w-[80px] text-right flex-shrink-0">Revenue</div>
    <div className="min-w-[360px] flex-shrink-0">Key profile metrics</div>
    <div className="w-3.5 ml-4 flex-shrink-0" />
  </div>
);

const DiagnosticCard = ({ asset, index, rank, maxRoas, selected = false, showCheckbox = true, campaignName, onSelectToggle, onClick }: DiagnosticCardProps) => {
  const metricGroups = getProfileMetricKeys(asset)
    .flatMap((key) => getCreativeAttributeDrivers(asset, [asset], key))
    .filter((metric, metricIndex, arr) => arr.findIndex((item) => item.metricKey === metric.metricKey) === metricIndex)
    .slice(0, 4)
    .map((metric) => ({
      label: metric.label,
      value: formatStoryMetricValue(metric.value, metric.format),
    }));

  return (
    <motion.div
      onClick={showCheckbox ? () => onSelectToggle?.(asset.id) : onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.025 }}
      className={`group flex items-center h-[68px] px-0 rounded-lg cursor-pointer transition-all duration-100 border ${
        selected
          ? "border-primary/25 bg-primary/[0.02]"
          : "border-transparent bg-surface hover:bg-muted/30"
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
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        ) : (
          <span className="text-[11px] font-mono font-medium text-muted-foreground/50">{rank + 1}</span>
        )}
      </div>

      <div className="ml-2 flex items-start gap-3 min-w-[174px] max-w-[224px] flex-shrink-0">
        <div className="w-11 h-11 rounded-md overflow-hidden flex-shrink-0 bg-muted">
          <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[13px] font-medium text-foreground truncate leading-tight">{asset.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{asset.id}</p>
          {campaignName && <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">{campaignName}</p>}
        </div>
      </div>

      <div className="ml-3 min-w-[60px] flex-shrink-0">
        <ChannelIcon channel={asset.channel} size="sm" />
      </div>

      <div className="flex-1" />

      <div className="mr-6 text-right min-w-[70px] flex-shrink-0">
        <p className="text-[13px] font-mono text-muted-foreground font-medium">${asset.spend.toLocaleString()}</p>
      </div>

      <div className="mr-6 text-right min-w-[80px] flex-shrink-0">
        <p className="text-[13px] font-mono text-foreground font-semibold">${asset.purchaseValue.toLocaleString()}</p>
      </div>

      <div className="grid min-w-[360px] grid-cols-4 gap-2 flex-shrink-0">
        {metricGroups.map((metric) => (
          <div key={`${asset.id}-${metric.label}`} className="rounded-md border border-border/50 bg-background px-2 py-1.5">
            <p className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground truncate">{metric.label}</p>
            <p className="mt-0.5 text-[11px] font-mono font-semibold text-foreground truncate">{metric.value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        className="ml-4 p-1 rounded hover:bg-muted/50 transition-colors flex-shrink-0"
      >
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
      </button>
    </motion.div>
  );
};

export default DiagnosticCard;
