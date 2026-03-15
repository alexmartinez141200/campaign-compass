import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus, Target, Palette, Eye, Megaphone, BarChart3 } from "lucide-react";
import type { CreativeAsset, Channel, CreativeProfile } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";
import { useMemo } from "react";

/* ─── Types ─── */

type Confidence = "high" | "medium" | "low";
type InsightCategory = "driver" | "recommendation" | "signal";

interface CorrelationInsight {
  category: InsightCategory;
  confidence: Confidence;
  title: string;
  detail: string;
  evidence: string;
  attribute: string; // which creative profile attribute
  metric: string; // which metric it correlates to
  direction: "positive" | "negative" | "neutral";
}

/* ─── Analysis Engine ─── */

/** Group assets by a creative profile attribute and compute avg metric per group */
function groupByAttribute<K extends string>(
  assets: CreativeAsset[],
  getAttr: (a: CreativeAsset) => K,
  getMetric: (a: CreativeAsset) => number,
): Map<K, { avg: number; assets: CreativeAsset[]; totalSpend: number }> {
  const groups = new Map<K, { sum: number; assets: CreativeAsset[]; totalSpend: number }>();
  for (const a of assets) {
    const key = getAttr(a);
    const g = groups.get(key) || { sum: 0, assets: [], totalSpend: 0 };
    g.sum += getMetric(a);
    g.totalSpend += a.spend;
    g.assets.push(a);
    groups.set(key, g);
  }
  const result = new Map<K, { avg: number; assets: CreativeAsset[]; totalSpend: number }>();
  for (const [k, g] of groups) {
    result.set(k, { avg: g.sum / g.assets.length, assets: g.assets, totalSpend: g.totalSpend });
  }
  return result;
}

/** Assess confidence based on sample size and spend distribution */
function assessConfidence(groupSizes: number[], totalAssets: number, totalSpend: number, groupSpends: number[]): Confidence {
  const minGroupSize = Math.min(...groupSizes);
  const minSpend = Math.min(...groupSpends);
  const spendRatio = minSpend / totalSpend;

  if (minGroupSize >= 3 && spendRatio >= 0.15) return "high";
  if (minGroupSize >= 2 && spendRatio >= 0.08) return "medium";
  return "low";
}

function pctDiff(a: number, b: number): number {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
}

