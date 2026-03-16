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

type ProfileAnalysis = {
  headline: string;
  summary: string;
  why: string[];
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

function getProfileAnalysis(axis: ProfileAxis, asset: CreativeAsset): ProfileAnalysis {
  const score = axis.score(asset);
  const value = axis.getValue(asset);
  const level = score >= 85 ? "strong" : score >= 70 ? "mixed" : "weak";

  const base = {
    format: {
      strong: {
        headline: `${value} is working well`,
        summary: `${value} aligns strongly with the best-performing creative pattern in this comparison set.`,
        why: ["This format matches how users engage with this channel.", "The structure supports clearer storytelling and product framing.", "It likely helped this asset hold attention deeper into the funnel."],
      },
      mixed: {
        headline: `${value} is performing adequately`,
        summary: `${value} is helping, but it is not a clear advantage versus the strongest assets.`,
        why: ["The format is serviceable for this message.", "Other attributes are likely carrying more of the performance.", "A stronger format choice could improve conversion efficiency."],
      },
      weak: {
        headline: `${value} is a weaker fit`,
        summary: `${value} appears less effective than the stronger creative formats in this set.`,
        why: ["The presentation may feel less dynamic or less scannable.", "It may not showcase product or message hierarchy clearly enough.", "Switching format could improve response quality."],
      },
    },
    duration: {
      strong: {
        headline: `${value} duration is strong`,
        summary: `This duration looks well-matched to attention span and message density.`,
        why: ["It delivers the message without dragging.", "It leaves enough time for product and CTA clarity.", "It supports higher completion and click intent."],
      },
      mixed: {
        headline: `${value} duration is acceptable`,
        summary: `The runtime works, but it is not a standout advantage for this asset.`,
        why: ["The pacing is probably fine, but not optimized.", "Some scenes may be carrying extra time.", "A tighter cut could improve retention."],
      },
      weak: {
        headline: `${value} duration is hurting efficiency`,
        summary: `The runtime is likely too short to persuade properly or too long to sustain attention.`,
        why: ["Users may not get to the key message quickly enough.", "Pacing may be less efficient than top assets.", "Re-editing the runtime could improve engagement."],
      },
    },
    aspect: {
      strong: {
        headline: `${value} fits the placement well`,
        summary: `This aspect ratio is supporting visibility and native placement behavior.`,
        why: ["It likely uses screen space efficiently.", "It feels more natural in-feed for this channel.", "It helps the creative command more attention."],
      },
      mixed: {
        headline: `${value} is usable but not optimal`,
        summary: `This aspect ratio works, though stronger shapes exist in the current set.`,
        why: ["It displays correctly but does not maximize impact.", "It may give up visual dominance to other assets.", "A more native ratio could lift results."],
      },
      weak: {
        headline: `${value} is limiting performance`,
        summary: `This aspect ratio is likely a weaker fit for how users are consuming the ad.`,
        why: ["It may take up less effective screen area.", "It can reduce visual priority in the feed.", "A different ratio could improve thumb-stop power."],
      },
    },
    motion: {
      strong: {
        headline: `${value} motion is helping`,
        summary: `The motion treatment is supporting attention without overwhelming the message.`,
        why: ["The creative likely feels active and intentional.", "Movement supports product understanding or pacing.", "It helps the asset stand out while staying clear."],
      },
      mixed: {
        headline: `${value} motion is neutral`,
        summary: `The motion style is acceptable, but it is not driving a strong advantage.`,
        why: ["The pacing may be fine but not memorable.", "It does not hurt, but it may not amplify the hook enough.", "Refining movement could improve engagement."],
      },
      weak: {
        headline: `${value} motion is a weakness`,
        summary: `The current motion approach is likely reducing clarity or attention quality.`,
        why: ["The creative may feel too static or too noisy.", "The message may not build momentum well.", "A cleaner motion strategy could improve response."],
      },
    },
    contrast: {
      strong: {
        headline: `${value} contrast is strong`,
        summary: `The contrast level is helping important elements read quickly.`,
        why: ["Text, product, and CTA are easier to distinguish.", "The creative likely stops the scroll more effectively.", "Visual hierarchy is clearer than weaker assets."],
      },
      mixed: {
        headline: `${value} contrast is moderate`,
        summary: `The contrast works, but it is not giving this asset a major edge.`,
        why: ["Readability is decent overall.", "Some details may blend more than ideal.", "A bolder hierarchy could improve clarity."],
      },
      weak: {
        headline: `${value} contrast is hurting readability`,
        summary: `The visual contrast is likely too soft or too harsh for efficient communication.`,
        why: ["Important elements may not stand out enough.", "The ad may be harder to scan quickly.", "Adjusting contrast could improve comprehension."],
      },
    },
    brandProminence: {
      strong: {
        headline: `${value} branding balance is effective`,
        summary: `The brand presence feels well-calibrated for performance.`,
        why: ["Branding is visible without overpowering the message.", "Users can recognize the advertiser quickly.", "It supports trust while keeping the creative conversion-focused."],
      },
      mixed: {
        headline: `${value} branding is acceptable`,
        summary: `Brand presence is working, but not as efficiently as the top-performing balance.`,
        why: ["The brand is visible enough.", "It may not sharpen trust or recall as much as it could.", "A better balance may improve response."],
      },
      weak: {
        headline: `${value} branding is reducing impact`,
        summary: `The brand is either too dominant or too understated for the strongest performance.`,
        why: ["The message may feel too promotional or not branded enough.", "Visual attention may be pulled from the key action.", "Rebalancing brand presence could improve outcomes."],
      },
    },
    brandConsistency: {
      strong: {
        headline: `${value} consistency is a plus`,
        summary: `The creative feels cohesive and on-brand, which supports trust and recognition.`,
        why: ["Visual cues likely match the broader campaign system.", "Consistency helps reduce cognitive friction.", "It strengthens recognition across touchpoints."],
      },
      mixed: {
        headline: `${value} consistency is average`,
        summary: `The asset is coherent enough, but it is not gaining a major lift from brand consistency.`,
        why: ["Brand signals are present but not especially sharp.", "Some visual elements may feel less unified.", "Tighter consistency could strengthen recall."],
      },
      weak: {
        headline: `${value} consistency is a drag`,
        summary: `The asset likely feels less coherent or less trustworthy than stronger creatives.`,
        why: ["Brand cues may be too weak or inconsistent.", "The ad can feel disconnected from the campaign.", "Improving consistency could support better conversion behavior."],
      },
    },
    funnelStage: {
      strong: {
        headline: `${value} stage matches intent`,
        summary: `This creative appears well-aligned with the audience’s decision stage.`,
        why: ["The message likely meets user intent more precisely.", "The CTA and offer fit the level of readiness.", "That alignment supports stronger downstream performance."],
      },
      mixed: {
        headline: `${value} stage is partly aligned`,
        summary: `The funnel stage works, but it is not the strongest match in this set.`,
        why: ["The message is directionally correct.", "Some users may need a different depth of persuasion.", "Refining the stage alignment could boost efficiency."],
      },
      weak: {
        headline: `${value} stage is mismatched`,
        summary: `The creative likely asks too much or too little for where the audience is in the journey.`,
        why: ["The message may be ahead of or behind user intent.", "That creates friction in the path to action.", "A better stage match could improve results."],
      },
    },
    cta: {
      strong: {
        headline: `${value} is an effective CTA`,
        summary: `The call-to-action is supporting clear next-step behavior.`,
        why: ["Users know what action to take next.", "The CTA likely matches the asset’s promise.", "It creates lower-friction movement into the funnel."],
      },
      mixed: {
        headline: `${value} is a decent CTA`,
        summary: `The CTA works, but it is not the sharpest driver of action in this set.`,
        why: ["It is understandable but not especially motivating.", "The action may feel generic for this message.", "Testing CTA language could improve response."],
      },
      weak: {
        headline: `${value} is weakening intent`,
        summary: `The CTA is likely not aligned well enough with user motivation or stage.`,
        why: ["The next step may feel unclear or less compelling.", "It may not match the asset’s promise closely enough.", "A better CTA could improve click-through and conversion quality."],
      },
    },
    productInFirst3s: {
      strong: {
        headline: `${value} in the first 3s is helping`,
        summary: `Early product visibility is reinforcing relevance and recognition quickly.`,
        why: ["Users understand the offer almost immediately.", "The asset gets to the point fast.", "That usually helps stronger qualification and action."],
      },
      mixed: {
        headline: `${value} in the first 3s is neutral`,
        summary: `Early product visibility is not hurting much, but it is not a standout advantage.`,
        why: ["The hook may still work for some users.", "The product reveal timing could be tighter.", "A clearer opening may improve performance."],
      },
      weak: {
        headline: `${value} in the first 3s is a weakness`,
        summary: `The product is likely introduced too late to maximize hook clarity.`,
        why: ["Users may not understand the offer early enough.", "That can reduce qualified attention.", "Moving product visibility earlier could improve results."],
      },
    },
  } as Record<string, Record<string, ProfileAnalysis>>;

  return base[axis.key]?.[level] ?? {
    headline: `${axis.label} is ${level}`,
    summary: `${axis.label} currently contributes a ${level} signal for this creative asset.`,
    why: ["This category influences how clearly the asset communicates.", "Its current value shapes attention and response quality.", "Refining it could improve performance."],
  };
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
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>(profileAxes[0]?.key || "format");

  const rankedWithOverall = useMemo(() => {
    return ranked.map((asset) => {
      const scores = assetGroupScores.get(asset.id);
      const performanceScore = scores ? Math.round([...scores.values()].reduce((s, v) => s + v, 0) / scores.size) : 0;
      return { asset, performanceScore };
    });
  }, [ranked, assetGroupScores]);

  const selectedAsset = rankedWithOverall.find(({ asset }) => asset.id === selectedAssetId)?.asset ?? rankedWithOverall[0]?.asset;
  const selectedPerformanceScore = rankedWithOverall.find(({ asset }) => asset.id === selectedAsset?.id)?.performanceScore ?? 0;
  const selectedProfileAxis = profileAxes.find((axis) => axis.key === selectedProfileKey) ?? profileAxes[0];

  const radarData = useMemo(() => {
    if (!selectedAsset) return [];
    return profileAxes.map((axis) => ({
      key: axis.key,
      label: axis.shortLabel,
      fullLabel: axis.label,
      value: axis.score(selectedAsset),
      detail: axis.getValue(selectedAsset),
    }));
  }, [selectedAsset]);

  const selectedProfileAnalysis = useMemo(() => {
    if (!selectedAsset || !selectedProfileAxis) return null;
    return getProfileAnalysis(selectedProfileAxis, selectedAsset);
  }, [selectedAsset, selectedProfileAxis]);

  const profileMetricMap: Record<string, string[]> = {
    format: ["roas", "ctr", "conv", "revenue"],
    duration: ["avgWatch", "thruRate", "ctr", "conv"],
    aspect: ["impressions", "ctr", "engRate", "conv"],
    motion: ["engRate", "ctr", "avgWatch", "thruRate"],
    contrast: ["ctr", "engRate", "convRate", "revenue"],
    brandProminence: ["qualRank", "engRank", "ctr", "convRate"],
    brandConsistency: ["qualRank", "engRank", "convRank", "roas"],
    funnelStage: ["ctr", "lpv", "convRate", "roas"],
    cta: ["ctr", "linkClicks", "convRate", "roas"],
    productInFirst3s: ["avgWatch", "thruRate", "ctr", "convRate"],
  };

  const profileMetricRows = useMemo(() => {
    if (!selectedAsset || !selectedProfileAxis) return [];
    const keys = profileMetricMap[selectedProfileAxis.key] || ["roas", "ctr", "convRate", "revenue"];
    return keys
      .map((key) => metrics.find((metric) => metric.key === key))
      .filter((metric): metric is MetricDef => Boolean(metric))
      .map((metric) => {
        const value = metric.get(selectedAsset);
        const average = assets.reduce((sum, asset) => sum + metric.get(asset), 0) / assets.length;
        const pctDiff = average > 0 ? ((value - average) / average) * 100 : 0;
        const positive = metric.higherIsBetter ? pctDiff >= 0 : pctDiff <= 0;
        const note = Math.abs(pctDiff) < 5
          ? "In line with the comparison average"
          : positive
            ? `Supports this category with ${Math.round(Math.abs(pctDiff))}% better-than-average performance`
            : `Weakens this category with ${Math.round(Math.abs(pctDiff))}% worse-than-average performance`;

        return {
          key: metric.key,
          label: metric.label,
          format: metric.format,
          value,
          average,
          pctDiff,
          positive,
          note,
        };
      });
  }, [selectedAsset, selectedProfileAxis, metrics, assets]);

  const renderRadarDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (typeof cx !== "number" || typeof cy !== "number" || !payload?.key) return null;

    const active = payload.key === selectedProfileKey;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={active ? 6.5 : 5.5}
        fill={active ? "hsl(var(--primary))" : "hsl(var(--background))"}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        className="cursor-pointer"
        onClick={(event) => {
          event.stopPropagation();
          setSelectedProfileKey(payload.key);
          setOpenModal(`profile:${payload.key}`);
        }}
      />
    );
  };

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
              <p className="text-[10px] text-muted-foreground">Compare selected creative assets, ranked by performance, and click any profile category to see why it is helping or hurting that asset.</p>
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
                        tick={({ payload, x, y, textAnchor }) => {
                          const active = payload.value === selectedProfileAxis.shortLabel;
                          const axis = profileAxes.find((item) => item.shortLabel === payload.value);
                          return (
                            <text
                              x={x}
                              y={y}
                              textAnchor={textAnchor}
                              fill={active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                              fontSize={10}
                              fontWeight={active ? 700 : 600}
                              style={{ cursor: axis ? "pointer" : "default" }}
                              onClick={() => axis && setOpenModal(`profile:${axis.key}`)}
                            >
                              {payload.value}
                            </text>
                          );
                        }}
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

                {selectedProfileAxis && selectedProfileAnalysis && selectedAsset && (
                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Category Analysis</p>
                        <h3 className="text-[14px] font-semibold text-foreground mt-1">{selectedProfileAxis.label}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">Click any label directly on the radar chart to open the full metric popup.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Current Value</p>
                        <p className="text-[11px] font-medium text-foreground mt-1">{selectedProfileAxis.getValue(selectedAsset)}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold text-foreground">{selectedProfileAnalysis.headline}</p>
                        <span className={`text-[16px] font-mono font-bold ${scoreColor(selectedProfileAxis.score(selectedAsset))}`}>{selectedProfileAxis.score(selectedAsset)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">{selectedProfileAnalysis.summary}</p>
                      <ul className="mt-3 space-y-1.5">
                        {selectedProfileAnalysis.why.map((reason) => (
                          <li key={reason} className="flex gap-2 text-[11px] text-foreground">
                            <span className="text-primary">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
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
                {openModal?.startsWith("profile:") && selectedAsset && selectedProfileAxis && selectedProfileAnalysis && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-muted/10 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Creative Profile Category</p>
                          <h3 className="text-[16px] font-semibold text-foreground mt-1">{selectedProfileAxis.label}</h3>
                          <p className="text-[11px] text-muted-foreground mt-2 max-w-[620px]">{selectedProfileAnalysis.summary}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Current Value</p>
                          <p className="text-[12px] font-medium text-foreground mt-1">{selectedProfileAxis.getValue(selectedAsset)}</p>
                          <p className={`text-[22px] font-mono font-bold mt-2 ${scoreColor(selectedProfileAxis.score(selectedAsset))}`}>{selectedProfileAxis.score(selectedAsset)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="bg-muted/20 px-4 py-3 border-b border-border/40">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Metric Analysis</p>
                        <p className="text-[11px] text-muted-foreground mt-1">These metrics explain why <span className="text-foreground font-medium">{selectedProfileAxis.label}</span> looks good or bad for <span className="text-foreground font-medium">{selectedAsset.name}</span>.</p>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-background border-b border-border/40">
                            <th className="px-4 py-2.5 text-left text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Metric</th>
                            <th className="px-4 py-2.5 text-right text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Asset</th>
                            <th className="px-4 py-2.5 text-right text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Avg</th>
                            <th className="px-4 py-2.5 text-right text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Delta</th>
                            <th className="px-4 py-2.5 text-left text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Analysis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileMetricRows.map((row) => (
                            <tr key={row.key} className="border-b border-border/20 last:border-0 align-top">
                              <td className="px-4 py-3 text-[11px] font-semibold text-foreground">{row.label}</td>
                              <td className="px-4 py-3 text-right text-[11px] font-mono text-foreground">{fmt(row.value, row.format)}</td>
                              <td className="px-4 py-3 text-right text-[11px] font-mono text-muted-foreground">{fmt(row.average, row.format)}</td>
                              <td className={`px-4 py-3 text-right text-[11px] font-mono font-semibold ${row.positive ? "text-accent" : "text-destructive"}`}>
                                {row.pctDiff > 0 ? "+" : ""}{Math.round(row.pctDiff)}%
                              </td>
                              <td className="px-4 py-3 text-[11px] text-muted-foreground">{row.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
