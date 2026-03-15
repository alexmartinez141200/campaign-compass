import { motion } from "framer-motion";
import type { CreativeAsset } from "@/data/mockData";
import ChannelIcon from "./ChannelIcon";
import MetricCell from "./MetricCell";
import PerformanceBar from "./PerformanceBar";

const formatCurrency = (n: number) => `$${n.toLocaleString()}`;
const channelVariant = (ch: string) => ch === "meta" ? "blue" : ch === "tiktok" ? "teal" : "rose";

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
}

const DiagnosticCard = ({ asset, index }: DiagnosticCardProps) => {
  const maxRoas = Math.max(...asset.channels.map((c) => c.roas));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2 }}
      className="group flex gap-6 p-4 bg-surface rounded-xl shadow-card hover:shadow-card-hover transition-shadow duration-150 border-[0.5px] border-border"
    >
      {/* L1: Visual */}
      <div className="w-48 aspect-[4/5] bg-secondary rounded-lg overflow-hidden relative flex-shrink-0 outline outline-1 outline-foreground/10 -outline-offset-1">
        <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-foreground/60 backdrop-blur text-[10px] text-primary-foreground rounded font-bold uppercase tracking-wide">
          {asset.type}
        </div>
      </div>

      {/* L2: Aggregate */}
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{asset.name}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {asset.id} · {asset.dimensions}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <MetricCell label="Total ROAS" value={`${asset.totalRoas}x`} delta={`${asset.roasDelta}%`} />
          <MetricCell label="Total Spend" value={formatCurrency(asset.totalSpend)} />
          <MetricCell
            label="Perf Delta"
            value={`${(Math.max(...asset.channels.map(c => c.roas)) - Math.min(...asset.channels.map(c => c.roas))).toFixed(1)}x`}
            delta={`${asset.channels.length} channels`}
          />
        </div>
      </div>

      {/* L3: Channel Breakdown */}
      <div className="flex gap-2 items-stretch flex-shrink-0">
        {asset.channels.map((ch) => (
          <div
            key={ch.channel}
            className="w-36 p-3 bg-secondary/60 rounded-lg border border-border/50 flex flex-col justify-between"
          >
            <ChannelIcon channel={ch.channel} />
            <div className="mt-3 space-y-2">
              <div>
                <span className="block text-[10px] uppercase text-muted-foreground font-bold tracking-wider">ROAS</span>
                <span className="text-sm font-mono font-medium text-foreground">{ch.roas}x</span>
                <PerformanceBar percentage={(ch.roas / maxRoas) * 100} variant={channelVariant(ch.channel)} />
              </div>
              <div>
                <span className="block text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Spend</span>
                <span className="text-xs font-mono text-foreground">{formatCurrency(ch.spend)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-muted-foreground font-bold tracking-wider">CTR</span>
                <span className="text-xs font-mono text-foreground">{ch.ctr}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default DiagnosticCard;
