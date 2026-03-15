import { motion } from "framer-motion";
import type { CreativeAsset } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import ChannelIcon from "./ChannelIcon";
import PerformanceBar from "./PerformanceBar";

const formatCurrency = (n: number) => `$${n.toLocaleString()}`;
const channelVariant = (ch: string) => ch === "meta" ? "blue" : ch === "tiktok" ? "teal" : "rose";

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
  maxRoas: number;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
}

const DiagnosticCard = ({ asset, index, maxRoas }: DiagnosticCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex items-center gap-4 p-3 bg-surface rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-150 border border-border"
    >
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
