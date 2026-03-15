import { useMemo } from "react";
import type { Campaign, Channel } from "@/data/mockData";
import { channelConfig } from "./ChannelIcon";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

      {/* Pie chart + performance table */}
      {channelBreakdown.length > 1 && (
        <div className="flex gap-6 items-start">
          {/* Pie Chart */}
          <div className="flex-shrink-0 w-[200px]">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-bold mb-3">Spend Allocation</p>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={channelBreakdown.map((row) => ({
                    name: channelConfig[row.channel].label,
                    value: row.spend,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {channelBreakdown.map((row) => (
                    <Cell key={row.channel} fill={channelConfig[row.channel].color} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Spend"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-col gap-1.5 mt-2">
              {channelBreakdown.map((row) => {
                const pct = totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0;
                return (
                  <div key={row.channel} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: channelConfig[row.channel].color, opacity: 0.8 }}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground">{channelConfig[row.channel].label}</span>
                    <span className="text-[11px] font-mono text-foreground ml-auto">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance table */}
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-bold mb-3">Platform Performance</p>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30">
                    {["Platform", "Spend", "ROAS", "Conv.", "CTR", "CPA", "CPM", "Revenue"].map((h, i) => (
                      <th key={h} className={`text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-2.5 ${i > 0 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {channelBreakdown.map((row) => {
                    const isBest = row.roas === bestRoas;
                    const roasColor = row.roas >= 4 ? "text-emerald-600" : row.roas >= 2 ? "text-foreground" : "text-destructive";
                    return (
                      <tr key={row.channel} className="border-t border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: channelConfig[row.channel].color, opacity: 0.8 }}
                            />
                            <span className="text-xs font-semibold text-foreground">{channelConfig[row.channel].label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{row.assets}a</span>
                            {isBest && (
                              <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.5 rounded">
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-mono font-medium text-foreground">${row.spend.toLocaleString()}</td>
                        <td className={`px-3 py-3 text-right text-xs font-mono font-bold ${roasColor}`}>{row.roas.toFixed(1)}x</td>
                        <td className="px-3 py-3 text-right text-xs font-mono font-medium text-foreground">{row.conversions.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono font-medium text-foreground">{row.ctr.toFixed(1)}%</td>
                        <td className="px-3 py-3 text-right text-xs font-mono font-medium text-foreground">${row.cpa.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono font-medium text-foreground">${row.cpm.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-xs font-mono font-medium text-foreground">${row.revenue.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignHeader;