function analyzeCorrelations(assets: CreativeAsset[]): CorrelationInsight[] {
  if (assets.length < 2) return [];

  const insights: CorrelationInsight[] = [];
  const totalSpend = assets.reduce((s, a) => s + a.spend, 0);
  const sorted = [...assets].sort((a, b) => b.roas - a.roas);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // ─── 1. CREATIVE ATTRIBUTE → PERFORMANCE CORRELATIONS ───

  type AttributeAnalysis = {
    name: string;
    getAttr: (a: CreativeAsset) => string;
    metrics: { name: string; get: (a: CreativeAsset) => number; higherIsBetter: boolean }[];
  };

  const analyses: AttributeAnalysis[] = [
    {
      name: "Color Contrast",
      getAttr: a => a.creativeProfile.colorContrast,
      metrics: [
        { name: "ROAS", get: a => a.roas, higherIsBetter: true },
        { name: "CTR", get: a => a.ctr, higherIsBetter: true },
        { name: "Engagement Rate", get: a => (a.postReactions + a.postComments + a.postShares) / a.impressions * 100, higherIsBetter: true },
      ],
    },
    {
      name: "Motion Intensity",
      getAttr: a => a.creativeProfile.motionIntensity,
      metrics: [
        { name: "ROAS", get: a => a.roas, higherIsBetter: true },
        { name: "CTR", get: a => a.ctr, higherIsBetter: true },
        { name: "CPM", get: a => a.cpm, higherIsBetter: false },
      ],
    },
    {
      name: "Brand Prominence",
      getAttr: a => a.creativeProfile.brandProminence,
      metrics: [
        { name: "Conv. Rate", get: a => a.conversionRate, higherIsBetter: true },
        { name: "ROAS", get: a => a.roas, higherIsBetter: true },
      ],
    },
    {
      name: "Funnel Stage",
      getAttr: a => a.creativeProfile.funnelStage,
      metrics: [
        { name: "ROAS", get: a => a.roas, higherIsBetter: true },
        { name: "CTR", get: a => a.ctr, higherIsBetter: true },
        { name: "Cost / Result", get: a => a.costPerResult, higherIsBetter: false },
      ],
    },
    {
      name: "Aspect Ratio",
      getAttr: a => a.creativeProfile.aspectRatio,
      metrics: [
        { name: "ROAS", get: a => a.roas, higherIsBetter: true },
        { name: "CPM", get: a => a.cpm, higherIsBetter: false },
      ],
    },
    {
      name: "CTA Copy",
      getAttr: a => a.creativeProfile.callToAction,
      metrics: [
        { name: "Conv. Rate", get: a => a.conversionRate, higherIsBetter: true },
        { name: "CTR", get: a => a.ctr, higherIsBetter: true },
      ],
    },
    {
      name: "Brand Consistency",
      getAttr: a => a.creativeProfile.brandConsistency,
      metrics: [
        { name: "ROAS", get: a => a.roas, higherIsBetter: true },
        { name: "Conv. Rate", get: a => a.conversionRate, higherIsBetter: true },
      ],
    },
  ];

  for (const analysis of analyses) {
    for (const metric of analysis.metrics) {
      const groups = groupByAttribute(assets, analysis.getAttr, metric.get);
      if (groups.size < 2) continue;

      const entries = [...groups.entries()].sort((a, b) =>
        metric.higherIsBetter ? b[1].avg - a[1].avg : a[1].avg - b[1].avg
      );
      const bestGroup = entries[0];
      const worstGroup = entries[entries.length - 1];
      const diff = Math.abs(pctDiff(bestGroup[1].avg, worstGroup[1].avg));

      if (diff < 10) continue; // Skip insignificant differences

      const confidence = assessConfidence(
        entries.map(e => e[1].assets.length),
        assets.length,
        totalSpend,
        entries.map(e => e[1].totalSpend)
      );

      const isPositive = metric.higherIsBetter
        ? bestGroup[1].avg > worstGroup[1].avg
        : bestGroup[1].avg < worstGroup[1].avg;

      insights.push({
        category: "driver",
        confidence,
        title: `${analysis.name} → ${metric.name}`,
        detail: `"${bestGroup[0]}" ${analysis.name.toLowerCase()} averages ${formatMetricValue(metric.name, bestGroup[1].avg)} ${metric.name} vs "${worstGroup[0]}" at ${formatMetricValue(metric.name, worstGroup[1].avg)} — a ${diff.toFixed(0)}% difference.`,
        evidence: `Based on ${bestGroup[1].assets.length} vs ${worstGroup[1].assets.length} assets, $${bestGroup[1].totalSpend.toLocaleString()} vs $${worstGroup[1].totalSpend.toLocaleString()} spend.`,
        attribute: analysis.name,
        metric: metric.name,
        direction: isPositive ? "positive" : "negative",
      });
    }
  }

  // ─── 2. PRODUCT IN FIRST 3 SECONDS ───
  const withProduct = assets.filter(a => a.creativeProfile.productInFirst3s);
  const withoutProduct = assets.filter(a => !a.creativeProfile.productInFirst3s);
  if (withProduct.length > 0 && withoutProduct.length > 0) {
    const avgRoasW = withProduct.reduce((s, a) => s + a.roas, 0) / withProduct.length;
    const avgRoasWo = withoutProduct.reduce((s, a) => s + a.roas, 0) / withoutProduct.length;
    const avgCvrW = withProduct.reduce((s, a) => s + a.conversionRate, 0) / withProduct.length;
    const avgCvrWo = withoutProduct.reduce((s, a) => s + a.conversionRate, 0) / withoutProduct.length;
    const diff = Math.abs(pctDiff(avgRoasW, avgRoasWo));

    if (diff > 10) {
      const better = avgRoasW > avgRoasWo;
      const conf = assessConfidence(
        [withProduct.length, withoutProduct.length], assets.length, totalSpend,
        [withProduct.reduce((s, a) => s + a.spend, 0), withoutProduct.reduce((s, a) => s + a.spend, 0)]
      );
      insights.push({
        category: "driver",
        confidence: conf,
        title: "Product Visibility (First 3s) → ROAS",
        detail: better
          ? `Showing the product in the first 3 seconds drives ${avgRoasW.toFixed(1)}x ROAS and ${avgCvrW.toFixed(1)}% conversion rate vs ${avgRoasWo.toFixed(1)}x / ${avgCvrWo.toFixed(1)}% without. Early product presence accelerates purchase intent.`
          : `Creatives that delay the product reveal achieve ${avgRoasWo.toFixed(1)}x ROAS vs ${avgRoasW.toFixed(1)}x with immediate product. Storytelling-first approaches resonate better with this audience.`,
        evidence: `${withProduct.length} assets with product vs ${withoutProduct.length} without.`,
        attribute: "Product in First 3s",
        metric: "ROAS",
        direction: better ? "positive" : "negative",
      });
    }
  }

  // ─── 3. RECOMMENDATIONS ───

  // Find which attributes the best performer has that are different from worst
  const profileDiffs = getProfileDifferences(best, worst);
  for (const diff of profileDiffs) {
    insights.push({
      category: "recommendation",
      confidence: assets.length >= 4 ? "medium" : "low",
      title: `Produce more: ${diff.attribute} = "${diff.bestValue}"`,
      detail: `${best.name} (${best.roas}x ROAS, ${best.conversionRate}% conv.) uses "${diff.bestValue}" ${diff.attribute.toLowerCase()} while the weakest performer ${worst.name} (${worst.roas}x ROAS) uses "${diff.worstValue}". Consider shifting creative production toward "${diff.bestValue}".`,
      evidence: `Top performer: $${best.purchaseValue.toLocaleString()} revenue on $${best.spend.toLocaleString()} spend. Bottom: $${worst.purchaseValue.toLocaleString()} on $${worst.spend.toLocaleString()}.`,
      attribute: diff.attribute,
      metric: "ROAS",
      direction: "positive",
    });
  }

  // ─── 4. NOISE / RELIABILITY SIGNALS ───

  // Check if differences are within margin of error (small sample, similar spend)
  const roasValues = assets.map(a => a.roas);
  const roasStdDev = stdDev(roasValues);
  const roasMean = roasValues.reduce((s, v) => s + v, 0) / roasValues.length;
  const coeffVar = roasMean > 0 ? (roasStdDev / roasMean) * 100 : 0;

  if (coeffVar < 15 && assets.length < 5) {
    insights.push({
      category: "signal",
      confidence: "low",
      title: "Performance gap may be noise",
      detail: `ROAS varies only ${coeffVar.toFixed(0)}% across these ${assets.length} assets (${sorted[sorted.length - 1].roas}x – ${sorted[0].roas}x). With a small sample, this difference may not be statistically meaningful. Increase spend or run longer before drawing conclusions.`,
      evidence: `Coefficient of variation: ${coeffVar.toFixed(1)}%. Standard deviation: ${roasStdDev.toFixed(2)}.`,
      attribute: "Overall",
      metric: "ROAS",
      direction: "neutral",
    });
  }

  // Check for spend imbalance
  const spendValues = assets.map(a => a.spend);
  const maxSpend = Math.max(...spendValues);
  const minSpend = Math.min(...spendValues);
  if (maxSpend > minSpend * 2.5) {
    const underSpent = assets.filter(a => a.spend < maxSpend * 0.4);
    if (underSpent.length > 0) {
      insights.push({
        category: "signal",
        confidence: "medium",
        title: "Uneven spend distribution",
        detail: `${underSpent.map(a => a.name).join(", ")} received significantly less budget ($${Math.min(...underSpent.map(a => a.spend)).toLocaleString()} vs $${maxSpend.toLocaleString()}). Their metrics may be unreliable — performance often stabilizes after the learning phase. Consider equalizing spend before comparing.`,
        evidence: `Spend range: $${minSpend.toLocaleString()} – $${maxSpend.toLocaleString()} (${((maxSpend / minSpend - 1) * 100).toFixed(0)}% gap).`,
        attribute: "Budget",
        metric: "Spend",
        direction: "neutral",
      });
    }
  }

  // Quality ranking correlation
  const aboveAvgQuality = assets.filter(a => a.qualityRanking === "above_average" && a.engagementRateRanking === "above_average");
  const belowAvgQuality = assets.filter(a => a.qualityRanking === "below_average" || a.engagementRateRanking === "below_average");
  if (aboveAvgQuality.length > 0 && belowAvgQuality.length > 0) {
    const avgRoasAbove = aboveAvgQuality.reduce((s, a) => s + a.roas, 0) / aboveAvgQuality.length;
    const avgRoasBelow = belowAvgQuality.reduce((s, a) => s + a.roas, 0) / belowAvgQuality.length;
    insights.push({
      category: "signal",
      confidence: "high",
      title: "Platform quality signals confirm performance",
      detail: `Assets with above-average platform quality scores achieve ${avgRoasAbove.toFixed(1)}x ROAS vs ${avgRoasBelow.toFixed(1)}x for below-average. This validates that the performance differences are design-driven, not audience-targeting artifacts.`,
      evidence: `${aboveAvgQuality.map(a => a.name).join(", ")} vs ${belowAvgQuality.map(a => a.name).join(", ")}.`,
      attribute: "Quality Ranking",
      metric: "ROAS",
      direction: avgRoasAbove > avgRoasBelow ? "positive" : "negative",
    });
  }

  // Sort: drivers first, then recommendations, then signals. Within each, high confidence first.
  const categoryOrder: Record<InsightCategory, number> = { driver: 0, recommendation: 1, signal: 2 };
  const confOrder: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => {
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (catDiff !== 0) return catDiff;
    return confOrder[a.confidence] - confOrder[b.confidence];
  });

  // Deduplicate by attribute+metric
  const seen = new Set<string>();
  return insights.filter(i => {
    const key = `${i.attribute}:${i.metric}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getProfileDifferences(best: CreativeAsset, worst: CreativeAsset) {
  const diffs: { attribute: string; bestValue: string; worstValue: string }[] = [];
  const p1 = best.creativeProfile;
  const p2 = worst.creativeProfile;

  if (p1.motionIntensity !== p2.motionIntensity) diffs.push({ attribute: "Motion Intensity", bestValue: p1.motionIntensity, worstValue: p2.motionIntensity });
  if (p1.colorContrast !== p2.colorContrast) diffs.push({ attribute: "Color Contrast", bestValue: p1.colorContrast, worstValue: p2.colorContrast });
  if (p1.brandProminence !== p2.brandProminence) diffs.push({ attribute: "Brand Prominence", bestValue: p1.brandProminence, worstValue: p2.brandProminence });
  if (p1.funnelStage !== p2.funnelStage) diffs.push({ attribute: "Funnel Stage", bestValue: p1.funnelStage, worstValue: p2.funnelStage });
  if (p1.callToAction !== p2.callToAction) diffs.push({ attribute: "CTA", bestValue: p1.callToAction, worstValue: p2.callToAction });

  return diffs.slice(0, 3); // Top 3 most impactful
}

function stdDev(values: number[]): number {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / values.length);
}

function formatMetricValue(metricName: string, value: number): string {
  if (metricName === "ROAS") return `${value.toFixed(1)}x`;
  if (metricName === "CTR" || metricName === "Conv. Rate" || metricName === "Engagement Rate") return `${value.toFixed(1)}%`;
  if (metricName === "CPM" || metricName === "CPC" || metricName === "Cost / Result") return `$${value.toFixed(2)}`;
  return value.toFixed(1);
}

/* ─── UI Helpers ─── */

const confidenceConfig: Record<Confidence, { label: string; icon: typeof ShieldCheck; colorClass: string; bgClass: string }> = {
  high: { label: "High Confidence", icon: ShieldCheck, colorClass: "text-emerald-600", bgClass: "bg-emerald-500/10" },
  medium: { label: "Medium Confidence", icon: ShieldCheck, colorClass: "text-amber-600", bgClass: "bg-amber-500/10" },
  low: { label: "Low Confidence", icon: ShieldAlert, colorClass: "text-muted-foreground", bgClass: "bg-muted/40" },
};

const categoryConfig: Record<InsightCategory, { label: string; icon: typeof Lightbulb; description: string }> = {
  driver: { label: "Performance Drivers", icon: BarChart3, description: "Creative attributes that correlate with better or worse metrics" },
  recommendation: { label: "What to Produce Next", icon: Target, description: "Actionable creative direction based on top performers" },
  signal: { label: "Reliability Check", icon: Eye, description: "Whether these insights are statistically meaningful or potentially noise" },
};

const directionIcon = {
  positive: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />,
  negative: <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />,
  neutral: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
};

/* ─── Component ─── */

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];
  const channel: Channel | null = assets.length > 0 ? assets[0].channel : null;
  const channelLabel = channel ? channelConfig[channel].label : "";

  const correlations = useMemo(() => analyzeCorrelations(assets), [assets]);

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Campaign
        </button>
        <p className="text-muted-foreground text-sm">No assets selected for comparison.</p>
      </div>
    );
  }

  // Group insights by category
  const categories: InsightCategory[] = ["driver", "recommendation", "signal"];
  const grouped = categories.map(cat => ({
    category: cat,
    insights: correlations.filter(i => i.category === cat),
  })).filter(g => g.insights.length > 0);

  // Quick performance ranking
  const ranked = [...assets].sort((a, b) => b.roas - a.roas);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-semibold text-foreground">Creative Insights</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${channelConfig[channel!]?.bgClass}`}>
            {channelLabel}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">{assets.length} assets compared</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Performance Ranking Strip */}
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="px-4 py-2 bg-muted/20 border-b border-border/40">
            <h2 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Performance Ranking</h2>
          </div>
          <div className="flex divide-x divide-border/40">
            {ranked.map((a, i) => {
              const roasColor = a.roas >= 5 ? "text-emerald-600" : a.roas >= 3 ? "text-foreground" : "text-destructive";
              return (
                <div key={a.id} className="flex-1 px-4 py-3 flex items-center gap-3">
                  <img src={a.thumbnail} alt={a.name} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[14px] font-mono font-bold ${roasColor}`}>{a.roas}x</span>
                      <span className="text-[10px] font-mono text-muted-foreground">ROAS</span>
                      <span className="text-[10px] font-mono text-muted-foreground">·</span>
                      <span className="text-[10px] font-mono text-muted-foreground">${a.purchaseValue.toLocaleString()} rev</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight Sections */}
        {grouped.map(({ category, insights }) => {
          const config = categoryConfig[category];
          const Icon = config.icon;
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-[12px] uppercase tracking-wider font-bold text-foreground">{config.label}</h2>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">{config.description}</p>

              <div className="space-y-2.5">
                {insights.map((insight, i) => {
                  const conf = confidenceConfig[insight.confidence];
                  const ConfIcon = conf.icon;
                  return (
                    <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                      <div className="flex items-stretch">
                        {/* Direction indicator */}
                        <div className={`w-1 flex-shrink-0 ${
                          insight.direction === "positive" ? "bg-emerald-500" :
                          insight.direction === "negative" ? "bg-destructive" : "bg-muted-foreground/30"
                        }`} />

                        <div className="flex-1 px-4 py-3">
                          {/* Title row */}
                          <div className="flex items-center gap-2 mb-1">
                            {directionIcon[insight.direction]}
                            <span className="text-[13px] font-semibold text-foreground">{insight.title}</span>
                            <div className="ml-auto flex items-center gap-1">
                              <ConfIcon className={`w-3 h-3 ${conf.colorClass}`} />
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${conf.colorClass} ${conf.bgClass} px-1.5 py-0.5 rounded`}>
                                {conf.label}
                              </span>
                            </div>
                          </div>

                          {/* Detail */}
                          <p className="text-[12px] text-foreground/80 leading-relaxed mb-1.5">{insight.detail}</p>

                          {/* Evidence */}
                          <p className="text-[10px] text-muted-foreground font-mono">{insight.evidence}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Creative Profile Diff — Compact */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[12px] uppercase tracking-wider font-bold text-foreground">Creative Profile Comparison</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Attributes that differ between assets are highlighted</p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Attribute</th>
                  {ranked.map(a => (
                    <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <img src={a.thumbnail} alt={a.name} className="w-7 h-7 rounded object-cover" />
                        <span className="truncate max-w-[90px]">{a.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "Format", get: (a: CreativeAsset) => a.type.charAt(0).toUpperCase() + a.type.slice(1) },
                  { label: "Aspect Ratio", get: (a: CreativeAsset) => a.creativeProfile.aspectRatio },
                  { label: "Video Duration", get: (a: CreativeAsset) => a.creativeProfile.videoDuration ? `${a.creativeProfile.videoDuration}s` : "—" },
                  { label: "Motion Intensity", get: (a: CreativeAsset) => a.creativeProfile.motionIntensity },
                  { label: "Color Contrast", get: (a: CreativeAsset) => a.creativeProfile.colorContrast },
                  { label: "Brand Prominence", get: (a: CreativeAsset) => a.creativeProfile.brandProminence },
                  { label: "Brand Consistency", get: (a: CreativeAsset) => a.creativeProfile.brandConsistency },
                  { label: "Funnel Stage", get: (a: CreativeAsset) => a.creativeProfile.funnelStage },
                  { label: "CTA", get: (a: CreativeAsset) => a.creativeProfile.callToAction },
                  { label: "Product in First 3s", get: (a: CreativeAsset) => a.creativeProfile.productInFirst3s ? "Yes" : "No" },
                ] as { label: string; get: (a: CreativeAsset) => string }[]).map(row => {
                  const values = ranked.map(a => row.get(a));
                  const allSame = values.every(v => v === values[0]);
                  return (
                    <tr key={row.label} className={`border-b border-border/20 last:border-0 ${!allSame ? "bg-primary/[0.02]" : ""}`}>
                      <td className={`px-4 py-1.5 text-[10px] font-semibold ${!allSame ? "text-foreground" : "text-muted-foreground"}`}>
                        {row.label}
                        {!allSame && <span className="ml-1 text-primary text-[8px]">●</span>}
                      </td>
                      {ranked.map((a, i) => (
                        <td key={a.id} className={`px-3 py-1.5 text-center text-[11px] font-mono ${allSame ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
                          {row.get(a)}
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
