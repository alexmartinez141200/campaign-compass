import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import type { CreativeAsset, Channel } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";
import { useMemo } from "react";

type RankingLabel = "above_average" | "average" | "below_average";

const rankingDisplay: Record<RankingLabel, { label: string; className: string }> = {
  above_average: { label: "Above Avg", className: "text-emerald-600" },
  average: { label: "Average", className: "text-foreground" },
  below_average: { label: "Below Avg", className: "text-destructive" },
};

/** Determine which asset is "best" for a numeric metric (higher = better or lower = better) */
function bestIndex(values: number[], higherIsBetter: boolean): number {
  if (values.length === 0) return -1;
  return values.reduce((best, v, i) => {
    if (higherIsBetter ? v > values[best] : v < values[best]) return i;
    return best;
  }, 0);
}

interface Insight {
  type: "positive" | "warning" | "negative";
  title: string;
  detail: string;
}

function generateInsights(assets: CreativeAsset[]): Insight[] {
  const insights: Insight[] = [];
  if (assets.length < 2) return insights;

  // Sort by ROAS to identify best/worst
  const sorted = [...assets].sort((a, b) => b.roas - a.roas);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // ROAS spread
  const roasSpread = best.roas - worst.roas;
  if (roasSpread > 2) {
    insights.push({
      type: "warning",
      title: "Significant ROAS Gap",
      detail: `${best.name} (${best.roas}x) outperforms ${worst.name} (${worst.roas}x) by ${roasSpread.toFixed(1)}x. Consider reallocating budget from underperformers.`,
    });
  }

  // Engagement vs Creative Profile analysis
  if (best.ctr > worst.ctr && best.creativeProfile.colorContrast !== worst.creativeProfile.colorContrast) {
    insights.push({
      type: "positive",
      title: "Color Contrast Drives Engagement",
      detail: `${best.name} uses ${best.creativeProfile.colorContrast} contrast and achieves ${best.ctr}% CTR vs ${worst.name}'s ${worst.ctr}% with ${worst.creativeProfile.colorContrast} contrast. Higher contrast correlates with better click-through.`,
    });
  }

  // Product in first 3s analysis
  const withProduct = assets.filter(a => a.creativeProfile.productInFirst3s);
  const withoutProduct = assets.filter(a => !a.creativeProfile.productInFirst3s);
  if (withProduct.length > 0 && withoutProduct.length > 0) {
    const avgRoasWithProduct = withProduct.reduce((s, a) => s + a.roas, 0) / withProduct.length;
    const avgRoasWithout = withoutProduct.reduce((s, a) => s + a.roas, 0) / withoutProduct.length;
    if (avgRoasWithProduct > avgRoasWithout) {
      insights.push({
        type: "positive",
        title: "Product Visibility Boosts Conversions",
        detail: `Assets showing the product in the first 3 seconds average ${avgRoasWithProduct.toFixed(1)}x ROAS vs ${avgRoasWithout.toFixed(1)}x without. Early product presence signals purchase intent more effectively.`,
      });
    } else {
      insights.push({
        type: "warning",
        title: "Late Product Reveal Outperforms",
        detail: `Assets without early product visibility average ${avgRoasWithout.toFixed(1)}x ROAS vs ${avgRoasWithProduct.toFixed(1)}x with it. Storytelling-first creatives may resonate better with this audience.`,
      });
    }
  }

  // Brand prominence analysis
  if (best.creativeProfile.brandProminence !== worst.creativeProfile.brandProminence) {
    insights.push({
      type: "positive",
      title: "Brand Prominence Impact",
      detail: `${best.name} uses "${best.creativeProfile.brandProminence}" brand prominence and converts at ${best.conversionRate}% vs ${worst.name}'s "${worst.creativeProfile.brandProminence}" at ${worst.conversionRate}%. Consider testing ${best.creativeProfile.brandProminence} branding on future creatives.`,
    });
  }

  // CPM efficiency
  const cpmBest = assets.reduce((b, a, i) => a.cpm < assets[b].cpm ? i : b, 0);
  const cpmWorst = assets.reduce((w, a, i) => a.cpm > assets[w].cpm ? i : w, 0);
  if (assets[cpmBest].cpm < assets[cpmWorst].cpm * 0.7) {
    insights.push({
      type: "warning",
      title: "Delivery Cost Disparity",
      detail: `${assets[cpmBest].name} delivers at $${assets[cpmBest].cpm.toFixed(2)} CPM while ${assets[cpmWorst].name} costs $${assets[cpmWorst].cpm.toFixed(2)}. The ${assets[cpmWorst].creativeProfile.aspectRatio} format with ${assets[cpmWorst].creativeProfile.motionIntensity} motion may be less efficient for this audience.`,
    });
  }

  // Funnel stage alignment
  const funnelGroups = new Map<string, CreativeAsset[]>();
  assets.forEach(a => {
    const stage = a.creativeProfile.funnelStage;
    funnelGroups.set(stage, [...(funnelGroups.get(stage) || []), a]);
  });
  if (funnelGroups.size > 1) {
    const conversionAssets = funnelGroups.get("Conversion") || [];
    const awarenessAssets = funnelGroups.get("Awareness") || [];
    if (conversionAssets.length > 0 && awarenessAssets.length > 0) {
      const convAvgRoas = conversionAssets.reduce((s, a) => s + a.roas, 0) / conversionAssets.length;
      const awarenessAvgCtr = awarenessAssets.reduce((s, a) => s + a.ctr, 0) / awarenessAssets.length;
      insights.push({
        type: "positive",
        title: "Funnel Strategy Working",
        detail: `Awareness assets drive ${awarenessAvgCtr.toFixed(1)}% CTR for top-funnel engagement, while Conversion assets deliver ${convAvgRoas.toFixed(1)}x ROAS. The funnel stages are properly aligned to their objectives.`,
      });
    }
  }

  // Quality ranking analysis (Meta)
  const belowAvgQuality = assets.filter(a => a.qualityRanking === "below_average" || a.engagementRateRanking === "below_average");
  if (belowAvgQuality.length > 0) {
    insights.push({
      type: "negative",
      title: "Quality Ranking Concern",
      detail: `${belowAvgQuality.map(a => a.name).join(", ")} ${belowAvgQuality.length === 1 ? "has" : "have"} below-average quality or engagement rankings. This typically indicates creative fatigue or audience misalignment — consider refreshing the visual or copy.`,
    });
  }

  // Motion intensity vs engagement
  const highMotion = assets.filter(a => a.creativeProfile.motionIntensity === "High");
  const lowMotion = assets.filter(a => a.creativeProfile.motionIntensity !== "High");
  if (highMotion.length > 0 && lowMotion.length > 0) {
    const avgEngHigh = highMotion.reduce((s, a) => s + (a.postReactions + a.postComments + a.postShares), 0) / highMotion.length;
    const avgEngLow = lowMotion.reduce((s, a) => s + (a.postReactions + a.postComments + a.postShares), 0) / lowMotion.length;
    if (avgEngHigh > avgEngLow * 1.3) {
      insights.push({
        type: "positive",
        title: "High Motion Drives Engagement",
        detail: `High-motion creatives average ${Math.round(avgEngHigh).toLocaleString()} engagement actions vs ${Math.round(avgEngLow).toLocaleString()} for static/subtle motion. Dynamic visuals are capturing more attention.`,
      });
    }
  }

  return insights.slice(0, 6);
}

