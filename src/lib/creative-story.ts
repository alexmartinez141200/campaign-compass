import type { CreativeAsset } from "@/data/mockData";

export type StoryDimensionKey = "hook" | "engagement" | "traffic" | "conversion" | "efficiency";
export type StoryMetricFormat = "pct" | "num" | "x" | "dollar2" | "sec";

export interface StoryDriverMetric {
  metricKey: string;
  label: string;
  section: string;
  value: number;
  average: number;
  format: StoryMetricFormat;
  benchmark: string;
}

export interface StorySummaryRow {
  key: StoryDimensionKey;
  title: string;
  profileSignal: string;
  score: number;
  story: string;
  drivers: [StoryDriverMetric, StoryDriverMetric];
}

export const axisStoryDimensionMap: Record<string, StoryDimensionKey> = {
  format: "hook",
  duration: "hook",
  aspect: "traffic",
  motion: "hook",
  contrast: "efficiency",
  brandProminence: "engagement",
  brandConsistency: "efficiency",
  funnelStage: "conversion",
  cta: "traffic",
  productInFirst3s: "hook",
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const pctDelta = (value: number, average: number) => {
  if (!average) return 0;
  return ((value - average) / average) * 100;
};

const benchmarkText = (value: number, average: number) => {
  if (!average) return "0% vs campaign avg";
  const delta = pctDelta(value, average);
  const rounded = Math.round(Math.abs(delta));
  if (rounded < 1) return "0% vs campaign avg";
  return `${delta >= 0 ? "+" : "-"}${rounded}% vs campaign avg`;
};

const toScore = (deltaA: number, deltaB: number) => clampScore(50 + ((deltaA + deltaB) / 2) * 1.6);

const engagementTotal = (asset: CreativeAsset) => asset.postReactions + asset.postComments + asset.postShares + asset.postSaves;
const engagementRate = (asset: CreativeAsset) => (asset.impressions > 0 ? (engagementTotal(asset) / asset.impressions) * 100 : 0);
const shareRate = (asset: CreativeAsset) => (asset.impressions > 0 ? (asset.postShares / asset.impressions) * 100 : 0);
const clickToLpv = (asset: CreativeAsset) => {
  const clicks = asset.channel === "google" ? asset.clicks : asset.linkClicks;
  return clicks > 0 ? (asset.landingPageViews / clicks) * 100 : 0;
};
const checkoutToPurchase = (asset: CreativeAsset) => asset.initiateCheckout > 0 ? (asset.conversions / asset.initiateCheckout) * 100 : 0;

const hookStrength = (asset: CreativeAsset) => {
  if (asset.channel === "tiktok") return asset.videoPlays ? ((asset.videoViews6s || 0) / asset.videoPlays) * 100 : 0;
  if (asset.type === "video") return asset.avgWatchTime || 0;
  return asset.ctr;
};

const hookStrengthLabel = (asset: CreativeAsset) => {
  if (asset.channel === "tiktok") return "6s View Rate";
  if (asset.type === "video") return "Avg Watch";
  return "CTR";
};

const hookFormat = (asset: CreativeAsset): StoryMetricFormat => {
  if (asset.channel === "tiktok") return "pct";
  if (asset.type === "video") return "sec";
  return "pct";
};

const engagementSection = (asset: CreativeAsset) => {
  if (asset.channel === "tiktok") return "Engagement & Growth";
  if (asset.channel === "google") return "Click Performance";
  return "Engagement";
};

const safeAverage = (campaignAssets: CreativeAsset[], getter: (item: CreativeAsset) => number) => {
  if (!campaignAssets.length) return 0;
  return campaignAssets.reduce((sum, item) => sum + getter(item), 0) / campaignAssets.length;
};

export function buildCreativeStorySummary(
  asset: CreativeAsset,
  campaignAssets: CreativeAsset[],
  options?: { selectedRoas?: number },
): StorySummaryRow[] {
  const currentRoas = options?.selectedRoas ?? asset.roas;

  const currentHook = hookStrength(asset);
  const avgHook = safeAverage(campaignAssets, (item) => hookStrength(item));

  const currentClicks = asset.channel === "google" ? asset.clicks : asset.linkClicks;
  const avgClicks = safeAverage(campaignAssets, (item) => item.channel === "google" ? item.clicks : item.linkClicks);

  const currentCpm = asset.cpm;
  const avgCpm = safeAverage(campaignAssets, (item) => item.cpm);

  const currentEngRate = engagementRate(asset);
  const avgEngRate = safeAverage(campaignAssets, (item) => engagementRate(item));

  const currentShareRate = shareRate(asset);
  const avgShareRate = safeAverage(campaignAssets, (item) => shareRate(item));

  const currentClickToLpv = clickToLpv(asset);
  const avgClickToLpv = safeAverage(campaignAssets, (item) => clickToLpv(item));

  const currentCheckoutToPurchase = checkoutToPurchase(asset);
  const avgCheckoutToPurchase = safeAverage(campaignAssets, (item) => checkoutToPurchase(item));

  const avgCtr = safeAverage(campaignAssets, (item) => item.ctr);
  const avgConversions = safeAverage(campaignAssets, (item) => item.conversions);
  const avgRoas = safeAverage(campaignAssets, (item) => item.roas);

  const hookScore = toScore(pctDelta(currentHook, avgHook), pctDelta(asset.ctr, avgCtr));
  const engagementScore = toScore(pctDelta(currentEngRate, avgEngRate), pctDelta(currentShareRate, avgShareRate));
  const trafficScore = toScore(pctDelta(currentClicks, avgClicks), pctDelta(currentClickToLpv, avgClickToLpv));
  const conversionScore = toScore(pctDelta(asset.conversions, avgConversions), pctDelta(currentCheckoutToPurchase, avgCheckoutToPurchase));
  const efficiencyScore = toScore(pctDelta(currentRoas, avgRoas), pctDelta(avgCpm - currentCpm, avgCpm));

  return [
    {
      key: "hook",
      title: "Hook",
      profileSignal: `${asset.creativeProfile.motionIntensity} motion · ${asset.creativeProfile.productInFirst3s ? "Product in first 3s" : "Product after 3s"}`,
      score: hookScore,
      story: `Derived from ${hookStrengthLabel(asset)} and CTR shown below.`,
      drivers: [
        {
          metricKey: asset.channel === "tiktok" ? "hook_6s" : asset.type === "video" ? "hook_watch" : "hook_ctr",
          label: hookStrengthLabel(asset),
          section: asset.type === "video" || asset.channel === "tiktok" ? "Video Performance" : "Top-line KPIs",
          value: currentHook,
          average: avgHook,
          format: hookFormat(asset),
          benchmark: benchmarkText(currentHook, avgHook),
        },
        {
          metricKey: "ctr",
          label: "CTR",
          section: "Top-line KPIs",
          value: asset.ctr,
          average: avgCtr,
          format: "pct",
          benchmark: benchmarkText(asset.ctr, avgCtr),
        },
      ],
    },
    {
      key: "engagement",
      title: "Engagement",
      profileSignal: `${asset.creativeProfile.brandProminence} brand · ${asset.type} format`,
      score: engagementScore,
      story: "Derived from engagement quality and share depth.",
      drivers: [
        {
          metricKey: "eng_rate",
          label: "Eng. Rate",
          section: engagementSection(asset),
          value: currentEngRate,
          average: avgEngRate,
          format: "pct",
          benchmark: benchmarkText(currentEngRate, avgEngRate),
        },
        {
          metricKey: "share_rate",
          label: "Share Rate",
          section: engagementSection(asset),
          value: currentShareRate,
          average: avgShareRate,
          format: "pct",
          benchmark: benchmarkText(currentShareRate, avgShareRate),
        },
      ],
    },
    {
      key: "traffic",
      title: "Traffic",
      profileSignal: `${asset.creativeProfile.callToAction} CTA · ${asset.creativeProfile.aspectRatio}`,
      score: trafficScore,
      story: "Derived from click volume and click-to-visit quality.",
      drivers: [
        {
          metricKey: "clicks",
          label: asset.channel === "google" ? "Clicks" : "Link Clicks",
          section: "Top-line KPIs",
          value: currentClicks,
          average: avgClicks,
          format: "num",
          benchmark: benchmarkText(currentClicks, avgClicks),
        },
        {
          metricKey: "click_to_lpv",
          label: "Click→LPV",
          section: "Traffic",
          value: currentClickToLpv,
          average: avgClickToLpv,
          format: "pct",
          benchmark: benchmarkText(currentClickToLpv, avgClickToLpv),
        },
      ],
    },
    {
      key: "conversion",
      title: "Conversion",
      profileSignal: `${asset.creativeProfile.funnelStage} funnel · ${asset.creativeProfile.brandProminence} brand`,
      score: conversionScore,
      story: "Derived from purchase volume and checkout completion.",
      drivers: [
        {
          metricKey: "purchases",
          label: "Purchases",
          section: "Conversions & Revenue",
          value: asset.conversions,
          average: avgConversions,
          format: "num",
          benchmark: benchmarkText(asset.conversions, avgConversions),
        },
        {
          metricKey: "checkout_purchase",
          label: "Checkout→Purchase",
          section: "Conversion Funnel",
          value: currentCheckoutToPurchase,
          average: avgCheckoutToPurchase,
          format: "pct",
          benchmark: benchmarkText(currentCheckoutToPurchase, avgCheckoutToPurchase),
        },
      ],
    },
    {
      key: "efficiency",
      title: "Efficiency",
      profileSignal: `${asset.creativeProfile.colorContrast} contrast · ${asset.creativeProfile.brandConsistency} consistency`,
      score: efficiencyScore,
      story: "Derived from return strength and delivery cost control.",
      drivers: [
        {
          metricKey: "roas",
          label: "ROAS",
          section: "Conversions & Revenue",
          value: currentRoas,
          average: avgRoas,
          format: "x",
          benchmark: benchmarkText(currentRoas, avgRoas),
        },
        {
          metricKey: "cpm",
          label: "CPM",
          section: "Delivery",
          value: currentCpm,
          average: avgCpm,
          format: "dollar2",
          benchmark: benchmarkText(avgCpm - currentCpm, avgCpm),
        },
      ],
    },
  ];
}

export const formatStoryMetricValue = (value: number, format: StoryMetricFormat) => {
  if (format === "pct") return `${value.toFixed(1)}%`;
  if (format === "num") return Math.round(value).toLocaleString();
  if (format === "x") return `${value.toFixed(1)}x`;
  if (format === "dollar2") return `$${value.toFixed(2)}`;
  return `${value.toFixed(1)}s`;
};
