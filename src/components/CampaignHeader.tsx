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
  const bestRoas = channelBreakdown.length > 0 ? Math.max(...channelBreakdown.map(c => c.roas)) : 0;

  // Compute max values for relative bar widths
  const maxSpend = Math.max(...channelBreakdown.map(c => c.spend), 1);
  const maxConversions = Math.max(...channelBreakdown.map(c => c.conversions), 1);
  const maxRevenue = Math.max(...channelBreakdown.map(c => c.revenue), 1);

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

      {/* Platform performance cards with mini bars */}
      {channelBreakdown.length > 1 && (
        <div className={`grid gap-4 ${channelBreakdown.length === 3 ? "grid-cols-3" : channelBreakdown.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {channelBreakdown.map((row) => {
            const pctOfTotal = totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0;
            const isBest = row.roas === bestRoas;
            const roasColor = row.roas >= 4 ? "text-emerald-600" : row.roas >= 2 ? "text-foreground" : "text-destructive";
            const color = channelConfig[row.channel].color;

            const metrics = [
              { label: "Spend", value: `$${row.spend.toLocaleString()}`, barPct: (row.spend / maxSpend) * 100, showBar: true },
              { label: "ROAS", value: `${row.roas.toFixed(1)}x`, barPct: null, showBar: false, colorClass: roasColor },
              { label: "Conversions", value: row.conversions.toLocaleString(), barPct: (row.conversions / maxConversions) * 100, showBar: true },
              { label: "Revenue", value: `$${row.revenue.toLocaleString()}`, barPct: (row.revenue / maxRevenue) * 100, showBar: true },
            ];

            return (
              <div
                key={row.channel}
                className="relative rounded-lg border border-border/60 bg-card overflow-hidden"
              >
                {/* Color accent */}
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color, opacity: 0.6 }} />

                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, opacity: 0.8 }} />
                    <span className="text-sm font-bold text-foreground">{channelConfig[row.channel].label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{row.assets} assets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isBest && (
                      <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Best ROAS
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">{pctOfTotal.toFixed(0)}% of budget</span>
                  </div>
                </div>

                {/* Metrics with bars */}
                <div className="px-4 pb-4 space-y-3">
                  {metrics.map((m) => (
                    <div key={m.label}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</span>
                        <span className={`text-sm font-mono font-bold ${m.colorClass || "text-foreground"}`}>{m.value}</span>
                      </div>
                      {m.showBar && m.barPct !== null && (
                        <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${m.barPct}%`, backgroundColor: color, opacity: 0.45 }}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Secondary metrics row */}
                  <div className="flex gap-4 pt-2 border-t border-border/40">
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">CTR</p>
                      <p className="text-xs font-mono font-medium text-foreground">{row.ctr.toFixed(1)}%</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">CPA</p>
                      <p className="text-xs font-mono font-medium text-foreground">${row.cpa.toFixed(2)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">CPM</p>
                      <p className="text-xs font-mono font-medium text-foreground">${row.cpm.toFixed(2)}</p>
                    </div>
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
