import type { CreativeAsset } from "@/data/mockData";

export type StoryDimensionKey = "delivery" | "engagement" | "traffic" | "revenue";
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
  format: "engagement",
  duration: "delivery",
  aspect: "traffic",
  motion: "delivery",
  contrast: "delivery",
  brandProminence: "engagement",
  brandConsistency: "revenue",
  funnelStage: "revenue",
  cta: "traffic",
  productInFirst3s: "delivery",
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const safeAverage = (campaignAssets: CreativeAsset[], getter: (item: CreativeAsset) => number) => {
  if (!campaignAssets.length) return 0;
  return campaignAssets.reduce((sum, item) => sum + getter(item), 0) / campaignAssets.length;
};

const pctDelta = (value: number, average: number) => {
  if (!average) return 0;
  return ((value - average) / average) * 100;
};

const benchmarkText = (value: number, average: number, inverse = false) => {
  if (!average) return "0% vs campaign avg";
  const delta = inverse ? ((average - value) / average) * 100 : pctDelta(value, average);
  const rounded = Math.round(Math.abs(delta));
  if (rounded < 1) return "0% vs campaign avg";
  return `${delta >= 0 ? "+" : "-"}${rounded}% vs campaign avg`;
};

const toScore = (...deltas: number[]) => {
  const avgDelta = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
  return clampScore(50 + avgDelta * 1.2);
};

const totalEngagement = (asset: CreativeAsset) => asset.postReactions + asset.postComments + asset.postShares + asset.postSaves;
const engagementRate = (asset: CreativeAsset) => (asset.impressions > 0 ? (totalEngagement(asset) / asset.impressions) * 100 : 0);
const clickVolume = (asset: CreativeAsset) => asset.channel === "google" ? asset.clicks : asset.linkClicks;
const clickToLpv = (asset: CreativeAsset) => {
  const clicks = clickVolume(asset);
  return clicks > 0 ? (asset.landingPageViews / clicks) * 100 : 0;
};
const conversionRateFromClicks = (asset: CreativeAsset) => {
  const clicks = clickVolume(asset);
  return clicks > 0 ? (asset.conversions / clicks) * 100 : 0;
};
const hookMetric = (asset: CreativeAsset) => {
  if (asset.channel === "tiktok") return asset.videoPlays ? ((asset.videoViews6s || 0) / asset.videoPlays) * 100 : 0;
  if (asset.type === "video") return asset.avgWatchTime || 0;
  return asset.frequency;
};
const hookMetricLabel = (asset: CreativeAsset) => {
  if (asset.channel === "tiktok") return "6s View Rate";
  if (asset.type === "video") return "Avg Watch";
  return "Frequency";
};
const hookMetricFormat = (asset: CreativeAsset): StoryMetricFormat => {
  if (asset.channel === "tiktok") return "pct";
  if (asset.type === "video") return "sec";
  return "num";
};
const deliveryProfileSignal = (asset: CreativeAsset) => `${asset.creativeProfile.motionIntensity} motion · ${asset.creativeProfile.productInFirst3s ? "product visible early" : "product introduced late"} · ${asset.creativeProfile.colorContrast} contrast`;
const engagementProfileSignal = (asset: CreativeAsset) => `${asset.creativeProfile.brandProminence} branding · ${asset.type} format`;
const trafficProfileSignal = (asset: CreativeAsset) => `${asset.creativeProfile.callToAction} CTA · ${asset.creativeProfile.aspectRatio}`;
const revenueProfileSignal = (asset: CreativeAsset) => `${asset.creativeProfile.funnelStage} funnel · ${asset.creativeProfile.brandConsistency} consistency`;

