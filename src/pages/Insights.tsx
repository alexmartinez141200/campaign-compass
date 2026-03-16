/* refreshed */
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Layers, TrendingUp, MousePointerClick, ShoppingCart, Eye, Zap, Video, X, Rocket, Paintbrush, Target } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import AppSidebar from "@/components/AppSidebar";
import type { CreativeAsset, Channel } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";
import { useMemo, useRef, useCallback, useState } from "react";
import { ChartContainer } from "@/components/ui/chart";

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

type ProfileAxis = {
  key: string;
  label: string;
  shortLabel: string;
  getValue: (asset: CreativeAsset) => string;
  score: (asset: CreativeAsset) => number;
};

const rankVal = (r: "above_average" | "average" | "below_average") => r === "above_average" ? 2 : r === "average" ? 1 : 0;

const ALL_METRICS: MetricDef[] = [
  { key: "roas", label: "ROAS", group: "Efficiency", get: a => a.roas, format: "x", higherIsBetter: true },
  { key: "cpa", label: "CPA", group: "Efficiency", get: a => a.costPerResult, format: "dollar2", higherIsBetter: false },
  { key: "cpm", label: "CPM", group: "Efficiency", get: a => a.cpm, format: "dollar2", higherIsBetter: false },
  { key: "cpc", label: "CPC", group: "Efficiency", get: a => a.cpc, format: "dollar2", higherIsBetter: false },
  { key: "cpcAll", label: "CPC All", group: "Efficiency", get: a => a.cpcAll, format: "dollar2", higherIsBetter: false },
  { key: "impressions", label: "Impr", group: "Delivery", get: a => a.impressions, format: "num", higherIsBetter: true },
  { key: "reach", label: "Reach", group: "Delivery", get: a => a.reach, format: "num", higherIsBetter: true },
  { key: "freq", label: "Freq", group: "Delivery", get: a => a.frequency, format: "num", higherIsBetter: false },
  { key: "ctr", label: "CTR", group: "Click", get: a => a.ctr, format: "pct", higherIsBetter: true },
  { key: "ctrAll", label: "CTR All", group: "Click", get: a => a.ctrAll, format: "pct", higherIsBetter: true },
  { key: "clicks", label: "Clicks", group: "Click", get: a => a.clicks, format: "num", higherIsBetter: true },
  { key: "linkClicks", label: "Link Clicks", group: "Click", get: a => a.linkClicks, format: "num", higherIsBetter: true },
  { key: "outbound", label: "Outbound", group: "Click", get: a => a.outboundClicks, format: "num", higherIsBetter: true },
  { key: "engRate", label: "Eng%", group: "Engagement", get: a => (a.postReactions + a.postShares + a.postSaves) / a.impressions * 100, format: "pct", higherIsBetter: true },
  { key: "reactions", label: "React.", group: "Engagement", get: a => a.postReactions, format: "num", higherIsBetter: true },
  { key: "comments", label: "Comm.", group: "Engagement", get: a => a.postComments, format: "num", higherIsBetter: true },
  { key: "shares", label: "Shares", group: "Engagement", get: a => a.postShares, format: "num", higherIsBetter: true },
  { key: "saves", label: "Saves", group: "Engagement", get: a => a.postSaves, format: "num", higherIsBetter: true },
  { key: "lpv", label: "LPV", group: "Funnel", get: a => a.landingPageViews, format: "num", higherIsBetter: true },
  { key: "atc", label: "ATC", group: "Funnel", get: a => a.addToCart, format: "num", higherIsBetter: true },
  { key: "ic", label: "Checkout", group: "Funnel", get: a => a.initiateCheckout, format: "num", higherIsBetter: true },
  { key: "conv", label: "Purch.", group: "Funnel", get: a => a.conversions, format: "num", higherIsBetter: true },
  { key: "revenue", label: "Revenue", group: "Funnel", get: a => a.purchaseValue, format: "dollar", higherIsBetter: true },
  { key: "clickToLpv", label: "Click→LPV", group: "Funnel Rates", get: a => a.linkClicks > 0 ? (a.landingPageViews / a.linkClicks) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "lpvToAtc", label: "LPV→ATC", group: "Funnel Rates", get: a => a.landingPageViews > 0 ? (a.addToCart / a.landingPageViews) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "atcToIc", label: "ATC→IC", group: "Funnel Rates", get: a => a.addToCart > 0 ? (a.initiateCheckout / a.addToCart) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "icToPurch", label: "IC→Purch", group: "Funnel Rates", get: a => a.initiateCheckout > 0 ? (a.conversions / a.initiateCheckout) * 100 : 0, format: "pct", higherIsBetter: true },
  { key: "convRate", label: "Conv%", group: "Funnel Rates", get: a => a.conversionRate, format: "pct", higherIsBetter: true },
  { key: "avgWatch", label: "Avg Watch", group: "Video", get: a => a.avgWatchTime || 0, format: "sec", higherIsBetter: true, videoOnly: true },
  { key: "thruRate", label: "ThruPlay%", group: "Video", get: a => a.videoPlays && a.thruPlays ? (a.thruPlays / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw25", label: "25%", group: "Video", get: a => a.videoPlays && a.videoWatched25 ? (a.videoWatched25 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw50", label: "50%", group: "Video", get: a => a.videoPlays && a.videoWatched50 ? (a.videoWatched50 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw75", label: "75%", group: "Video", get: a => a.videoPlays && a.videoWatched75 ? (a.videoWatched75 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "vw95", label: "95%", group: "Video", get: a => a.videoPlays && a.videoWatched95 ? (a.videoWatched95 / a.videoPlays) * 100 : 0, format: "pct", higherIsBetter: true, videoOnly: true },
  { key: "qualRank", label: "Quality", group: "Quality", get: a => rankVal(a.qualityRanking), format: "rank", higherIsBetter: true },
  { key: "engRank", label: "Eng Rank", group: "Quality", get: a => rankVal(a.engagementRateRanking), format: "rank", higherIsBetter: true },
  { key: "convRank", label: "Conv Rank", group: "Quality", get: a => rankVal(a.conversionRateRanking), format: "rank", higherIsBetter: true },
];

const profileAxes: ProfileAxis[] = [
  {
    key: "format",
    label: "Format",
    shortLabel: "Format",
    getValue: asset => asset.type,
    score: asset => ({ carousel: 96, video: 88, image: 72 }[asset.type] ?? 70),
  },
  {
    key: "duration",
    label: "Video Duration",
    shortLabel: "Duration",
    getValue: asset => asset.type === "video" && asset.creativeProfile.videoDuration ? `${asset.creativeProfile.videoDuration}s` : "N/A",
    score: asset => {
      const duration = asset.creativeProfile.videoDuration;
      if (!duration) return 72;
      if (duration <= 15) return 92;
      if (duration <= 25) return 84;
      return 70;
    },
  },
  {
    key: "aspect",
    label: "Aspect Ratio",
    shortLabel: "Aspect",
    getValue: asset => asset.creativeProfile.aspectRatio,
    score: asset => ({ "9:16": 95, "4:5": 86, "1:1": 82, "16:9": 70 }[asset.creativeProfile.aspectRatio] ?? 75),
  },
  {
    key: "motion",
    label: "Motion Intensity",
    shortLabel: "Motion",
    getValue: asset => asset.creativeProfile.motionIntensity,
    score: asset => ({ High: 88, Subtle: 95, None: 68 }[asset.creativeProfile.motionIntensity] ?? 70),
  },
  {
    key: "contrast",
    label: "Color Contrast",
    shortLabel: "Contrast",
    getValue: asset => asset.creativeProfile.colorContrast,
    score: asset => ({ High: 89, Medium: 94, Low: 64 }[asset.creativeProfile.colorContrast] ?? 70),
  },
  {
    key: "brandProminence",
    label: "Brand Prominence",
    shortLabel: "Brand",
    getValue: asset => asset.creativeProfile.brandProminence,
    score: asset => ({ Balanced: 96, Subtle: 84, Dominant: 72 }[asset.creativeProfile.brandProminence] ?? 70),
  },
  {
    key: "brandConsistency",
    label: "Brand Consistency",
    shortLabel: "Consistency",
    getValue: asset => asset.creativeProfile.brandConsistency,
    score: asset => ({ High: 96, Medium: 82, Low: 60 }[asset.creativeProfile.brandConsistency] ?? 70),
  },
  {
    key: "funnelStage",
    label: "Funnel Stage",
    shortLabel: "Funnel",
    getValue: asset => asset.creativeProfile.funnelStage,
    score: asset => ({ Consideration: 92, Conversion: 86, Awareness: 80 }[asset.creativeProfile.funnelStage] ?? 75),
  },
  {
    key: "cta",
    label: "Call-to-Action",
    shortLabel: "CTA",
    getValue: asset => asset.creativeProfile.callToAction,
    score: asset => ({ "Shop Now": 95, "Buy Now": 92, "Learn More": 84, "Watch More": 76 }[asset.creativeProfile.callToAction] ?? 78),
  },
  {
    key: "productInFirst3s",
    label: "Product in First 3s",
    shortLabel: "3s Product",
    getValue: asset => asset.creativeProfile.productInFirst3s ? "Yes" : "No",
    score: asset => asset.creativeProfile.productInFirst3s ? 94 : 62,
  },
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
  best: "bg-accent/10 text-accent",
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

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
} as const;

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];
  const channel: Channel | null = assets.length > 0 ? assets[0].channel : null;
  const campaignId: string | null = location.state?.campaignId || null;

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

    const assetGroupScores: Map<string, Map<string, number>> = new Map();
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

  const [openModal, setOpenModal] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || "");

  const rankedWithOverall = useMemo(() => {
    return ranked.map((asset) => {
      const scores = assetGroupScores.get(asset.id);
      const performanceScore = scores ? Math.round([...scores.values()].reduce((s, v) => s + v, 0) / scores.size) : 0;
      return { asset, performanceScore };
    });
  }, [ranked, assetGroupScores]);

  const selectedAsset = rankedWithOverall.find(({ asset }) => asset.id === selectedAssetId)?.asset ?? rankedWithOverall[0]?.asset;
  const selectedPerformanceScore = rankedWithOverall.find(({ asset }) => asset.id === selectedAsset?.id)?.performanceScore ?? 0;

  const radarData = useMemo(() => {
    if (!selectedAsset) return [];
    return profileAxes.map((axis) => ({
      label: axis.shortLabel,
      fullLabel: axis.label,
      value: axis.score(selectedAsset),
      detail: axis.getValue(selectedAsset),
    }));
  }, [selectedAsset]);

  const profileFacts = useMemo(() => {
    if (!selectedAsset) return [];
    return profileAxes.map((axis) => ({
      key: axis.key,
      label: axis.label,
      value: axis.getValue(selectedAsset),
    }));
  }, [selectedAsset]);

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main className="ml-[232px]">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
            <button onClick={() => navigate(-1)} className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/")} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Campaigns
            </button>
            <span className="text-muted-foreground/30 text-xs">›</span>
            <span className="text-[13px] font-medium text-foreground">Creative Diagnostics</span>
          </div>
          <div className="p-6">
            <p className="text-muted-foreground text-sm">No assets selected.</p>
          </div>
        </main>
      </div>
    );
  }

  const scoreColor = (s: number) =>
    s >= 70 ? "text-accent" : s >= 40 ? "text-primary" : "text-destructive";

  const groupNames = metricGroups.map(g => g.name);

  const renderGroupTable = (group: { name: string; metrics: MetricDef[] }) => (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-5 py-2.5 text-left min-w-[220px]">Asset</th>
            {group.name === "Efficiency" && (
              <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right">Spend</th>
            )}
            {group.metrics.map(m => (
              <th key={m.key} className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right">{m.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranked.map((asset) => (
            <tr key={asset.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <img src={asset.thumbnail} alt={asset.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-border/40" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{asset.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50">{asset.id}</p>
                  </div>
                </div>
              </td>
              {group.name === "Efficiency" && (
                <td className="px-4 py-3.5 text-right text-[12px] font-mono text-muted-foreground">${asset.spend.toLocaleString()}</td>
              )}
              {group.metrics.map(m => {
                const val = m.get(asset);
                const avg = assets.reduce((s, a) => s + m.get(a), 0) / assets.length;
                const pctDiff = avg > 0 ? ((val - avg) / avg) * 100 : 0;
                const isGood = m.higherIsBetter ? pctDiff > 15 : pctDiff < -15;
                const isBad = m.higherIsBetter ? pctDiff < -15 : pctDiff > 15;
                const color = isGood ? "text-accent" : isBad ? "text-destructive" : "text-foreground";
                return (
                  <td key={m.key} className={`px-4 py-3.5 text-right text-[12px] font-mono font-semibold ${color}`}>
                    {fmt(val, m.format)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const isCorrelationModal = openModal?.startsWith("correlation:");
  const correlationAttrKey = isCorrelationModal ? openModal!.split(":")[1] : null;
  const correlationCard = correlationAttrKey ? correlationCards.find(c => c.attr.key === correlationAttrKey) : null;
  const modalGroup = openModal && !isCorrelationModal ? metricGroups.find(g => g.name === openModal) : null;
  const modalTitle = isCorrelationModal && correlationCard ? correlationCard.attr.label : openModal || "";
  const ModalIcon = isCorrelationModal ? Layers : openModal ? (groupIcons[openModal] || BarChart3) : BarChart3;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-[232px]">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => campaignId ? navigate("/", { state: { returnToCampaignId: campaignId } }) : navigate("/")} className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/")} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Campaigns
            </button>
            {campaignId && (
              <>
                <span className="text-muted-foreground/30 text-xs">›</span>
                <button onClick={() => navigate("/", { state: { returnToCampaignId: campaignId } })} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Campaign Profile
                </button>
              </>
            )}
            <span className="text-muted-foreground/30 text-xs">›</span>
            <span className="text-[13px] font-medium text-foreground">Creative Diagnostics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${channelConfig[channel!]?.bgClass}`}>
              {channelConfig[channel!]?.label}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">{assets.length} assets</span>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <section className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-xs uppercase tracking-wider font-bold text-foreground">Creative Profiles Diagnostics</h2>
              </div>
              <p className="text-[10px] text-muted-foreground">Compare selected creative assets, ranked by performance, and inspect how their profile attributes shape the overall score.</p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5 rounded-xl border border-border bg-card shadow-card p-4">
              <div className="rounded-xl border border-border bg-muted/10 p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{selectedAsset?.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Interactive profile shape for the selected creative asset.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Overall Score</p>
                    <p className={`text-[26px] leading-none font-mono font-bold mt-1 ${scoreColor(selectedPerformanceScore)}`}>{selectedPerformanceScore}</p>
                  </div>
                </div>

                <div className="relative">
                  <ChartContainer config={chartConfig} className="mx-auto h-[360px] w-full max-w-[520px]">
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid radialLines={true} />
                      <PolarAngleAxis
                        dataKey="label"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="var(--color-score)"
                        fill="var(--color-score)"
                        fillOpacity={0.14}
                        strokeWidth={2.5}
                      />
                    </RadarChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full border border-border bg-background/92 px-5 py-4 text-center shadow-card">
                      <p className={`text-[34px] leading-none font-mono font-bold ${scoreColor(selectedPerformanceScore)}`}>{selectedPerformanceScore}</p>
                      <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">Profile Score</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Compared Assets</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Best → Worst</span>
                </div>

                <div className="space-y-2">
                  {rankedWithOverall.map(({ asset, performanceScore }, index) => {
                    const active = selectedAsset?.id === asset.id;
                    return (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${active ? "border-primary bg-primary/5 shadow-card" : "border-border bg-background hover:bg-muted/40"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 pt-0.5 text-[10px] font-mono font-semibold text-muted-foreground">#{index + 1}</div>
                          <img src={asset.thumbnail} alt={asset.name} className="w-10 h-10 rounded-lg object-cover border border-border/40 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-foreground truncate">{asset.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">{asset.id}</p>
                              </div>
                              <span className={`text-[18px] leading-none font-mono font-bold ${scoreColor(performanceScore)}`}>{performanceScore}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span>{asset.type}</span>
                              <span>•</span>
                              <span>{asset.creativeProfile.aspectRatio}</span>
                              <span>•</span>
                              <span>{asset.creativeProfile.callToAction}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <div>
            <div className="mb-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-foreground">Performance Summary</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Click on a column header to open a detailed breakdown of how each asset scores in that category.</p>
            </div>
            <div className="rounded-lg border border-border overflow-auto shadow-[var(--shadow-card)]">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-5 py-2.5 text-left min-w-[220px]">Asset</th>
                    {groupNames.map(name => {
                      const Icon = groupIcons[name] || BarChart3;
                      return (
                        <th key={name} className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-3 py-2.5 text-center">
                          <button onClick={() => setOpenModal(name)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                            <Icon className="w-3 h-3" />
                            <span>{name}</span>
                          </button>
                        </th>
                      );
                    })}
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-3 py-2.5 text-center bg-muted/20">
                      <div className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Overall</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((asset) => {
                    const scores = assetGroupScores.get(asset.id);
                    const overall = scores ? Math.round([...scores.values()].reduce((s, v) => s + v, 0) / scores.size) : 0;
                    return (
                      <tr key={asset.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img src={asset.thumbnail} alt={asset.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-border/40" />
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-foreground truncate">{asset.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground/50">{asset.id}</p>
                            </div>
                          </div>
                        </td>
                        {groupNames.map(name => {
                          const score = scores?.get(name) ?? 0;
                          return (
                            <td key={name} className="px-3 py-3 text-center">
                              <button onClick={() => setOpenModal(name)} className="cursor-pointer hover:scale-105 transition-transform">
                                <span className={`text-[12px] font-semibold font-mono leading-none ${scoreColor(score)}`}>{score}</span>
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center bg-muted/5">
                          <span className={`text-[12px] font-semibold font-mono leading-none ${scoreColor(overall)}`}>{overall}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {correlationCards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="text-xs uppercase tracking-wider font-bold text-foreground">Creative Profile Insights</h2>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">How each creative attribute correlates with performance. Click a row to see the full metric breakdown.</p>
              <div className="rounded-lg border border-border overflow-hidden shadow-[var(--shadow-card)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left">Attribute</th>
                      <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left">Best</th>
                      <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left">Worst</th>
                      <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right">ROAS Δ</th>
                      <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold pl-12 pr-4 py-2.5 text-left">Insight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correlationCards.map(card => {
                      const topGroup = card.groups[0];
                      const botGroup = card.groups[card.groups.length - 1];
                      const topAvgRoas = topGroup.assets.reduce((s, r) => s + r.asset.roas, 0) / topGroup.assets.length;
                      const botAvgRoas = botGroup.assets.reduce((s, r) => s + r.asset.roas, 0) / botGroup.assets.length;
                      const diff = botAvgRoas > 0 ? Math.round(((topAvgRoas - botAvgRoas) / botAvgRoas) * 100) : 0;
                      const significant = diff > 10;
                      return (
                        <tr
                          key={card.attr.key}
                          onClick={() => setOpenModal(`correlation:${card.attr.key}`)}
                          className="border-b border-border/20 last:border-0 hover:bg-primary/[0.03] transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-2.5 text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors">{card.attr.label}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-[11px] font-mono font-semibold text-accent">{topGroup.value}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[11px] font-mono font-semibold text-destructive">{botGroup.value}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`text-[11px] font-mono font-bold ${significant ? "text-accent" : "text-muted-foreground"}`}>
                              {diff > 0 ? "+" : ""}{diff}%
                            </span>
                          </td>
                          <td className="pl-12 pr-4 py-2.5">
                            <span className="text-[10px] text-muted-foreground">{card.takeaway || "Similar performance"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button className="group flex items-center gap-4 p-5 rounded-lg border border-border bg-surface shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-150 text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Launch New Campaign</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Apply these winning insights to a new campaign</p>
              </div>
            </button>
            <button className="group flex items-center gap-4 p-5 rounded-lg border border-border bg-surface shadow-card hover:shadow-card-hover hover:border-accent/30 transition-all duration-150 text-left">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
                <Paintbrush className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Design New Creative</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Start a new design based on top-performing attributes</p>
              </div>
            </button>
          </div>
        </div>

        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={() => setOpenModal(null)} />
            <div className="relative bg-background border border-border rounded-xl shadow-2xl w-[92vw] max-w-[1200px] max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/10">
                <div className="flex items-center gap-2.5">
                  <ModalIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-[13px] font-bold text-foreground">{modalTitle} — Detailed Breakdown</h3>
                </div>
                <button onClick={() => setOpenModal(null)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-5 overflow-auto max-h-[calc(85vh-56px)]">
                {modalGroup && renderGroupTable(modalGroup)}
                {isCorrelationModal && correlationCard && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted/20 px-3 py-2 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{correlationCard.attr.label}</span>
                        <span className="text-[9px] text-muted-foreground">{correlationCard.groups.length} values</span>
                      </div>
                      {correlationCard.takeaway && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{correlationCard.takeaway}</p>}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-3 py-1 text-left sticky left-0 bg-background z-10 min-w-[140px]">Asset</th>
                            <th className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-2 py-1 text-left min-w-[70px]">{correlationCard.attr.label}</th>
                            {metrics.map(m => (
                              <th key={m.key} className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold px-1.5 py-1 text-right whitespace-nowrap">{m.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {correlationCard.groups.flatMap(group =>
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
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Insights;
