import creative1 from "@/assets/creative-1.jpg";
import creative2 from "@/assets/creative-2.jpg";
import creative3 from "@/assets/creative-3.jpg";
import creative4 from "@/assets/creative-4.jpg";

export type Channel = "meta" | "tiktok" | "google" | "linkedin" | "amazon";

export interface DailyMetric {
  date: string;
  fullDate: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  purchaseValue: number;
  roas: number;
  cumulativeSpend: number;
  cumulativePurchaseValue: number;
  cumulativeRoas: number;
  ctr: number;
  cpm: number;
  videoViewRate?: number; // TikTok: % of impressions resulting in 2s+ view
  // Funnel metrics
  landingPageViews: number;
  addToCart: number;
  initiateCheckout: number;
}

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
export type MotionIntensity = "None" | "Subtle" | "High";
export type ContrastLevel = "Low" | "Medium" | "High";
export type BrandProminence = "Subtle" | "Balanced" | "Dominant";
export type BrandConsistency = "Low" | "Medium" | "High";
export type FunnelStage = "Awareness" | "Consideration" | "Conversion";

export interface CreativeProfile {
  aspectRatio: AspectRatio;
  videoDuration?: number; // seconds
  motionIntensity: MotionIntensity;
  colorContrast: ContrastLevel;
  brandProminence: BrandProminence;
  brandConsistency: BrandConsistency;
  funnelStage: FunnelStage;
  callToAction: string;
  productInFirst3s: boolean;
}

export interface CreativeAsset {
  id: string;
  name: string;
  type: "video" | "image" | "carousel";
  thumbnail: string;
  dimensions: string;
  channel: Channel;
  creativeProfile: CreativeProfile;
  // Spend & Budget
  spend: number;
  // Delivery
  impressions: number;
  reach: number;
  frequency: number;
  // Engagement
  clicks: number;
  linkClicks: number;
  outboundClicks: number;
  postReactions: number;
  postComments: number;
  postShares: number;
  postSaves: number;
  // Video (optional for non-video)
  videoPlays?: number;
  thruPlays?: number; // Meta: ThruPlays (15s+ or completion)
  completedViews?: number; // TikTok: video completions
  avgWatchTime?: number;
  videoWatched25?: number;
  videoWatched50?: number;
  videoWatched75?: number;
  videoWatched95?: number;
  videoViews6s?: number; // TikTok: 6-second focused views (hook metric)
  // Conversions
  conversions: number;
  purchaseValue: number;
  addToCart: number;
  initiateCheckout: number;
  landingPageViews: number;
  // Computed rates & costs
  roas: number;
  ctr: number;
  ctrAll: number;
  cpc: number;
  cpcAll: number;
  cpm: number;
  conversionRate: number;
  costPerResult: number;
  // Quality (Meta Ad Relevance Diagnostics — Meta only)
  qualityRanking: "above_average" | "average" | "below_average";
  engagementRateRanking: "above_average" | "average" | "below_average";
  conversionRateRanking: "above_average" | "average" | "below_average";
  // TikTok-specific metrics
  profileVisits?: number;
  follows?: number;
  paidLikes?: number;
  paidShares?: number;
  videoViewRate?: number; // % of impressions that resulted in 2s+ view
  // Google Ads-specific metrics
  viewThroughConversions?: number; // Conversions from users who saw but didn't click
  avgCpv?: number; // Average Cost Per Video View (Google Video)
  interactionRate?: number; // Interactions / Impressions (Google)
  // Daily breakdown
  dailyMetrics: DailyMetric[];
}

