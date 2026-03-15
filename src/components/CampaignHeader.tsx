import { useMemo } from "react";
import type { Campaign, Channel } from "@/data/mockData";
import MetricCell from "./MetricCell";
import ChannelIcon from "./ChannelIcon";

interface CampaignHeaderProps {
  campaign: Campaign;
}

const channelOrder: Channel[] = ["meta", "tiktok", "google"];

const CampaignHeader = ({ campaign }: CampaignHeaderProps) => {
  const avgRoas = campaign.assets.length > 0
    ? (campaign.assets.reduce((sum, a) => sum + a.roas, 0) / campaign.assets.length).toFixed(1)
    : "—";
  const totalConversions = campaign.assets.reduce((sum, a) => sum + a.conversions, 0);

  const channelBreakdown = useMemo(() => {
    return channelOrder
      .map((ch) => {
        const assets = campaign.assets.filter((a) => a.channel === ch);
        if (assets.length === 0) return null;
        const spend = assets.reduce((s, a) => s + a.spend, 0);
        const revenue = assets.reduce((s, a) => s + a.purchaseValue, 0);
        const roas = spend > 0 ? revenue / spend : 0;
        const conversions = assets.reduce((s, a) => s + a.conversions, 0);
        const impressions = assets.reduce((s, a) => s + a.impressions, 0);
        const clicks = assets.reduce((s, a) => s + a.clicks, 0);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
        const cpa = conversions > 0 ? spend / conversions : 0;
        return { channel: ch, assets: assets.length, spend, roas, conversions, ctr, cpm, cpa };
      })
      .filter(Boolean) as {
        channel: Channel; assets: number; spend: number; roas: number;
        conversions: number; ctr: number; cpm: number; cpa: number;
      }[];
  }, [campaign.assets]);

  const totalSpend = campaign.totalSpend;

  return (
    <div>
      {/* Top row — campaign summary */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              {campaign.name}
            </h1>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              campaign.status === "active"
                ? "bg-accent/10 text-accent-teal"
                : "bg-secondary text-muted-foreground"
            }`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {campaign.startDate} → {campaign.endDate} · {campaign.assets.length} assets
          </p>
        </div>

        <div className="flex gap-8">
          <MetricCell label="Budget" value={`$${campaign.totalBudget.toLocaleString()}`} />
          <MetricCell label="Spend" value={`$${campaign.totalSpend.toLocaleString()}`} delta={`${((campaign.totalSpend / campaign.totalBudget) * 100).toFixed(0)}% used`} />
        </div>
      </div>

      {/* Platform breakdown */}
      {channelBreakdown.length > 1 && (
        <div className="mt-5 rounded-lg border border-border/60 bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center h-8 px-4 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/60 border-b border-border/40">
            <div className="w-[80px] flex-shrink-0">Platform</div>
            <div className="w-[50px] flex-shrink-0 text-center">Assets</div>
            <div className="flex-1 px-3" />
            <div className="w-[90px] flex-shrink-0 text-right">Spend</div>
            <div className="w-[70px] flex-shrink-0 text-right">% of Total</div>
            <div className="w-[60px] flex-shrink-0 text-right">ROAS</div>
            <div className="w-[50px] flex-shrink-0 text-right">CTR</div>
            <div className="w-[70px] flex-shrink-0 text-right">CPM</div>
            <div className="w-[70px] flex-shrink-0 text-right">CPA</div>
            <div className="w-[70px] flex-shrink-0 text-right">Conv.</div>
          </div>
          {/* Rows */}
          {channelBreakdown.map((row) => {
            const pctOfTotal = totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0;
            const roasColor = row.roas >= 4 ? "text-emerald-600" : row.roas >= 2 ? "text-foreground" : "text-destructive";
            return (
              <div key={row.channel} className="flex items-center h-[44px] px-4 border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors">
                <div className="w-[80px] flex-shrink-0">
                  <ChannelIcon channel={row.channel} size="sm" />
                </div>
                <div className="w-[50px] flex-shrink-0 text-center">
                  <span className="text-[12px] font-mono text-muted-foreground">{row.assets}</span>
                </div>
                <div className="flex-1 px-3">
                  <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/40 transition-all"
                      style={{ width: `${pctOfTotal}%` }}
                    />
                  </div>
                </div>
                <div className="w-[90px] flex-shrink-0 text-right">
                  <span className="text-[13px] font-mono font-medium text-foreground">${row.spend.toLocaleString()}</span>
                </div>
                <div className="w-[70px] flex-shrink-0 text-right">
                  <span className="text-[12px] font-mono text-muted-foreground">{pctOfTotal.toFixed(0)}%</span>
                </div>
                <div className="w-[60px] flex-shrink-0 text-right">
                  <span className={`text-[13px] font-mono font-bold ${roasColor}`}>{row.roas.toFixed(1)}x</span>
                </div>
                <div className="w-[50px] flex-shrink-0 text-right">
                  <span className="text-[12px] font-mono text-foreground">{row.ctr.toFixed(1)}%</span>
                </div>
                <div className="w-[70px] flex-shrink-0 text-right">
                  <span className="text-[12px] font-mono text-foreground">${row.cpm.toFixed(2)}</span>
                </div>
                <div className="w-[70px] flex-shrink-0 text-right">
                  <span className="text-[12px] font-mono text-foreground">${row.cpa.toFixed(2)}</span>
                </div>
                <div className="w-[70px] flex-shrink-0 text-right">
                  <span className="text-[12px] font-mono font-medium text-foreground">{row.conversions.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignHeader;