import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Layers, TrendingUp } from "lucide-react";
import type { CreativeAsset, Channel } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";
import { useMemo } from "react";

/* ─── Helpers ─── */

function fmt(v: number, type: "pct" | "dollar" | "x" | "num" | "dollar2"): string {
  if (type === "pct") return `${v.toFixed(1)}%`;
  if (type === "dollar") return `$${v.toFixed(0)}`;
  if (type === "dollar2") return `$${v.toFixed(2)}`;
  if (type === "x") return `${v.toFixed(1)}x`;
  return v.toFixed(0);
}

type MetricDef = { key: string; label: string; get: (a: CreativeAsset) => number; format: "pct" | "dollar" | "x" | "num" | "dollar2"; higherIsBetter: boolean };

const METRICS: MetricDef[] = [
  { key: "roas", label: "ROAS", get: a => a.roas, format: "x", higherIsBetter: true },
  { key: "ctr", label: "CTR", get: a => a.ctr, format: "pct", higherIsBetter: true },
  { key: "cpm", label: "CPM", get: a => a.cpm, format: "dollar2", higherIsBetter: false },
  { key: "cpc", label: "CPC", get: a => a.cpc, format: "dollar2", higherIsBetter: false },
  { key: "conv", label: "Conv%", get: a => a.conversionRate, format: "pct", higherIsBetter: true },
  { key: "cpa", label: "CPA", get: a => a.costPerResult, format: "dollar2", higherIsBetter: false },
  { key: "eng", label: "Eng%", get: a => (a.postReactions + a.postShares + a.postSaves) / a.impressions * 100, format: "pct", higherIsBetter: true },
  { key: "freq", label: "Freq", get: a => a.frequency, format: "num", higherIsBetter: false },
];

type AttrDef = { key: string; label: string; get: (a: CreativeAsset) => string };

const PROFILE_ATTRS: AttrDef[] = [
  { key: "format", label: "Format", get: a => a.type.charAt(0).toUpperCase() + a.type.slice(1) },
  { key: "aspect", label: "Aspect Ratio", get: a => a.creativeProfile.aspectRatio },
  { key: "duration", label: "Duration", get: a => {
    const d = a.creativeProfile.videoDuration;
    if (!d) return "Static";
    if (d <= 15) return "≤15s";
    if (d <= 25) return "16-25s";
    return "26s+";
  }},
  { key: "motion", label: "Motion", get: a => a.creativeProfile.motionIntensity },
  { key: "contrast", label: "Color Contrast", get: a => a.creativeProfile.colorContrast },
  { key: "brandProm", label: "Brand Prominence", get: a => a.creativeProfile.brandProminence },
  { key: "brandCons", label: "Brand Consistency", get: a => a.creativeProfile.brandConsistency },
  { key: "funnel", label: "Funnel Stage", get: a => a.creativeProfile.funnelStage },
  { key: "cta", label: "CTA", get: a => a.creativeProfile.callToAction },
  { key: "prod3s", label: "Product in 3s", get: a => a.creativeProfile.productInFirst3s ? "Yes" : "No" },
];

interface CorrelationCell {
  value: number;
  count: number;
  signal: "best" | "worst" | "neutral";
}

interface CorrelationRow {
  attrValue: string;
  count: number;
  metrics: { value: number; signal: "best" | "worst" | "neutral"; pctVsAvg: number }[];
}

interface CorrelationCard {
  attr: AttrDef;
  rows: CorrelationRow[];
  takeaway: string; // human-readable insight
}