function generateDailyMetrics(totalSpend: number, totalImpressions: number, totalClicks: number, totalConversions: number, totalPurchaseValue: number, totalLPV: number, totalATC: number, totalIC: number, days: number = 30): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const now = new Date();
  let cumSpend = 0, cumPV = 0;

  const avgDailySpend = totalSpend / days;
  const avgDailyPV = totalPurchaseValue / days;
  const avgDailyImpr = totalImpressions / days;
  const avgDailyClicks = totalClicks / days;
  const avgDailyConv = totalConversions / days;
  const avgDailyLPV = totalLPV / days;
  const avgDailyATC = totalATC / days;
  const avgDailyIC = totalIC / days;

  let seed = totalSpend * 7 + totalConversions * 13;
  const seededRandom = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));

    const progress = i / (days - 1);
    const roasMultiplier = 0.4 + progress * 1.2;
    const noise = 0.85 + seededRandom() * 0.3;

    const daySpend = Math.round(avgDailySpend * (0.9 + seededRandom() * 0.2));
    const dayPV = Math.round(avgDailyPV * roasMultiplier * noise);
    const dayImpr = Math.round(avgDailyImpr * (0.8 + progress * 0.4) * (0.9 + seededRandom() * 0.2));
    const dayClicks = Math.round(avgDailyClicks * (0.7 + progress * 0.6) * (0.9 + seededRandom() * 0.2));
    const dayConv = Math.round(avgDailyConv * roasMultiplier * noise);
    const dayLPV = Math.round(avgDailyLPV * (0.7 + progress * 0.6) * (0.9 + seededRandom() * 0.2));
    const dayATC = Math.round(avgDailyATC * roasMultiplier * (0.9 + seededRandom() * 0.2));
    const dayIC = Math.round(avgDailyIC * roasMultiplier * (0.9 + seededRandom() * 0.2));

    const s = Math.max(1, daySpend);
    const pv = Math.max(0, dayPV);
    cumSpend += s;
    cumPV += pv;

    metrics.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      fullDate: d.toISOString().split('T')[0],
      spend: s,
      impressions: Math.max(0, dayImpr),
      clicks: Math.max(0, dayClicks),
      conversions: Math.max(0, dayConv),
      purchaseValue: pv,
      roas: Math.round(pv / s * 10) / 10,
      cumulativeSpend: cumSpend,
      cumulativePurchaseValue: cumPV,
      cumulativeRoas: Math.round(cumPV / cumSpend * 100) / 100,
      ctr: dayImpr > 0 ? Math.round(dayClicks / dayImpr * 10000) / 100 : 0,
      cpm: dayImpr > 0 ? Math.round(s / dayImpr * 100000) / 100 : 0,
      landingPageViews: Math.max(0, dayLPV),
      addToCart: Math.max(0, dayATC),
      initiateCheckout: Math.max(0, dayIC),
    });
  }
  return metrics;
}

export interface Campaign {
  id: string;
  name: string;
  owner: string;
  createdAt: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  endDate: string;
  totalBudget: number;
  totalSpend: number;
  assets: CreativeAsset[];
}

