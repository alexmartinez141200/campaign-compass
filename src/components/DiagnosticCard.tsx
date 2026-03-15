import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import type { CreativeAsset } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import ChannelIcon from "./ChannelIcon";
import PerformanceBar from "./PerformanceBar";

const formatCurrency = (n: number) => `$${n.toLocaleString()}`;
const channelVariant = (ch: string) => ch === "meta" ? "blue" : ch === "tiktok" ? "teal" : "rose";

const rankConfig: Record<number, { icon: typeof Trophy; color: string; bg: string; label: string }> = {
  0: { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200", label: "Top Performer" },
  1: { icon: Medal, color: "text-gray-400", bg: "bg-gray-50 border-gray-200", label: "#2" },
  2: { icon: Award, color: "text-amber-600", bg: "bg-orange-50 border-orange-200", label: "#3" },
};

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
  rank: number;
  maxRoas: number;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
}

const DiagnosticCard = ({ asset, index, rank, maxRoas, selected = false, onSelectToggle }: DiagnosticCardProps) => {
  const rankInfo = rankConfig[rank];
  const isTop = rank === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group flex items-center gap-4 p-3 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-150 border ${
        selected ? "border-primary bg-primary/5" : isTop ? "border-yellow-200 bg-yellow-50/50" : "border-border bg-surface"
      }`}
    >
      {/* Rank badge */}
      <div className="flex-shrink-0 w-7 flex justify-center">
        {rankInfo ? (
          <rankInfo.icon className={`w-4.5 h-4.5 ${rankInfo.color}`} strokeWidth={2} />
        ) : (
          <span className="text-[11px] font-mono font-semibold text-muted-foreground/50">#{rank + 1}</span>
        )}
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelectToggle?.(asset.id)}
        className="flex-shrink-0"
      />

      {/* Thumbnail */}
      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden relative flex-shrink-0">
        <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
      </div>

      {/* Name & ID */}
      <div className="min-w-[140px] flex-shrink-0">
        <h3 className="text-[13px] font-semibold text-foreground">{asset.name}</h3>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{asset.id} · {asset.dimensions}</p>
      </div>

      {/* Channel */}
      <div className="flex-shrink-0">
        <ChannelIcon channel={asset.channel} size="md" />
      </div>

      {/* ROAS */}
      <div className="min-w-[100px]">
        <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">ROAS</span>
        <span className="text-base font-mono font-semibold text-foreground">{asset.roas}x</span>
        <PerformanceBar percentage={(asset.roas / maxRoas) * 100} variant={channelVariant(asset.channel)} />
      </div>

      {/* Spend */}
      <div className="min-w-[80px]">
        <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Spend</span>
        <span className="text-[13px] font-mono font-medium text-foreground">{formatCurrency(asset.spend)}</span>
      </div>

      {/* CTR */}
      <div className="min-w-[50px]">
        <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">CTR</span>
        <span className="text-[13px] font-mono font-medium text-foreground">{asset.ctr}%</span>
      </div>

      {/* Clicks */}
      <div className="min-w-[60px]">
        <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Clicks</span>
        <span className="text-[13px] font-mono font-medium text-foreground">{asset.clicks.toLocaleString()}</span>
      </div>

      {/* Conversions */}
      <div className="min-w-[50px]">
        <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Conv.</span>
        <span className="text-[13px] font-mono font-medium text-foreground">{asset.conversions.toLocaleString()}</span>
      </div>

      {/* CPC */}
      <div className="min-w-[50px]">
        <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">CPC</span>
        <span className="text-[13px] font-mono font-medium text-foreground">${asset.cpc.toFixed(2)}</span>
      </div>
    </motion.div>
  );
};

export default DiagnosticCard;