function buildCorrelationCards(assets: CreativeAsset[]): CorrelationCard[] {
  const cards: CorrelationCard[] = [];

  for (const attr of PROFILE_ATTRS) {
    const groups = new Map<string, CreativeAsset[]>();
    for (const a of assets) {
      const val = attr.get(a);
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(a);
    }
    if (groups.size < 2) continue;

    // Compute averages per group per metric
    const groupAvgs = new Map<string, number[]>(); // attrVal -> metric averages
    for (const [val, group] of groups) {
      const avgs = METRICS.map(m => group.reduce((s, a) => s + m.get(a), 0) / group.length);
      groupAvgs.set(val, avgs);
    }

    // Global avg per metric across all selected
    const globalAvgs = METRICS.map(m => assets.reduce((s, a) => s + m.get(a), 0) / assets.length);

    // Find best/worst per metric
    const bestKeys: string[] = [];
    const worstKeys: string[] = [];
    for (let mi = 0; mi < METRICS.length; mi++) {
      const m = METRICS[mi];
      let bestVal = m.higherIsBetter ? -Infinity : Infinity;
      let worstVal = m.higherIsBetter ? Infinity : -Infinity;
      let bestKey = "", worstKey = "";
      for (const [val, avgs] of groupAvgs) {
        const v = avgs[mi];
        if (m.higherIsBetter) {
          if (v > bestVal) { bestVal = v; bestKey = val; }
          if (v < worstVal) { worstVal = v; worstKey = val; }
        } else {
          if (v < bestVal) { bestVal = v; bestKey = val; }
          if (v > worstVal) { worstVal = v; worstKey = val; }
        }
      }
      const spread = (bestVal + worstVal) / 2;
      const pctSpread = spread > 0 ? Math.abs(bestVal - worstVal) / spread : 0;
      bestKeys.push(pctSpread > 0.1 ? bestKey : "");
      worstKeys.push(pctSpread > 0.1 ? worstKey : "");
    }

    // Build rows
    const rows: CorrelationRow[] = [];
    for (const [val, avgs] of groupAvgs) {
      rows.push({
        attrValue: val,
        count: groups.get(val)!.length,
        metrics: avgs.map((v, mi) => ({
          value: v,
          signal: bestKeys[mi] === val ? "best" : worstKeys[mi] === val ? "worst" : "neutral",
          pctVsAvg: globalAvgs[mi] > 0 ? Math.round(((v - globalAvgs[mi]) / globalAvgs[mi]) * 100) : 0,
        })),
      });
    }
    // Sort rows by ROAS (first metric) descending
    rows.sort((a, b) => b.metrics[0].value - a.metrics[0].value);

    // Generate takeaway: find the most impactful difference
    let takeaway = "";
    const roasIdx = 0;
    if (rows.length >= 2) {
      const topRow = rows[0];
      const botRow = rows[rows.length - 1];
      const roasDiff = Math.round(((topRow.metrics[roasIdx].value - botRow.metrics[roasIdx].value) / botRow.metrics[roasIdx].value) * 100);
      
      // Find which other metrics differ most
      let biggestDiffMetric = "";
      let biggestDiffPct = 0;
      for (let mi = 1; mi < METRICS.length; mi++) {
        const diff = Math.abs(topRow.metrics[mi].pctVsAvg - botRow.metrics[mi].pctVsAvg);
        if (diff > biggestDiffPct) {
          biggestDiffPct = diff;
          biggestDiffMetric = METRICS[mi].label;
        }
      }
      
      if (roasDiff > 5) {
        takeaway = `${topRow.attrValue} delivers ${roasDiff}% higher ROAS than ${botRow.attrValue}`;
        if (biggestDiffMetric && biggestDiffPct > 15) {
          takeaway += `, driven by ${biggestDiffMetric}`;
        }
      } else {
        takeaway = `No significant ROAS difference between ${attr.label.toLowerCase()} values`;
      }
    }

    cards.push({ attr, rows, takeaway });
  }

  return cards;
}