const rawCampaigns: (Omit<Campaign, 'assets'> & { assets: Omit<CreativeAsset, 'dailyMetrics'>[] })[] = [
  {
    id: "camp-001",
    name: "Holiday 2024",
    owner: "Alexandra Martinez",
    createdAt: "2024-10-20",
    status: "active",
    startDate: "2024-11-15",
    endDate: "2024-12-31",
    totalBudget: 85000,
    totalSpend: 52340,
    assets: [
      {
        id: "CRV-4821", name: "Video_Hero_01", type: "video", thumbnail: creative1, dimensions: "1080×1920", channel: "tiktok",
        creativeProfile: { aspectRatio: "9:16", videoDuration: 15, motionIntensity: "High", colorContrast: "High", brandProminence: "Balanced", brandConsistency: "High", funnelStage: "Awareness", callToAction: "Shop Now", productInFirst3s: true },
        spend: 6800, impressions: 520000, reach: 385000, frequency: 1.35, clicks: 15600, linkClicks: 12480, outboundClicks: 11200,
        postReactions: 4200, postComments: 380, postShares: 920, postSaves: 1450,
        videoPlays: 480000, thruPlays: 312000, avgWatchTime: 8.4, videoWatched25: 420000, videoWatched50: 310000, videoWatched75: 198000, videoWatched95: 124000,
        conversions: 580, purchaseValue: 32640, addToCart: 1820, initiateCheckout: 920, landingPageViews: 10800,
        roas: 4.8, ctr: 3.0, ctrAll: 4.2, cpc: 0.44, cpcAll: 0.35, cpm: 13.08, conversionRate: 3.7, costPerResult: 11.72,
        qualityRanking: "above_average", engagementRateRanking: "above_average", conversionRateRanking: "average",
        profileVisits: 8400, follows: 620, paidLikes: 3100, paidShares: 680, videoViewRate: 92.3, completedViews: 124000, videoViews6s: 396000,
      },
      {
        id: "CRI-7734", name: "Static_Product_03", type: "image", thumbnail: creative2, dimensions: "1200×628", channel: "meta",
        creativeProfile: { aspectRatio: "16:9", motionIntensity: "None", colorContrast: "Medium", brandProminence: "Dominant", brandConsistency: "High", funnelStage: "Conversion", callToAction: "Buy Now", productInFirst3s: true },
        spend: 7200, impressions: 182000, reach: 145000, frequency: 1.26, clicks: 4550, linkClicks: 3640, outboundClicks: 3280,
        postReactions: 1890, postComments: 142, postShares: 310, postSaves: 680,
        conversions: 295, purchaseValue: 24480, addToCart: 890, initiateCheckout: 520, landingPageViews: 3100,
        roas: 3.4, ctr: 2.5, ctrAll: 3.8, cpc: 1.58, cpcAll: 1.12, cpm: 39.56, conversionRate: 6.5, costPerResult: 24.41,
        qualityRanking: "average", engagementRateRanking: "average", conversionRateRanking: "above_average",
      },
      {
        id: "CRC-9901", name: "Carousel_Gift_Guide", type: "carousel", thumbnail: creative3, dimensions: "1080×1080", channel: "meta",
        creativeProfile: { aspectRatio: "1:1", motionIntensity: "Subtle", colorContrast: "High", brandProminence: "Balanced", brandConsistency: "High", funnelStage: "Consideration", callToAction: "Learn More", productInFirst3s: true },
        spend: 6200, impressions: 310000, reach: 248000, frequency: 1.25, clicks: 9300, linkClicks: 7440, outboundClicks: 6510,
        postReactions: 5100, postComments: 480, postShares: 1200, postSaves: 2800,
        conversions: 620, purchaseValue: 38440, addToCart: 2100, initiateCheckout: 1180, landingPageViews: 6200,
        roas: 6.2, ctr: 3.0, ctrAll: 4.5, cpc: 0.67, cpcAll: 0.48, cpm: 20.00, conversionRate: 6.7, costPerResult: 10.00,
        qualityRanking: "above_average", engagementRateRanking: "above_average", conversionRateRanking: "above_average",
      },
      {
        id: "CRV-5523", name: "Video_UGC_Review", type: "video", thumbnail: creative4, dimensions: "1080×1920", channel: "tiktok",
        creativeProfile: { aspectRatio: "9:16", videoDuration: 22, motionIntensity: "High", colorContrast: "Medium", brandProminence: "Subtle", brandConsistency: "Medium", funnelStage: "Awareness", callToAction: "Shop Now", productInFirst3s: false },
        spend: 5200, impressions: 340000, reach: 260000, frequency: 1.31, clicks: 10200, linkClicks: 8160, outboundClicks: 7140,
        postReactions: 3100, postComments: 290, postShares: 680, postSaves: 1100,
        videoPlays: 310000, thruPlays: 186000, avgWatchTime: 6.2, videoWatched25: 280000, videoWatched50: 195000, videoWatched75: 120000, videoWatched95: 72000,
        conversions: 312, purchaseValue: 18720, addToCart: 1020, initiateCheckout: 540, landingPageViews: 7100,
        roas: 3.6, ctr: 3.0, ctrAll: 4.0, cpc: 0.51, cpcAll: 0.40, cpm: 15.29, conversionRate: 3.1, costPerResult: 16.67,
        qualityRanking: "average", engagementRateRanking: "above_average", conversionRateRanking: "below_average",
        profileVisits: 5200, follows: 340, paidLikes: 2200, paidShares: 410, videoViewRate: 85.6, completedViews: 72000, videoViews6s: 248000,
      },
      {
        id: "CRI-4410", name: "Static_Hero_Banner", type: "image", thumbnail: creative1, dimensions: "1200×628", channel: "google",
        creativeProfile: { aspectRatio: "16:9", motionIntensity: "None", colorContrast: "Low", brandProminence: "Dominant", brandConsistency: "Low", funnelStage: "Awareness", callToAction: "Learn More", productInFirst3s: false },
        spend: 3402, impressions: 89000, reach: 72000, frequency: 1.24, clicks: 2670, linkClicks: 2136, outboundClicks: 1870,
        postReactions: 420, postComments: 28, postShares: 65, postSaves: 110,
        conversions: 98, purchaseValue: 4082, addToCart: 310, initiateCheckout: 180, landingPageViews: 1800,
        roas: 1.2, ctr: 3.0, ctrAll: 3.5, cpc: 1.27, cpcAll: 1.05, cpm: 38.22, conversionRate: 3.7, costPerResult: 34.71,
        qualityRanking: "below_average", engagementRateRanking: "below_average", conversionRateRanking: "below_average",
      },
      {
        id: "CRV-6612", name: "Video_Gift_Unbox", type: "video", thumbnail: creative4, dimensions: "1080×1920", channel: "google",
        creativeProfile: { aspectRatio: "9:16", videoDuration: 30, motionIntensity: "High", colorContrast: "Medium", brandProminence: "Balanced", brandConsistency: "Medium", funnelStage: "Consideration", callToAction: "Watch More", productInFirst3s: true },
        spend: 4200, impressions: 112000, reach: 89000, frequency: 1.26, clicks: 2240, linkClicks: 1792, outboundClicks: 1568,
        postReactions: 580, postComments: 42, postShares: 95, postSaves: 210,
        videoPlays: 98000, thruPlays: 58800, avgWatchTime: 5.1, videoWatched25: 86000, videoWatched50: 62000, videoWatched75: 38000, videoWatched95: 18000,
        conversions: 134, purchaseValue: 10080, addToCart: 420, initiateCheckout: 240, landingPageViews: 1500,
        roas: 2.4, ctr: 2.0, ctrAll: 3.0, cpc: 1.88, cpcAll: 1.40, cpm: 37.50, conversionRate: 6.0, costPerResult: 31.34,
        qualityRanking: "average", engagementRateRanking: "below_average", conversionRateRanking: "average",
      },
    ],
  },
  {
    id: "camp-002", name: "Spring Collection 2025", owner: "James Chen", createdAt: "2025-01-15",
    status: "active", startDate: "2025-03-01", endDate: "2025-05-31", totalBudget: 62000, totalSpend: 28400,
    assets: [
      {
        id: "CRI-3310", name: "Static_Lookbook_01", type: "image", thumbnail: creative2, dimensions: "1200×628", channel: "meta",
        creativeProfile: { aspectRatio: "16:9", motionIntensity: "None", colorContrast: "High", brandProminence: "Balanced", brandConsistency: "High", funnelStage: "Consideration", callToAction: "Shop Collection", productInFirst3s: true },
        spend: 8400, impressions: 195000, reach: 156000, frequency: 1.25, clicks: 5850, linkClicks: 4680, outboundClicks: 4100,
        postReactions: 2400, postComments: 195, postShares: 410, postSaves: 920,
        conversions: 340, purchaseValue: 31920, addToCart: 1100, initiateCheckout: 620, landingPageViews: 3900,
        roas: 3.8, ctr: 3.0, ctrAll: 4.1, cpc: 1.44, cpcAll: 1.05, cpm: 43.08, conversionRate: 5.8, costPerResult: 24.71,
        qualityRanking: "average", engagementRateRanking: "average", conversionRateRanking: "above_average",
      },
      {
        id: "CRV-4412", name: "Video_BTS_Shoot", type: "video", thumbnail: creative4, dimensions: "1080×1920", channel: "tiktok",
        creativeProfile: { aspectRatio: "9:16", videoDuration: 18, motionIntensity: "High", colorContrast: "Medium", brandProminence: "Subtle", brandConsistency: "Medium", funnelStage: "Awareness", callToAction: "Follow Us", productInFirst3s: false },
        spend: 6800, impressions: 410000, reach: 320000, frequency: 1.28, clicks: 12300, linkClicks: 9840, outboundClicks: 8610,
        postReactions: 5800, postComments: 520, postShares: 1400, postSaves: 2100,
        videoPlays: 380000, thruPlays: 247000, avgWatchTime: 9.2, videoWatched25: 350000, videoWatched50: 260000, videoWatched75: 168000, videoWatched95: 98000,
        conversions: 492, purchaseValue: 35360, addToCart: 1580, initiateCheckout: 840, landingPageViews: 8200,
        roas: 5.2, ctr: 3.0, ctrAll: 4.4, cpc: 0.55, cpcAll: 0.42, cpm: 16.59, conversionRate: 4.0, costPerResult: 13.82,
        qualityRanking: "above_average", engagementRateRanking: "above_average", conversionRateRanking: "average",
        profileVisits: 9800, follows: 810, paidLikes: 4200, paidShares: 1050, videoViewRate: 89.1, completedViews: 98000, videoViews6s: 312000,
      },
      {
        id: "CRI-3311", name: "Static_Lookbook_02", type: "image", thumbnail: creative3, dimensions: "1200×628", channel: "google",
        creativeProfile: { aspectRatio: "16:9", motionIntensity: "None", colorContrast: "Medium", brandProminence: "Balanced", brandConsistency: "Medium", funnelStage: "Consideration", callToAction: "Shop Now", productInFirst3s: true },
        spend: 2600, impressions: 98000, reach: 78000, frequency: 1.26, clicks: 2940, linkClicks: 2352, outboundClicks: 2060,
        postReactions: 680, postComments: 45, postShares: 120, postSaves: 280,
        conversions: 142, purchaseValue: 10140, addToCart: 460, initiateCheckout: 260, landingPageViews: 2000,
        roas: 3.9, ctr: 3.0, ctrAll: 3.6, cpc: 0.88, cpcAll: 0.72, cpm: 26.53, conversionRate: 4.8, costPerResult: 18.31,
        qualityRanking: "average", engagementRateRanking: "average", conversionRateRanking: "average",
      },
    ],
  },
  {
    id: "camp-003", name: "Summer Sale 2025", owner: "Sarah Kim", createdAt: "2025-04-28",
    status: "active", startDate: "2025-06-01", endDate: "2025-08-31", totalBudget: 95000, totalSpend: 41200,
    assets: [
      {
        id: "CRC-6601", name: "Carousel_Flash_Deals", type: "carousel", thumbnail: creative3, dimensions: "1080×1080", channel: "meta",
        creativeProfile: { aspectRatio: "1:1", motionIntensity: "Subtle", colorContrast: "High", brandProminence: "Dominant", brandConsistency: "High", funnelStage: "Conversion", callToAction: "Shop Sale", productInFirst3s: true },
        spend: 12400, impressions: 520000, reach: 410000, frequency: 1.27, clicks: 15600, linkClicks: 12480, outboundClicks: 10920,
        postReactions: 7200, postComments: 680, postShares: 1800, postSaves: 4200,
        conversions: 1120, purchaseValue: 91760, addToCart: 3600, initiateCheckout: 2100, landingPageViews: 10500,
        roas: 7.4, ctr: 3.0, ctrAll: 4.8, cpc: 0.79, cpcAll: 0.55, cpm: 23.85, conversionRate: 7.2, costPerResult: 11.07,
        qualityRanking: "above_average", engagementRateRanking: "above_average", conversionRateRanking: "above_average",
      },
      {
        id: "CRV-7788", name: "Video_Pool_Party", type: "video", thumbnail: creative1, dimensions: "1080×1920", channel: "tiktok",
        creativeProfile: { aspectRatio: "9:16", videoDuration: 12, motionIntensity: "High", colorContrast: "High", brandProminence: "Subtle", brandConsistency: "Medium", funnelStage: "Awareness", callToAction: "Shop Now", productInFirst3s: true },
        spend: 8100, impressions: 490000, reach: 380000, frequency: 1.29, clicks: 14700, linkClicks: 11760, outboundClicks: 10290,
        postReactions: 6100, postComments: 540, postShares: 1500, postSaves: 2400,
        videoPlays: 450000, thruPlays: 292500, avgWatchTime: 7.8, videoWatched25: 410000, videoWatched50: 300000, videoWatched75: 190000, videoWatched95: 112000,
        conversions: 588, purchaseValue: 38880, addToCart: 1900, initiateCheckout: 1020, landingPageViews: 9800,
        roas: 4.8, ctr: 3.0, ctrAll: 4.3, cpc: 0.55, cpcAll: 0.43, cpm: 16.53, conversionRate: 4.0, costPerResult: 13.78,
        qualityRanking: "above_average", engagementRateRanking: "above_average", conversionRateRanking: "average",
        profileVisits: 7600, follows: 520, paidLikes: 4800, paidShares: 1100, videoViewRate: 91.8, completedViews: 112000, videoViews6s: 369000,
      },
      {
        id: "CRI-7789", name: "Static_Summer_Hero", type: "image", thumbnail: creative2, dimensions: "1200×628", channel: "google",
        creativeProfile: { aspectRatio: "16:9", motionIntensity: "None", colorContrast: "Medium", brandProminence: "Balanced", brandConsistency: "High", funnelStage: "Conversion", callToAction: "Buy Now", productInFirst3s: true },
        spend: 4300, impressions: 165000, reach: 132000, frequency: 1.25, clicks: 4950, linkClicks: 3960, outboundClicks: 3465,
        postReactions: 1200, postComments: 85, postShares: 220, postSaves: 520,
        conversions: 312, purchaseValue: 24940, addToCart: 980, initiateCheckout: 560, landingPageViews: 3400,
        roas: 5.8, ctr: 3.0, ctrAll: 3.9, cpc: 0.87, cpcAll: 0.68, cpm: 26.06, conversionRate: 6.3, costPerResult: 13.78,
        qualityRanking: "average", engagementRateRanking: "average", conversionRateRanking: "above_average",
      },
    ],
  },
  {
    id: "camp-004", name: "Back to School 2025", owner: "Alexandra Martinez", createdAt: "2025-06-10",
    status: "active", startDate: "2025-08-01", endDate: "2025-09-30", totalBudget: 55000, totalSpend: 12800,
    assets: [
      {
        id: "CRI-9902", name: "Static_Backpack_Hero", type: "image", thumbnail: creative2, dimensions: "1200×628", channel: "meta",
        creativeProfile: { aspectRatio: "16:9", motionIntensity: "None", colorContrast: "Medium", brandProminence: "Balanced", brandConsistency: "Medium", funnelStage: "Consideration", callToAction: "Shop Now", productInFirst3s: true },
        spend: 3200, impressions: 88000, reach: 70000, frequency: 1.26, clicks: 2640, linkClicks: 2112, outboundClicks: 1848,
        postReactions: 890, postComments: 62, postShares: 145, postSaves: 340,
        conversions: 132, purchaseValue: 9920, addToCart: 420, initiateCheckout: 240, landingPageViews: 1800,
        roas: 3.1, ctr: 3.0, ctrAll: 3.7, cpc: 1.21, cpcAll: 0.95, cpm: 36.36, conversionRate: 5.0, costPerResult: 24.24,
        qualityRanking: "average", engagementRateRanking: "average", conversionRateRanking: "average",
      },
      {
        id: "CRV-1134", name: "Video_Student_UGC", type: "video", thumbnail: creative4, dimensions: "1080×1920", channel: "tiktok",
        creativeProfile: { aspectRatio: "9:16", videoDuration: 20, motionIntensity: "High", colorContrast: "Medium", brandProminence: "Subtle", brandConsistency: "Low", funnelStage: "Awareness", callToAction: "Shop Now", productInFirst3s: false },
        spend: 4000, impressions: 280000, reach: 215000, frequency: 1.30, clicks: 8400, linkClicks: 6720, outboundClicks: 5880,
        postReactions: 2800, postComments: 240, postShares: 620, postSaves: 980,
        videoPlays: 260000, thruPlays: 156000, avgWatchTime: 6.8, videoWatched25: 230000, videoWatched50: 165000, videoWatched75: 102000, videoWatched95: 58000,
        conversions: 252, purchaseValue: 15200, addToCart: 780, initiateCheckout: 420, landingPageViews: 5600,
        roas: 3.8, ctr: 3.0, ctrAll: 4.1, cpc: 0.48, cpcAll: 0.37, cpm: 14.29, conversionRate: 3.0, costPerResult: 15.87,
        qualityRanking: "average", engagementRateRanking: "above_average", conversionRateRanking: "below_average",
      },
    ],
  },
  {
    id: "camp-005", name: "Winter Clearance 2024", owner: "James Chen", createdAt: "2023-12-01",
    status: "completed", startDate: "2024-01-10", endDate: "2024-02-28", totalBudget: 30000, totalSpend: 29800,
    assets: [],
  },
];

// Auto-generate dailyMetrics for all assets
export const campaigns: Campaign[] = rawCampaigns.map(c => ({
  ...c,
  assets: c.assets.map(a => ({
    ...a,
    dailyMetrics: generateDailyMetrics(a.spend, a.impressions, a.clicks, a.conversions, a.purchaseValue, a.landingPageViews, a.addToCart, a.initiateCheckout),
  })),
}));
