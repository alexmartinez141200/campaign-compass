import { useMemo } from "react";
import type { Campaign, Channel } from "@/data/mockData";
import { channelConfig } from "./ChannelIcon";
import ChannelIcon from "./ChannelIcon";

interface CampaignHeaderProps {
  campaign: Campaign;
}

const channelOrder: Channel[] = ["meta", "tiktok", "google"];

const CampaignHeader = ({ campaign }: CampaignHeaderProps) => {
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
        return { channel: ch, assets: assets.length, spend, revenue, roas, conversions, ctr, cpm, cpa, impressions };
      })
      .filter(Boolean) as {
        channel: Channel; assets: number; spend: number; revenue: number; roas: number;
        conversions: number; ctr: number; cpm: number; cpa: number; impressions: number;
      }[];
  }, [campaign.assets]);

  const totalSpend = campaign.totalSpend;
  const spendPct = ((totalSpend / campaign.totalBudget) * 100);
  const remaining = campaign.totalBudget - totalSpend;

  // Find best performer
  const bestRoas = channelBreakdown.length > 0 ? Math.max(...channelBreakdown.map(c => c.roas)) : 0;

  return (
    <div>
      {/* Top row — campaign identity + budget gauge */}
      <div className="flex items-start justify-between mb-6">
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

        {/* Budget gauge */}
        <div className="flex items-center gap-5 px-5 py-3.5 rounded-lg border border-border/60 bg-card">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Budget</p>
            <p className="text-base font-mono font-bold text-foreground">${campaign.totalBudget.toLocaleString()}</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Spent</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-base font-mono font-bold text-foreground">${totalSpend.toLocaleString()}</p>
              <span className="text-[11px] font-mono font-medium text-accent-teal">{spendPct.toFixed(0)}%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</p>
            <p className="text-base font-mono font-bold text-foreground">${remaining.toLocaleString()}</p>
          </div>
          <div className="w-20 flex flex-col gap-1">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(spendPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spend allocation bar — stacked horizontal */}
      {channelBreakdown.length > 1 && (
        <>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-bold">Spend Allocation</p>
            <div className="flex-1 h-px bg-border/40" />
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden mb-5 gap-0.5">
            {channelBreakdown.map((row) => {
              const pct = totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0;
              return (
                <div
                  key={row.channel}
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: channelConfig[row.channel].color,
                    opacity: 0.7,
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Platform performance cards */}
      {channelBreakdown.length > 1 && (
        <div className={`grid gap-3 ${channelBreakdown.length === 3 ? "grid-cols-3" : channelBreakdown.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {channelBreakdown.map((row) => {
            const pctOfTotal = totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0;
            const isBest = row.roas === bestRoas && channelBreakdown.length > 1;
            const roasColor = row.roas >= 4 ? "text-emerald-600" : row.roas >= 2 ? "text-foreground" : "text-destructive";
            const channelColor = channelConfig[row.channel].color;

            return (
              <div
                key={row.channel}
                className="relative rounded-lg border border-border/60 bg-card p-4 overflow-hidden"
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ backgroundColor: channelColor, opacity: 0.6 }}
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-4 pt-1">
                  <div className="flex items-center gap-2.5">
                    <ChannelIcon channel={row.channel} size="sm" />
                    <span className="text-[11px] text-muted-foreground font-mono">{row.assets} assets</span>
                  </div>
                  {isBest && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Best ROAS
                    </span>
                  )}
                </div>

                {/* Spend & allocation */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Spend</p>
                    <span className="text-[11px] font-mono text-muted-foreground">{pctOfTotal.toFixed(0)}% of total</span>
                  </div>
                  <p className="text-lg font-mono font-bold text-foreground leading-none mb-2">${row.spend.toLocaleString()}</p>
                  <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pctOfTotal}%`, backgroundColor: channelColor, opacity: 0.5 }}
                    />
                  </div>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">ROAS</p>
                    <p className={`text-[15px] font-mono font-bold leading-none ${roasColor}`}>{row.roas.toFixed(1)}x</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Conv.</p>
                    <p className="text-[15px] font-mono font-bold text-foreground leading-none">{row.conversions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">CTR</p>
                    <p className="text-[13px] font-mono font-medium text-foreground leading-none">{row.ctr.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">CPA</p>
                    <p className="text-[13px] font-mono font-medium text-foreground leading-none">${row.cpa.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">CPM</p>
                    <p className="text-[13px] font-mono font-medium text-foreground leading-none">${row.cpm.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Revenue</p>
                    <p className="text-[13px] font-mono font-medium text-foreground leading-none">${row.revenue.toLocaleString()}</p>
                  </div>
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