const cellStyles: Record<string, string> = {
  best: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  worst: "bg-destructive/10 text-destructive",
  neutral: "text-foreground",
};

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];
  const channel: Channel | null = assets.length > 0 ? assets[0].channel : null;

  const { ranked, correlationTable } = useMemo(() => {
    const ranked = [...assets].sort((a, b) => b.roas - a.roas);
    const correlationTable = buildCorrelationTable(assets);
    return { ranked, correlationTable };
  }, [assets]);

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-muted-foreground text-sm mt-4">No assets selected.</p>
      </div>
    );
  }

  const maxRoas = Math.max(...assets.map(a => a.roas));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-semibold text-foreground">Creative Diagnostics</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${channelConfig[channel!]?.bgClass}`}>
            {channelConfig[channel!]?.label}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">{assets.length} assets</span>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ═══ 1. Performance Ranking ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground">Performance Ranking</h2>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20 border-b border-border/40">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-4 py-1.5 text-left w-[40px]">#</th>
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 text-left">Asset</th>
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 text-right">Spend</th>
                  {METRICS.map(m => (
                    <th key={m.key} className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 text-right">{m.label}</th>
                  ))}
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 w-[100px]" />
                </tr>
              </thead>
              <tbody>
                {ranked.map((asset, i) => {
                  const barW = maxRoas > 0 ? (asset.roas / maxRoas) * 100 : 0;
                  const roasColor = asset.roas >= 5 ? "text-emerald-600" : asset.roas >= 3 ? "text-foreground" : "text-destructive";
                  const barColor = asset.roas >= 5 ? "bg-emerald-500" : asset.roas >= 3 ? "bg-primary" : "bg-destructive";
                  
                  return (
                    <tr key={asset.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2 text-[11px] font-mono text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img src={asset.thumbnail} alt={asset.name} className="w-7 h-7 rounded object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-foreground truncate">{asset.name}</p>
                            <p className="text-[9px] font-mono text-muted-foreground">{asset.id} · {asset.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-[11px] font-mono text-muted-foreground">${asset.spend.toLocaleString()}</td>
                      {METRICS.map(m => {
                        const val = m.get(asset);
                        const avg = assets.reduce((s, a) => s + m.get(a), 0) / assets.length;
                        const pctDiff = avg > 0 ? ((val - avg) / avg) * 100 : 0;
                        const isGood = m.higherIsBetter ? pctDiff > 15 : pctDiff < -15;
                        const isBad = m.higherIsBetter ? pctDiff < -15 : pctDiff > 15;
                        const color = m.key === "roas" ? roasColor : isGood ? "text-emerald-600" : isBad ? "text-destructive" : "text-foreground";
                        return (
                          <td key={m.key} className={`px-3 py-2 text-right text-[11px] font-mono font-semibold ${color}`}>
                            {fmt(val, m.format)}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2">
                        <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barW}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ 2. Attribute × Metric Correlation Tables ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground">Profile × Metric Correlation</h2>
            <span className="text-[10px] text-muted-foreground">— avg metric per attribute value · <span className="text-emerald-600">■ best</span> · <span className="text-destructive">■ worst</span></span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PROFILE_ATTRS.map(attr => {
              const attrData = correlationTable.get(attr.key);
              if (!attrData || attrData.size < 2) return null;
              
              const attrValues = [...attrData.keys()].sort();
              
              return (
                <div key={attr.key} className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/20 px-3 py-1.5 border-b border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{attr.label}</span>
                    <span className="text-[9px] text-muted-foreground ml-2">({attrValues.length} values)</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-3 py-1 text-left">Value</th>
                        <th className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-2 py-1 text-center w-[28px]">n</th>
                        {METRICS.map(m => (
                          <th key={m.key} className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-2 py-1 text-right">{m.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attrValues.map(val => {
                        const metricMap = attrData.get(val)!;
                        const count = metricMap.values().next().value?.count || 0;
                        return (
                          <tr key={val} className="border-b border-border/15 last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-3 py-1.5 text-[11px] font-semibold text-foreground">{val}</td>
                            <td className="px-2 py-1.5 text-center text-[9px] font-mono text-muted-foreground">{count}</td>
                            {METRICS.map(m => {
                              const cell = metricMap.get(m.key)!;
                              return (
                                <td key={m.key} className={`px-2 py-1.5 text-right text-[11px] font-mono font-semibold ${cellBg[cell.signal]}`}>
                                  {fmt(cell.value, m.format)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 3. Per-Asset Profile Comparison ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground">Asset Profile Grid</h2>
            <span className="text-[10px] text-muted-foreground">— sorted by ROAS · differences marked <span className="text-primary">●</span></span>
          </div>
          <div className="rounded-lg border border-border overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-4 py-2 text-left sticky left-0 bg-muted/20 w-[120px]">Attribute</th>
                  {ranked.map(a => (
                    <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="truncate max-w-[80px] block">{a.name}</span>
                        <span className={`text-[10px] font-mono ${a.roas >= 5 ? "text-emerald-600" : a.roas >= 3 ? "text-foreground" : "text-destructive"}`}>{a.roas}x</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROFILE_ATTRS.map(attr => {
                  const vals = ranked.map(a => attr.get(a));
                  const diff = !vals.every(v => v === vals[0]);
                  return (
                    <tr key={attr.key} className={`border-b border-border/20 last:border-0 ${diff ? "bg-primary/[0.02]" : ""}`}>
                      <td className={`px-4 py-1.5 text-[10px] font-semibold sticky left-0 ${diff ? "text-foreground bg-primary/[0.02]" : "text-muted-foreground bg-background"}`}>
                        {attr.label}{diff && <span className="ml-1 text-primary text-[8px]">●</span>}
                      </td>
                      {ranked.map(a => (
                        <td key={a.id} className={`px-3 py-1.5 text-center text-[11px] font-mono ${diff ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                          {attr.get(a)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