export function buildCreativeStorySummary(
  asset: CreativeAsset,
  campaignAssets: CreativeAsset[],
  options?: { selectedRoas?: number },
): StorySummaryRow[] {
  const currentRoas = options?.selectedRoas ?? asset.roas;

  const currentImpressions = asset.impressions;
  const avgImpressions = safeAverage(campaignAssets, (item) => item.impressions);
  const currentCpm = asset.cpm;
  const avgCpm = safeAverage(campaignAssets, (item) => item.cpm);
  const currentHook = hookMetric(asset);
  const avgHook = safeAverage(campaignAssets, (item) => hookMetric(item));

  const currentEngagementRate = engagementRate(asset);
  const avgEngagementRate = safeAverage(campaignAssets, (item) => engagementRate(item));
  const currentShares = asset.postShares;
  const avgShares = safeAverage(campaignAssets, (item) => item.postShares);

  const currentClicks = clickVolume(asset);
  const avgClicks = safeAverage(campaignAssets, (item) => clickVolume(item));
  const currentClickToLpv = clickToLpv(asset);
  const avgClickToLpv = safeAverage(campaignAssets, (item) => clickToLpv(item));

  const currentRevenue = asset.purchaseValue;
  const avgRevenue = safeAverage(campaignAssets, (item) => item.purchaseValue);
  const currentConvRate = conversionRateFromClicks(asset);
  const avgConvRate = safeAverage(campaignAssets, (item) => conversionRateFromClicks(item));

  const deliveryScore = toScore(
    pctDelta(currentImpressions, avgImpressions),
    pctDelta(currentHook, avgHook),
    pctDelta(avgCpm - currentCpm, avgCpm),
  );
  const engagementScore = toScore(
    pctDelta(currentEngagementRate, avgEngagementRate),
    pctDelta(currentShares, avgShares),
  );
  const trafficScore = toScore(
    pctDelta(currentClicks, avgClicks),
    pctDelta(currentClickToLpv, avgClickToLpv),
  );
  const revenueScore = toScore(
    pctDelta(currentRevenue, avgRevenue),
    pctDelta(currentRoas, safeAverage(campaignAssets, (item) => item.roas)),
    pctDelta(currentConvRate, avgConvRate),
  );

  return [
    {
      key: "delivery",
      title: "Delivery",
      profileSignal: deliveryProfileSignal(asset),
      score: deliveryScore,
      story: `Delivery is built from scale and cost efficiency, then explained by ${asset.creativeProfile.motionIntensity.toLowerCase()} motion, ${asset.creativeProfile.colorContrast.toLowerCase()} contrast, and ${asset.creativeProfile.productInFirst3s ? "early product visibility" : "later product reveal"}.`,
      drivers: [
        {
          metricKey: "impressions",
          label: "Impressions",
          section: "Top-line KPIs",
          value: currentImpressions,
          average: avgImpressions,
          format: "num",
          benchmark: benchmarkText(currentImpressions, avgImpressions),
        },
        {
          metricKey: "cpm",
          label: "CPM",
          section: "Delivery",
          value: currentCpm,
          average: avgCpm,
          format: "dollar2",
          benchmark: benchmarkText(currentCpm, avgCpm, true),
        },
      ],
    },
    {
      key: "engagement",
      title: "Engagement",
      profileSignal: engagementProfileSignal(asset),
      score: engagementScore,
      story: `Engagement is anchored in how strongly this creative earns reactions and shares, which is why brand prominence and format are the main profile correlates for diagnostics.`,
      drivers: [
        {
          metricKey: "engagement_rate",
          label: "Eng. Rate",
          section: asset.channel === "tiktok" ? "Engagement & Growth" : "Engagement",
          value: currentEngagementRate,
          average: avgEngagementRate,
          format: "pct",
          benchmark: benchmarkText(currentEngagementRate, avgEngagementRate),
        },
        {
          metricKey: "shares",
          label: "Shares",
          section: asset.channel === "tiktok" ? "Engagement & Growth" : "Engagement",
          value: currentShares,
          average: avgShares,
          format: "num",
          benchmark: benchmarkText(currentShares, avgShares),
        },
      ],
    },
    {
      key: "traffic",
      title: "Traffic",
      profileSignal: trafficProfileSignal(asset),
      score: trafficScore,
      story: `Traffic is defined by how much qualified visit volume the asset creates, so CTA and aspect ratio become the clearest creative profile explanations.`,
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
      key: "revenue",
      title: "Revenue",
      profileSignal: revenueProfileSignal(asset),
      score: revenueScore,
      story: `Revenue is the downstream outcome of the page: total revenue and return quality are linked back to funnel stage and brand consistency so diagnostics explain why this asset monetizes better or worse.`,
      drivers: [
        {
          metricKey: "revenue",
          label: "Revenue",
          section: "Conversions & Revenue",
          value: currentRevenue,
          average: avgRevenue,
          format: "num",
          benchmark: benchmarkText(currentRevenue, avgRevenue),
        },
        {
          metricKey: "roas",
          label: "ROAS",
          section: "Conversions & Revenue",
          value: currentRoas,
          average: safeAverage(campaignAssets, (item) => item.roas),
          format: "x",
          benchmark: benchmarkText(currentRoas, safeAverage(campaignAssets, (item) => item.roas)),
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
