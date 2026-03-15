import creative1 from "@/assets/creative-1.jpg";
import creative2 from "@/assets/creative-2.jpg";
import creative3 from "@/assets/creative-3.jpg";
import creative4 from "@/assets/creative-4.jpg";

export type Channel = "meta" | "tiktok" | "google";

export interface ChannelPerformance {
  channel: Channel;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpc: number;
}

export interface CreativeAsset {
  id: string;
  name: string;
  type: "video" | "image" | "carousel";
  thumbnail: string;
  dimensions: string;
  channels: ChannelPerformance[];
  totalSpend: number;
  totalRoas: number;
  roasDelta: number; // % change vs benchmark
}

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  endDate: string;
  totalBudget: number;
  totalSpend: number;
  assets: CreativeAsset[];
}

export const campaigns: Campaign[] = [
  {
    id: "camp-001",
    name: "Holiday 2024",
    status: "active",
    startDate: "2024-11-15",
    endDate: "2024-12-31",
    totalBudget: 85000,
    totalSpend: 52340,
    assets: [
      {
        id: "CRV-4821",
        name: "Video_Hero_01",
        type: "video",
        thumbnail: creative1,
        dimensions: "1080×1920",
        totalSpend: 18402,
        totalRoas: 4.2,
        roasDelta: 12.3,
        channels: [
          { channel: "meta", spend: 8200, impressions: 245000, clicks: 6120, conversions: 412, roas: 3.8, ctr: 2.5, cpc: 1.34 },
          { channel: "tiktok", spend: 6800, impressions: 520000, clicks: 15600, conversions: 580, roas: 4.8, ctr: 3.0, cpc: 0.44 },
          { channel: "google", spend: 3402, impressions: 89000, clicks: 2670, conversions: 98, roas: 1.2, ctr: 3.0, cpc: 1.27 },
        ],
      },
      {
        id: "CRI-7734",
        name: "Static_Product_03",
        type: "image",
        thumbnail: creative2,
        dimensions: "1200×628",
        totalSpend: 12840,
        totalRoas: 3.1,
        roasDelta: -5.2,
        channels: [
          { channel: "meta", spend: 7200, impressions: 182000, clicks: 4550, conversions: 295, roas: 3.4, ctr: 2.5, cpc: 1.58 },
          { channel: "tiktok", spend: 2400, impressions: 98000, clicks: 2940, conversions: 88, roas: 2.1, ctr: 3.0, cpc: 0.82 },
          { channel: "google", spend: 3240, impressions: 124000, clicks: 4340, conversions: 186, roas: 3.6, ctr: 3.5, cpc: 0.75 },
        ],
      },
      {
        id: "CRC-9901",
        name: "Carousel_Gift_Guide",
        type: "carousel",
        thumbnail: creative3,
        dimensions: "1080×1080",
        totalSpend: 9450,
        totalRoas: 5.6,
        roasDelta: 28.4,
        channels: [
          { channel: "meta", spend: 6200, impressions: 310000, clicks: 9300, conversions: 620, roas: 6.2, ctr: 3.0, cpc: 0.67 },
          { channel: "tiktok", spend: 1800, impressions: 72000, clicks: 2160, conversions: 72, roas: 2.8, ctr: 3.0, cpc: 0.83 },
          { channel: "google", spend: 1450, impressions: 54000, clicks: 1620, conversions: 102, roas: 4.4, ctr: 3.0, cpc: 0.90 },
        ],
      },
      {
        id: "CRV-5523",
        name: "Video_UGC_Review",
        type: "video",
        thumbnail: creative4,
        dimensions: "1080×1920",
        totalSpend: 11648,
        totalRoas: 2.8,
        roasDelta: -14.2,
        channels: [
          { channel: "meta", spend: 4200, impressions: 112000, clicks: 2240, conversions: 134, roas: 2.4, ctr: 2.0, cpc: 1.88 },
          { channel: "tiktok", spend: 5200, impressions: 340000, clicks: 10200, conversions: 312, roas: 3.6, ctr: 3.0, cpc: 0.51 },
          { channel: "google", spend: 2248, impressions: 67000, clicks: 1340, conversions: 42, roas: 1.1, ctr: 2.0, cpc: 1.68 },
        ],
      },
    ],
  },
  {
    id: "camp-002",
    name: "Spring Collection 2025",
    status: "paused",
    startDate: "2025-02-01",
    endDate: "2025-04-15",
    totalBudget: 45000,
    totalSpend: 18200,
    assets: [],
  },
];
