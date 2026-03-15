/* refreshed */
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Layers, TrendingUp, MousePointerClick, ShoppingCart, Eye, Zap, Video, ChevronRight, ChevronDown } from "lucide-react";
import type { CreativeAsset, Channel } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";
import { useMemo, useRef, useCallback, useState } from "react";

/* ─── Helpers ─── */

function fmt(v: number, type: "pct" | "dollar" | "x" | "num" | "dollar2" | "sec" | "rank"): string {
  if (type === "pct") return `${v.toFixed(1)}%`;
  if (type === "dollar") return `$${v.toFixed(0)}`;
  if (type === "dollar2") return `$${v.toFixed(2)}`;
  if (type === "x") return `${v.toFixed(1)}x`;
  if (type === "sec") return `${v.toFixed(1)}s`;
  if (type === "rank") return v >= 2 ? "Above" : v >= 1 ? "Avg" : "Below";
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

type MetricFormat = "pct" | "dollar" | "x" | "num" | "dollar2" | "sec" | "rank";
type MetricDef = { key: string; label: string; group: string; get: (a: CreativeAsset) => number; format: MetricFormat; higherIsBetter: boolean; videoOnly?: boolean };

const rankVal = (r: "above_average" | "average" | "below_average") => r === "above_average" ? 2 : r === "average" ? 1 : 0;

const ALL_METRICS: MetricDef[] = [
  // Efficiency
  { key: "roas", label: "ROAS", group: "Efficiency", get: a => a.roas, format: "x", higherIsBetter: true },
  { key: "cpa", label: "CPA", group: "Efficiency", get: a => a.costPerResult, format: "dollar2", higherIsBetter: false },
  { key: "cpm", label: "CPM", group: "Efficiency", get: a => a.cpm, format: "dollar2", higherIsBetter: false },
  { key: "cpc", label: "CPC", group: "Efficiency", get: a => a.cpc, format: "dollar2", higherIsBetter: false },
  { key: "cpcAll", label: "CPC All", group: "Efficiency", get: a => a.cpcAll, format: "dollar2", higherIsBetter: false },
  
  // Delivery
  { key: "impressions", label: "Impr", group: "Delivery", get: a => a.impressions, format: "num", higherIsBetter: true },
  { key: "reach", label: "Reach", group: "Delivery", get: a => a.reach, format: "num", higherIsBetter: true },
  { key: "freq", label: "Freq", group: "Delivery", get: a => a.frequency, format: "num", higherIsBetter: false },

  // Click & Traffic
  { key: "ctr", label: "CTR", group: "Click", get: a => a.ctr, format: "pct", higherIsBetter: true },
  { key: "ctrAll", label: "CTR All", group: "Click", get: a => a.ctrAll, format: "pct", higherIsBetter: true },
  { key: "clicks", label: "Clicks", group: "Click", get: a => a.clicks, format: "num", higherIsBetter: true },
  { key: "linkClicks", label: "Link Clicks", group: "Click", get: a => a.linkClicks, format: "num", higherIsBetter: true },
  { key: "outbound", label: "Outbound", group: "Click", get: a => a.outboundClicks, format: "num", higherIsBetter: true },

  // Engagement
  { key: "engRate", label: "Eng%", group: "Engagement", get: a => (a.postReactions + a.postShares + a.postSaves) / a.impressions * 100, format: "pct", higherIsBetter: true },
  { key: "reactions", label: "React.", group: "Engagement", get: a => a.postReactions, format: "num", higherIsBetter: true },
  { key: "comments", label: "Comm.", group: "Engagement", get: a => a.postComments, format: "num", higherIsBetter: true },
  { key: "shares", label: "Shares", group: "Engagement", get: a => a.postShares, format: "num", higherIsBetter: true },
  { key: "saves", label: "Saves", group: "Engagement", get: a => a.postSaves, format: "num", higherIsBetter: true },

  // Funnel (raw)
  { key: "lpv", label: "LPV", group: "Funnel", get: a => a.landingPageViews, format: "num", higherIsBetter: true },
  { key: "atc", label: "ATC", group: "Funnel", get: a => a.addToCart, format: "num", higherIsBetter: true },
  { key: "ic", label: "Checkout", group: "Funnel", get: a => a.initiateCheckout, format: "num", higherIsBetter: true },
  { key: "conv", label: "Purch.", group: "Funnel", get: a => a.conversions, format: "num", higherIsBetter: true },
  { key: "revenue", label: "Revenue", group: "Funnel", get: a => a.purchaseValue, format: "dollar", higherIsBetter: true },

  // Funnel rates
  { key: "clickToLpv", label: "Click→LPV", group: "Funnel Rates", get: a => a.linkClicks > 0 ? (a.landingPageViews / a.linkClicks) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "lpvToAtc", label: "LPV→ATC", group: "Funnel Rates", get: a => a.landingPageViews > 0 ? (a.addToCart / a.landingPageViews) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "atcToIc", label: "ATC→IC", group: "Funnel Rates", get: a => a.addToCart > 0 ? (a.initiateCheckout / a.addToCart) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "icToPurch", label: "IC→Purch", group: "Funnel Rates", get: a => a.initiateCheckout > 0 ? (a.conversions / a.initiateCheckout) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "convRate", label: "Conv%", group: "Funnel Rates", get: a => a.conversionRate, format: "pct", higherIsBetter: true },

  // Video
  { key: "avgWatch", label: "Avg Watch", group: "Video", get: a => a.avgWatchTime || 0, format: "sec", higherIsBetter: true, videoOnly: true },
  { key: "thruRate", label: "ThruPlay%", group: "Video", get: a => a.videoPlays && a.thruPlays ? (a.thruPlays / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw25", label: "25%", group: "Video", get: a => a.videoPlays && a.videoWatched25 ? (a.videoWatched25 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw50", label: "50%", group: "Video", get: a => a.videoPlays && a.videoWatched50 ? (a.videoWatched50 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw75", label: "75%", group: "Video", get: a => a.videoPlays && a.videoWatched75 ? (a.videoWatched75 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw95", label: "95%", group: "Video", get: a => a.videoPlays && a.videoWatched95 ? (a.videoWatched95 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },

  // Quality Rankings (Meta)
  { key: "qualRank", label: "Quality", group: "Quality", get: a => rankVal(a.qualityRanking), format: "rank", higherIsBetter: true },
  { key: "engRank", label: "Eng Rank", group: "Quality", get: a => rankVal(a.engagementRateRanking), format: "rank", higherIsBetter: true },
  { key: "convRank", label: "Conv Rank", group: "Quality", get: a => rankVal(a.conversionRateRanking), format: "rank", higherIsBetter: true },
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

interface AssetRow {
  asset: CreativeAsset;
  attrValue: string;
  metrics: { value: number; signal: "best" | "worst" | "neutral"; pctVsAvg: number }[];
}

interface CorrelationCard {
  attr: AttrDef;
  groups: { value: string; assets: AssetRow[] }[];
  takeaway: string;
}

function getActiveMetrics(assets: CreativeAsset[]): MetricDef[] {
  const hasVideo = assets.some(a => a.type === "video");
  return ALL_METRICS.filter(m => !m.videoOnly || hasVideo);
}

function buildCorrelationCards(assets: CreativeAsset[], metrics: MetricDef[]): CorrelationCard[] {
  const cards: CorrelationCard[] = [];
  const globalAvgs = metrics.map(m => assets.reduce((s, a) => s + m.get(a), 0) / assets.length);

  for (const attr of PROFILE_ATTRS) {
    const groupMap = new Map<string, CreativeAsset[]>();
    for (const a of assets) {
      const val = attr.get(a);
      if (!groupMap.has(val)) groupMap.set(val, []);
      groupMap.get(val)!.push(a);
    }
    if (groupMap.size < 2) continue;

    const bestIdx: number[] = [];
    const worstIdx: number[] = [];
    for (let mi = 0; mi < metrics.length; mi++) {
      const m = metrics[mi];
      let bestVal = m.higherIsBetter ? -Infinity : Infinity;
      let worstVal = m.higherIsBetter ? Infinity : -Infinity;
      let bi = 0, wi = 0;
      assets.forEach((a, i) => {
        const v = m.get(a);
        if (m.higherIsBetter ? v > bestVal : v < bestVal) { bestVal = v; bi = i; }
        if (m.higherIsBetter ? v < worstVal : v > worstVal) { worstVal = v; wi = i; }
      });
      const spread = (bestVal + worstVal) / 2;
      const pctSpread = spread > 0 ? Math.abs(bestVal - worstVal) / spread : 0;
      bestIdx.push(pctSpread > 0.1 ? bi : -1);
      worstIdx.push(pctSpread > 0.1 ? wi : -1);
    }

    const groups: { value: string; assets: AssetRow[] }[] = [];
    const sortedGroups = [...groupMap.entries()].sort((a, b) => {
      const avgA = a[1].reduce((s, x) => s + x.roas, 0) / a[1].length;
      const avgB = b[1].reduce((s, x) => s + x.roas, 0) / b[1].length;
      return avgB - avgA;
    });

    for (const [val, group] of sortedGroups) {
      const assetRows: AssetRow[] = group
        .sort((a, b) => b.roas - a.roas)
        .map(asset => ({
          asset,
          attrValue: val,
          metrics: metrics.map((m, mi) => {
            const v = m.get(asset);
            const ai = assets.indexOf(asset);
            return {
              value: v,
              signal: bestIdx[mi] === ai ? "best" as const : worstIdx[mi] === ai ? "worst" as const : "neutral" as const,
              pctVsAvg: globalAvgs[mi] > 0 ? Math.round(((v - globalAvgs[mi]) / globalAvgs[mi]) * 100) : 0,
            };
          }),
        }));
      groups.push({ value: val, assets: assetRows });
    }

    let takeaway = "";
    if (sortedGroups.length >= 2) {
      const topGroup = sortedGroups[0];
      const botGroup = sortedGroups[sortedGroups.length - 1];
      const topAvgRoas = topGroup[1].reduce((s, a) => s + a.roas, 0) / topGroup[1].length;
      const botAvgRoas = botGroup[1].reduce((s, a) => s + a.roas, 0) / botGroup[1].length;
      const diff = botAvgRoas > 0 ? Math.round(((topAvgRoas - botAvgRoas) / botAvgRoas) * 100) : 0;
      takeaway = diff > 5 ? `${topGroup[0]} outperforms ${botGroup[0]} by ${diff}% on ROAS` : `Similar performance across ${attr.label.toLowerCase()} values`;
    }

    cards.push({ attr, groups, takeaway });
  }

  return cards;
}

const cellStyles: Record<string, string> = {
  best: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  worst: "bg-destructive/10 text-destructive",
  neutral: "text-foreground",
};

const groupIcons: Record<string, typeof TrendingUp> = {
  Efficiency: TrendingUp,
  Delivery: Eye,
  Click: MousePointerClick,
  Engagement: Zap,
  Funnel: ShoppingCart,
  "Funnel Rates": ShoppingCart,
  Video: Video,
  Quality: BarChart3,
};

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];
  const channel: Channel | null = assets.length > 0 ? assets[0].channel : null;

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollTo = useCallback((key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const { ranked, correlationCards, metrics, metricGroups, assetGroupScores } = useMemo(() => {
    const ranked = [...assets].sort((a, b) => b.roas - a.roas);
    const metrics = getActiveMetrics(assets);
    const correlationCards = buildCorrelationCards(assets, metrics);
    const metricGroups: { name: string; metrics: MetricDef[] }[] = [];
    const seen = new Set<string>();
    for (const m of metrics) {
      if (!seen.has(m.group)) {
        seen.add(m.group);
        metricGroups.push({ name: m.group, metrics: metrics.filter(x => x.group === m.group) });
      }
    }

    // Compute per-asset per-group scores (0-100)
    const assetGroupScores: Map<string, Map<string, number>> = new Map(); // assetId -> groupName -> score
    for (const a of ranked) {
      const scores = new Map<string, number>();
      for (const g of metricGroups) {
        const vals = g.metrics.map(m => {
          const allVals = assets.map(x => m.get(x));
          const min = Math.min(...allVals);
          const max = Math.max(...allVals);
          const range = max - min;
          if (range === 0) return 50;
          const norm = (m.get(a) - min) / range;
          return m.higherIsBetter ? norm * 100 : (1 - norm) * 100;
        });
        scores.set(g.name, Math.round(vals.reduce((s, v) => s + v, 0) / vals.length));
      }
      assetGroupScores.set(a.id, scores);
    }

    return { ranked, correlationCards, metrics, metricGroups, assetGroupScores };
  }, [assets]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

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
  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const scoreColor = (s: number) =>
    s >= 70 ? "text-emerald-600 dark:text-emerald-400" : s >= 40 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
  const scoreBg = (s: number) =>
    s >= 70 ? "bg-emerald-500/10" : s >= 40 ? "bg-amber-500/10" : "bg-destructive/10";

  const groupNames = metricGroups.map(g => g.name);

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

        {/* ═══ SUMMARY SCORECARD TABLE ═══ */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground mb-2">Performance Summary</h2>
          <div className="rounded-lg border border-border overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20 border-b border-border/40">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-4 py-2 text-left w-[40px]">#</th>
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-2 text-left">Asset</th>
                  {groupNames.map(name => {
                    const Icon = groupIcons[name] || BarChart3;
                    return (
                      <th key={name} className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 py-2 text-center">
                        <button
                          onClick={() => { toggleSection(name); setTimeout(() => scrollTo(name), 100); }}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          <Icon className="w-3 h-3" />
                          <span>{name}</span>
                        </button>
                      </th>
                    );
                  })}
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 py-2 text-center">
                    <button
                      onClick={() => { toggleSection("profile"); setTimeout(() => scrollTo("profile"), 100); }}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Overall</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((asset, i) => {
                  const scores = assetGroupScores.get(asset.id);
                  const overall = scores ? Math.round([...scores.values()].reduce((s, v) => s + v, 0) / scores.size) : 0;
                  return (
                    <tr key={asset.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2 text-[11px] font-mono text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img src={asset.thumbnail} alt={asset.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-foreground truncate">{asset.name}</p>
                            <p className="text-[8px] font-mono text-muted-foreground">{asset.id}</p>
                          </div>
                        </div>
                      </td>
                      {groupNames.map(name => {
                        const score = scores?.get(name) ?? 0;
                        return (
                          <td key={name} className="px-2 py-2 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-sm font-bold font-mono ${scoreColor(score)}`}>{score}</span>
                              <div className="w-10 h-1 bg-muted/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${scoreBg(score).replace('/10', '')}`} style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center">
                        <span className={`text-sm font-bold font-mono ${scoreColor(overall)}`}>{overall}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ 1. Full Performance Comparison by Metric Group ═══ */}
        {metricGroups.map(group => {
          const Icon = groupIcons[group.name] || BarChart3;
          return (
            <div key={group.name} ref={el => { sectionRefs.current[group.name] = el; }} className="scroll-mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground">{group.name}</h2>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/20 border-b border-border/40">
                      <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-4 py-1.5 text-left w-[40px]">#</th>
                      <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 text-left">Asset</th>
                      {group.name === "Efficiency" && (
                        <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 text-right">Spend</th>
                      )}
                      {group.metrics.map(m => (
                        <th key={m.key} className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 text-right">{m.label}</th>
                      ))}
                      {group.name === "Efficiency" && (
                        <th className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-3 py-1.5 w-[80px]" />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((asset, i) => {
                      const barW = maxRoas > 0 ? (asset.roas / maxRoas) * 100 : 0;
                      const barColor = asset.roas >= 5 ? "bg-emerald-500" : asset.roas >= 3 ? "bg-primary" : "bg-destructive";
                      return (
                        <tr key={asset.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-2 text-[11px] font-mono text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <img src={asset.thumbnail} alt={asset.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-foreground truncate">{asset.name}</p>
                                <p className="text-[8px] font-mono text-muted-foreground">{asset.id}</p>
                              </div>
                            </div>
                          </td>
                          {group.name === "Efficiency" && (
                            <td className="px-3 py-2 text-right text-[11px] font-mono text-muted-foreground">${asset.spend.toLocaleString()}</td>
                          )}
                          {group.metrics.map(m => {
                            const val = m.get(asset);
                            const avg = assets.reduce((s, a) => s + m.get(a), 0) / assets.length;
                            const pctDiff = avg > 0 ? ((val - avg) / avg) * 100 : 0;
                            const isGood = m.higherIsBetter ? pctDiff > 15 : pctDiff < -15;
                            const isBad = m.higherIsBetter ? pctDiff < -15 : pctDiff > 15;
                            const color = isGood ? "text-emerald-600" : isBad ? "text-destructive" : "text-foreground";
                            return (
                              <td key={m.key} className={`px-3 py-2 text-right text-[11px] font-mono font-semibold ${color}`}>
                                {fmt(val, m.format)}
                              </td>
                            );
                          })}
                          {group.name === "Efficiency" && (
                            <td className="px-3 py-2">
                              <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barW}%` }} />
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* ═══ 2. Attribute × Metric Correlation ═══ */}
        <div ref={el => { sectionRefs.current["correlation"] = el; }} className="scroll-mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground">Profile × Metric Correlation</h2>
            <span className="text-[10px] text-muted-foreground">— how each creative attribute affects performance</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {correlationCards.map(card => (
              <div key={card.attr.key} className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted/20 px-3 py-2 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{card.attr.label}</span>
                    <span className="text-[9px] text-muted-foreground">{card.groups.length} values</span>
                  </div>
                  {card.takeaway && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 italic">{card.takeaway}</p>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-3 py-1 text-left sticky left-0 bg-background z-10 min-w-[140px]">Asset</th>
                        <th className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-2 py-1 text-left min-w-[70px]">{card.attr.label}</th>
                        {metrics.map(m => (
                          <th key={m.key} className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-1.5 py-1 text-right whitespace-nowrap">{m.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {card.groups.flatMap(group =>
                        group.assets.map(row => (
                          <tr key={row.asset.id} className="border-b border-border/15 last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-3 py-1.5 sticky left-0 bg-background z-10">
                              <div className="flex items-center gap-1.5">
                                <img src={row.asset.thumbnail} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                                <span className="text-[10px] font-semibold text-foreground truncate max-w-[100px]">{row.asset.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-[10px] font-mono text-muted-foreground">{group.value}</td>
                            {row.metrics.map((mc, mi) => (
                              <td key={metrics[mi].key} className={`px-1.5 py-1.5 text-right ${cellStyles[mc.signal]}`}>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-mono font-semibold whitespace-nowrap">{fmt(mc.value, metrics[mi].format)}</span>
                                  {mc.signal !== "neutral" && (
                                    <span className="text-[7px] font-mono opacity-70">
                                      {mc.pctVsAvg > 0 ? "▲" : "▼"}{Math.abs(mc.pctVsAvg)}%
                                    </span>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 3. Per-Asset Profile Comparison ═══ */}
        <div ref={el => { sectionRefs.current["profile"] = el; }} className="scroll-mt-4">
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
