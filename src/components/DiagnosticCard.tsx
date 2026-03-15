import { motion } from "framer-motion";
import type { CreativeAsset } from "@/data/mockData";
import ChannelIcon from "./ChannelIcon";

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
}

const DiagnosticCard = ({ asset, index }: DiagnosticCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="flex items-center gap-4 py-4 border-b border-border last:border-b-0 hover:bg-muted/30 px-2 -mx-2 rounded transition-colors duration-100 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
        <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
      </div>

      {/* Name & ID */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-semibold text-foreground">{asset.name}</h3>
        <p className="text-[12px] text-muted-foreground font-mono mt-0.5">{asset.id} · {asset.dimensions}</p>
      </div>

      {/* Channel */}
      <div className="flex-shrink-0">
        <ChannelIcon channel={asset.channel} size="md" />
      </div>
    </motion.div>
  );
};

export default DiagnosticCard;