const insightIcon = {
  positive: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />,
  negative: <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />,
};

const insightBg = {
  positive: "border-emerald-200/60 bg-emerald-50/30",
  warning: "border-amber-200/60 bg-amber-50/30",
  negative: "border-destructive/20 bg-destructive/5",
};

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];
  const channel: Channel | null = assets.length > 0 ? assets[0].channel : null;
  const channelLabel = channel ? channelConfig[channel].label : "";

  const insights = useMemo(() => generateInsights(assets), [assets]);

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

  // Define metric rows for comparison table
  type MetricRow = { label: string; getValue: (a: CreativeAsset) => string | number; getRaw: (a: CreativeAsset) => number; higherIsBetter: boolean; section: string };

  const metricRows: MetricRow[] = [
    // Performance
    { label: "Spend", getValue: a => `$${a.spend.toLocaleString()}`, getRaw: a => a.spend, higherIsBetter: false, section: "Investment" },
    { label: "Revenue", getValue: a => `$${a.purchaseValue.toLocaleString()}`, getRaw: a => a.purchaseValue, higherIsBetter: true, section: "Investment" },
    { label: "ROAS", getValue: a => `${a.roas}x`, getRaw: a => a.roas, higherIsBetter: true, section: "Performance" },
    { label: "Conversions", getValue: a => a.conversions.toLocaleString(), getRaw: a => a.conversions, higherIsBetter: true, section: "Performance" },
    { label: "Conv. Rate", getValue: a => `${a.conversionRate}%`, getRaw: a => a.conversionRate, higherIsBetter: true, section: "Performance" },
    { label: "Cost / Result", getValue: a => `$${a.costPerResult.toFixed(2)}`, getRaw: a => a.costPerResult, higherIsBetter: false, section: "Performance" },
    // Delivery
    { label: "Impressions", getValue: a => a.impressions.toLocaleString(), getRaw: a => a.impressions, higherIsBetter: true, section: "Delivery" },
    { label: "Reach", getValue: a => a.reach.toLocaleString(), getRaw: a => a.reach, higherIsBetter: true, section: "Delivery" },
    { label: "CPM", getValue: a => `$${a.cpm.toFixed(2)}`, getRaw: a => a.cpm, higherIsBetter: false, section: "Delivery" },
    { label: "Frequency", getValue: a => a.frequency.toFixed(2), getRaw: a => a.frequency, higherIsBetter: false, section: "Delivery" },
    // Engagement
    { label: "CTR", getValue: a => `${a.ctr}%`, getRaw: a => a.ctr, higherIsBetter: true, section: "Engagement" },
    { label: "CPC", getValue: a => `$${a.cpc.toFixed(2)}`, getRaw: a => a.cpc, higherIsBetter: false, section: "Engagement" },
    { label: "Reactions", getValue: a => a.postReactions.toLocaleString(), getRaw: a => a.postReactions, higherIsBetter: true, section: "Engagement" },
    { label: "Shares", getValue: a => a.postShares.toLocaleString(), getRaw: a => a.postShares, higherIsBetter: true, section: "Engagement" },
    { label: "Saves", getValue: a => a.postSaves.toLocaleString(), getRaw: a => a.postSaves, higherIsBetter: true, section: "Engagement" },
    // Funnel
    { label: "LP Views", getValue: a => a.landingPageViews.toLocaleString(), getRaw: a => a.landingPageViews, higherIsBetter: true, section: "Funnel" },
    { label: "Add to Cart", getValue: a => a.addToCart.toLocaleString(), getRaw: a => a.addToCart, higherIsBetter: true, section: "Funnel" },
    { label: "Init. Checkout", getValue: a => a.initiateCheckout.toLocaleString(), getRaw: a => a.initiateCheckout, higherIsBetter: true, section: "Funnel" },
  ];

  // Creative profile rows
  type ProfileRow = { label: string; getValue: (a: CreativeAsset) => string };
  const profileRows: ProfileRow[] = [
    { label: "Format", getValue: a => a.type.charAt(0).toUpperCase() + a.type.slice(1) },
    { label: "Aspect Ratio", getValue: a => a.creativeProfile.aspectRatio },
    { label: "Video Duration", getValue: a => a.creativeProfile.videoDuration ? `${a.creativeProfile.videoDuration}s` : "—" },
    { label: "Motion Intensity", getValue: a => a.creativeProfile.motionIntensity },
    { label: "Color Contrast", getValue: a => a.creativeProfile.colorContrast },
    { label: "Brand Prominence", getValue: a => a.creativeProfile.brandProminence },
    { label: "Brand Consistency", getValue: a => a.creativeProfile.brandConsistency },
    { label: "Funnel Stage", getValue: a => a.creativeProfile.funnelStage },
    { label: "CTA", getValue: a => a.creativeProfile.callToAction },
    { label: "Product in First 3s", getValue: a => a.creativeProfile.productInFirst3s ? "Yes" : "No" },
  ];

  const sections = [...new Set(metricRows.map(r => r.section))];

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

      <div className="p-6 space-y-6">
        {/* Insights Cards */}
        {insights.length > 0 && (
          <div>
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Interpretive Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, i) => (
                <div key={i} className={`rounded-lg border p-3 ${insightBg[insight.type]}`}>
                  <div className="flex items-start gap-2">
                    {insightIcon[insight.type]}
                    <div>
                      <p className="text-[12px] font-semibold text-foreground leading-tight">{insight.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{insight.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creative Profile Comparison */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Creative Profile</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Attribute</th>
                  {assets.map(a => (
                    <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <img src={a.thumbnail} alt={a.name} className="w-8 h-8 rounded object-cover" />
                        <span className="truncate max-w-[100px]">{a.name}</span>
                        <span className="text-[8px] font-mono text-muted-foreground">{a.id}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profileRows.map(row => (
                  <tr key={row.label} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground">{row.label}</td>
                    {assets.map(a => {
                      const val = row.getValue(a);
                      // Highlight differences
                      const allSame = assets.every(x => row.getValue(x) === val);
                      return (
                        <td key={a.id} className={`px-3 py-1.5 text-center text-[11px] font-mono ${allSame ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metrics Comparison */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Metrics Comparison</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Metric</th>
                  {assets.map(a => (
                    <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center">
                      <span className="truncate max-w-[100px]">{a.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  <>
                    <tr key={`section-${section}`} className="bg-muted/10">
                      <td colSpan={assets.length + 1} className="px-4 py-1 text-[8px] uppercase tracking-widest font-bold text-muted-foreground/50">{section}</td>
                    </tr>
                    {metricRows.filter(r => r.section === section).map(row => {
                      const rawValues = assets.map(a => row.getRaw(a));
                      const best = bestIndex(rawValues, row.higherIsBetter);
                      return (
                        <tr key={row.label} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground">{row.label}</td>
                          {assets.map((a, i) => (
                            <td key={a.id} className={`px-3 py-1.5 text-center text-[12px] font-mono ${i === best ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                              {row.getValue(a)}
                              {i === best && assets.length > 1 && (
                                <span className="ml-1 text-[8px] text-emerald-500 font-bold">●</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality Rankings (Meta-specific) */}
        {channel === "meta" && (
          <div>
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Ad Relevance Diagnostics</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Diagnostic</th>
                    {assets.map(a => (
                      <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center truncate max-w-[100px]">{a.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["qualityRanking", "engagementRateRanking", "conversionRateRanking"] as const).map(key => {
                    const labels = { qualityRanking: "Quality", engagementRateRanking: "Engagement Rate", conversionRateRanking: "Conversion Rate" };
                    return (
                      <tr key={key} className="border-b border-border/20 last:border-0">
                        <td className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground">{labels[key]}</td>
                        {assets.map(a => {
                          const r = rankingDisplay[a[key]];
                          return (
                            <td key={a.id} className={`px-3 py-1.5 text-center text-[11px] font-semibold ${r.className}`}>{r.label}</td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TikTok-specific */}
        {channel === "tiktok" && (
          <div>
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">TikTok Video Metrics</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Metric</th>
                    {assets.map(a => (
                      <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center truncate max-w-[100px]">{a.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Video View Rate", getValue: (a: CreativeAsset) => a.videoViewRate ? `${a.videoViewRate}%` : "—" },
                    { label: "6s Focused Views", getValue: (a: CreativeAsset) => a.videoViews6s?.toLocaleString() || "—" },
                    { label: "Completed Views", getValue: (a: CreativeAsset) => a.completedViews?.toLocaleString() || "—" },
                    { label: "Avg Watch Time", getValue: (a: CreativeAsset) => a.avgWatchTime ? `${a.avgWatchTime}s` : "—" },
                    { label: "Profile Visits", getValue: (a: CreativeAsset) => a.profileVisits?.toLocaleString() || "—" },
                    { label: "Follows", getValue: (a: CreativeAsset) => a.follows?.toLocaleString() || "—" },
                  ].map(row => (
                    <tr key={row.label} className="border-b border-border/20 last:border-0">
                      <td className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground">{row.label}</td>
                      {assets.map(a => (
                        <td key={a.id} className="px-3 py-1.5 text-center text-[11px] font-mono text-foreground">{row.getValue(a)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Google-specific */}
        {channel === "google" && (
          <div>
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Google Ads Metrics</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Metric</th>
                    {assets.map(a => (
                      <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center truncate max-w-[100px]">{a.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "View-Through Conv.", getValue: (a: CreativeAsset) => a.viewThroughConversions?.toLocaleString() || "—" },
                    { label: "Avg CPV", getValue: (a: CreativeAsset) => a.avgCpv ? `$${a.avgCpv.toFixed(3)}` : "—" },
                    { label: "Interaction Rate", getValue: (a: CreativeAsset) => a.interactionRate ? `${a.interactionRate}%` : "—" },
                  ].map(row => (
                    <tr key={row.label} className="border-b border-border/20 last:border-0">
                      <td className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground">{row.label}</td>
                      {assets.map(a => (
                        <td key={a.id} className="px-3 py-1.5 text-center text-[11px] font-mono text-foreground">{row.getValue(a)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
