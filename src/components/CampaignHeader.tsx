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
  const remaining = campaign.totalBudget - totalSpend;
  const bestRoas = channelBreakdown.length > 0 ? Math.max(...channelBreakdown.map(c => c.roas)) : 0;

  // Max values for inline comparison bars
  const maxSpend = Math.max(...channelBreakdown.map(c => c.spend), 1);
  const maxConv = Math.max(...channelBreakdown.map(c => c.conversions), 1);
  const maxRev = Math.max(...channelBreakdown.map(c => c.revenue), 1);

  const columns = [
    { key: "spend", label: "Spend", format: (r: typeof channelBreakdown[0]) => `$${r.spend.toLocaleString()}`, max: maxSpend, val: (r: typeof channelBreakdown[0]) => r.spend, bar: true },
    { key: "roas", label: "ROAS", format: (r: typeof channelBreakdown[0]) => `${r.roas.toFixed(1)}x`, max: 0, val: () => 0, bar: false, colorFn: (r: typeof channelBreakdown[0]) => r.roas >= 4 ? "text-emerald-600" : r.roas >= 2 ? "text-foreground" : "text-destructive" },
    { key: "conv", label: "Conv.", format: (r: typeof channelBreakdown[0]) => r.conversions.toLocaleString(), max: maxConv, val: (r: typeof channelBreakdown[0]) => r.conversions, bar: true },
    { key: "ctr", label: "CTR", format: (r: typeof channelBreakdown[0]) => `${r.ctr.toFixed(1)}%`, max: 0, val: () => 0, bar: false },
    { key: "cpa", label: "CPA", format: (r: typeof channelBreakdown[0]) => `$${r.cpa.toFixed(2)}`, max: 0, val: () => 0, bar: false },
    { key: "cpm", label: "CPM", format: (r: typeof channelBreakdown[0]) => `$${r.cpm.toFixed(2)}`, max: 0, val: () => 0, bar: false },
    { key: "revenue", label: "Revenue", format: (r: typeof channelBreakdown[0]) => `$${r.revenue.toLocaleString()}`, max: maxRev, val: (r: typeof channelBreakdown[0]) => r.revenue, bar: true },
  ];

  return (
    <div>
      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{campaign.name}</h1>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              campaign.status === "active" ? "bg-accent/10 text-accent-teal" : "bg-secondary text-muted-foreground"
            }`}>{campaign.status}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {campaign.startDate} → {campaign.endDate} · {campaign.assets.length} assets
          </p>
        </div>
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
          <div className="w-20">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(spendPct, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Compact comparison table with inline bars */}
      {channelBreakdown.length > 1 && (
        <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Platform</th>
                {columns.map((col) => (
                  <th key={col.key} className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-2 text-right">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channelBreakdown.map((row) => {
                const isBest = row.roas === bestRoas;
                const color = channelConfig[row.channel].color;
                return (
                  <tr key={row.channel} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[13px] font-semibold text-foreground">{channelConfig[row.channel].label}</span>
                        {isBest && (
                          <span className="text-[7px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-500/10 px-1 py-px rounded leading-tight">
                            ★
                          </span>
                        )}
                      </div>
                    </td>
                    {columns.map((col) => {
                      const textColor = col.colorFn ? col.colorFn(row) : "text-foreground";
                      const barPct = col.bar ? (col.val(row) / col.max) * 100 : 0;
                      return (
                        <td key={col.key} className="px-3 py-2.5">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`text-xs font-mono font-semibold ${textColor} ${col.key === "roas" ? "font-bold" : ""}`}>
                              {col.format(row)}
                            </span>
                            {col.bar && (
                              <div className="w-full h-[3px] bg-muted/30 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.4 }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CampaignHeader;
