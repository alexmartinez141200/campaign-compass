import { motion } from "framer-motion";
import type { CreativeAsset } from "@/data/mockData";
import ChannelIcon from "./ChannelIcon";
import PerformanceBar from "./PerformanceBar";

const formatCurrency = (n: number) => `$${n.toLocaleString()}`;
const channelVariant = (ch: string) => ch === "meta" ? "blue" : ch === "tiktok" ? "teal" : "rose";

interface DiagnosticCardProps {
  asset: CreativeAsset;
  index: number;
}

const DiagnosticCard = ({ asset, index }: DiagnosticCardProps) => {
  const maxRoas = Math.max(...asset.channels.map((c) => c.roas));
  const bestChannel = asset.channels.reduce((a, b) => a.roas > b.roas ? a : b);
  const worstChannel = asset.channels.reduce((a, b) => a.roas < b.roas ? a : b);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      className="group bg-surface rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-150 border border-border overflow-hidden"
    >
      <div className="flex gap-5 p-4">
        {/* L1: Visual */}
        <div className="w-36 aspect-[4/5] bg-muted rounded-md overflow-hidden relative flex-shrink-0">
          <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-foreground/60 backdrop-blur text-[9px] text-primary-foreground rounded font-bold uppercase tracking-wide">
            {asset.type}
          </div>
        </div>

        {/* L2: Asset info */}
        <div className="flex flex-col justify-between py-0.5 min-w-[140px]">
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">{asset.name}</h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {asset.id} · {asset.dimensions}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Launched on <span className="font-medium text-foreground/70">{asset.channels.length} channels</span>
            </p>
          </div>

          {/* Best / Worst insight */}
          <div className="space-y-1 mt-3">
            <div className="text-[10px]">
              <span className="text-muted-foreground">Best: </span>
              <span className="font-medium text-accent-teal capitalize">{bestChannel.channel}</span>
              <span className="font-mono text-accent-teal ml-1">{bestChannel.roas}x</span>
            </div>
            <div className="text-[10px]">
              <span className="text-muted-foreground">Worst: </span>
              <span className="font-medium text-accent-rose capitalize">{worstChannel.channel}</span>
              <span className="font-mono text-accent-rose ml-1">{worstChannel.roas}x</span>
            </div>
          </div>
        </div>

        {/* L3: Independent Channel Launches */}
        <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${asset.channels.length}, 1fr)` }}>
          {asset.channels.map((ch) => (
            <div
              key={ch.channel}
              className="p-3 bg-muted/40 rounded-md border border-border/50 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <ChannelIcon channel={ch.channel} />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Independent
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                <div>
                  <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">ROAS</span>
                  <span className="text-base font-mono font-semibold text-foreground">{ch.roas}x</span>
                  <PerformanceBar percentage={(ch.roas / maxRoas) * 100} variant={channelVariant(ch.channel)} />
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div>
                    <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Spend</span>
                    <span className="text-[12px] font-mono text-foreground">{formatCurrency(ch.spend)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">CTR</span>
                    <span className="text-[12px] font-mono text-foreground">{ch.ctr}%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Clicks</span>
                    <span className="text-[12px] font-mono text-foreground">{ch.clicks.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Conv.</span>
                    <span className="text-[12px] font-mono text-foreground">{ch.conversions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DiagnosticCard;
