import { useMemo } from "react";
import type { Campaign, Channel } from "@/data/mockData";
import { channelConfig } from "./ChannelIcon";

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
        return { channel: ch, assets: assets.length, spend, revenue, roas, conversions, ctr, cpm, cpa };
      })
      .filter(Boolean) as {
        channel: Channel; assets: number; spend: number; revenue: number; roas: number;
        conversions: number; ctr: number; cpm: number; cpa: number;
      }[];
  }, [campaign.assets]);

  const totalSpend = campaign.totalSpend;
  const spendPct = ((totalSpend / campaign.totalBudget) * 100);
  const bestRoas = channelBreakdown.length > 0 ? Math.max(...channelBreakdown.map(c => c.roas)) : 0;

  return (
    <div>
      {/* Unified block: title + budget + platform table */}
      <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
        {/* Header strip: title + budget in one row */}
        <div className="px-4 py-3 bg-muted/20 border-b border-border/40">
          {/* Row 1: Name + Status */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-foreground tracking-tight">{campaign.name}</h1>
            <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-px rounded ${
              campaign.status === "active" ? "bg-accent/10 text-accent-teal" : "bg-secondary text-muted-foreground"
            }`}>{campaign.status}</span>
          </div>
          {/* Row 2: Owner, Start, End + Budget right-aligned */}
          <div className="flex items-baseline justify-between mt-1.5">
            <div className="flex items-baseline gap-5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Owner</span>
                <span className="text-[11px] font-medium text-foreground/80">{campaign.owner}</span>
              </div>
              <span className="text-muted-foreground/20">|</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Start</span>
                <span className="text-[11px] font-mono text-foreground/80">{campaign.startDate}</span>
              </div>
              <span className="text-muted-foreground/20">|</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">End</span>
                <span className="text-[11px] font-mono text-foreground/80">{campaign.endDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Budget</span>
              <span className="text-sm font-mono font-bold text-foreground">${totalSpend.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-muted-foreground">/ ${campaign.totalBudget.toLocaleString()}</span>
              <div className="w-24 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${Math.min(spendPct, 100)}%` }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{spendPct.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Platform table */}
        {channelBreakdown.length > 1 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-1.5 text-left">Platform</th>
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">Spend</th>
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">Revenue</th>
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">ROAS</th>
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">Conv.</th>
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">CPA</th>
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">CTR</th>
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">CPM</th>
              </tr>
            </thead>
            <tbody>
              {channelBreakdown.map((row) => {
                const isBest = row.roas === bestRoas;
                const color = channelConfig[row.channel].color;
                const roasColor = row.roas >= 4 ? "text-emerald-600" : row.roas >= 2 ? "text-foreground" : "text-destructive";
                return (
                  <tr key={row.channel} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs font-semibold text-foreground">{channelConfig[row.channel].label}</span>
                        {isBest && <span className="text-[7px] font-bold text-emerald-600">★</span>}
                        <span className="text-[10px] font-mono text-muted-foreground/60">{row.assets}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs font-mono text-muted-foreground">${row.spend.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-xs font-mono font-medium text-foreground">${row.revenue.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right text-xs font-mono font-bold ${roasColor}`}>{row.roas.toFixed(1)}x</td>
                    <td className="px-3 py-1.5 text-right text-xs font-mono text-foreground">{row.conversions.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-xs font-mono text-foreground">${row.cpa.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-xs font-mono text-foreground">{row.ctr.toFixed(1)}%</td>
                    <td className="px-3 py-1.5 text-right text-xs font-mono text-foreground">${row.cpm.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CampaignHeader;
