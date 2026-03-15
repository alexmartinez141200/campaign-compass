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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex gap-5 p-4 bg-surface rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-150 border border-border"
    >
      {/* L1: Visual */}
      <div className="w-40 aspect-[4/5] bg-muted rounded-md overflow-hidden relative flex-shrink-0">
        <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-foreground/60 backdrop-blur text-[9px] text-primary-foreground rounded font-bold uppercase tracking-wide">
          {asset.type}
        </div>
      </div>

      {/* L2: Aggregate */}
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">{asset.name}</h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {asset.id} · {asset.dimensions}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <MetricCell label="Total ROAS" value={`${asset.totalRoas}x`} delta={`${asset.roasDelta}%`} />
          <MetricCell label="Total Spend" value={formatCurrency(asset.totalSpend)} />
          <MetricCell
            label="Perf Delta"
            value={`${(Math.max(...asset.channels.map(c => c.roas)) - Math.min(...asset.channels.map(c => c.roas))).toFixed(1)}x`}
          />
        </div>
      </div>

      {/* L3: Channel Breakdown */}
      <div className="flex gap-1.5 items-stretch flex-shrink-0">
        {asset.channels.map((ch) => (
          <div
            key={ch.channel}
            className="w-[120px] p-2.5 bg-muted/50 rounded-md border border-border/60 flex flex-col justify-between"
          >
            <ChannelIcon channel={ch.channel} />
            <div className="mt-2.5 space-y-1.5">
              <div>
                <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">ROAS</span>
                <span className="text-[13px] font-mono font-medium text-foreground">{ch.roas}x</span>
                <PerformanceBar percentage={(ch.roas / maxRoas) * 100} variant={channelVariant(ch.channel)} />
              </div>
              <div>
                <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Spend</span>
                <span className="text-[11px] font-mono text-foreground">{formatCurrency(ch.spend)}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">CTR</span>
                <span className="text-[11px] font-mono text-foreground">{ch.ctr}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default DiagnosticCard;
