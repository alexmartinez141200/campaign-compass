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
  owner: string;
  createdAt: string;
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
    owner: "Alexandra Martinez",
    createdAt: "2024-10-20",
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
    status: "active",
    startDate: "2025-03-01",
    endDate: "2025-05-31",
    totalBudget: 62000,
    totalSpend: 28400,
    assets: [
      {
        id: "CRI-3310",
        name: "Static_Lookbook_01",
        type: "image",
        thumbnail: creative2,
        dimensions: "1200×628",
        totalSpend: 14200,
        totalRoas: 3.5,
        roasDelta: 6.1,
        channels: [
          { channel: "meta", spend: 8400, impressions: 195000, clicks: 5850, conversions: 340, roas: 3.8, ctr: 3.0, cpc: 1.44 },
          { channel: "tiktok", spend: 3200, impressions: 128000, clicks: 3840, conversions: 115, roas: 2.9, ctr: 3.0, cpc: 0.83 },
          { channel: "google", spend: 2600, impressions: 98000, clicks: 2940, conversions: 142, roas: 3.9, ctr: 3.0, cpc: 0.88 },
        ],
      },
      {
        id: "CRV-4412",
        name: "Video_BTS_Shoot",
        type: "video",
        thumbnail: creative4,
        dimensions: "1080×1920",
        totalSpend: 14200,
        totalRoas: 4.1,
        roasDelta: 15.8,
        channels: [
          { channel: "meta", spend: 5100, impressions: 142000, clicks: 4260, conversions: 256, roas: 3.6, ctr: 3.0, cpc: 1.20 },
          { channel: "tiktok", spend: 6800, impressions: 410000, clicks: 12300, conversions: 492, roas: 5.2, ctr: 3.0, cpc: 0.55 },
          { channel: "google", spend: 2300, impressions: 72000, clicks: 2160, conversions: 78, roas: 2.4, ctr: 3.0, cpc: 1.06 },
        ],
      },
    ],
  },
  {
    id: "camp-003",
    name: "Summer Sale 2025",
    status: "active",
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    totalBudget: 95000,
    totalSpend: 41200,
    assets: [
      {
        id: "CRC-6601",
        name: "Carousel_Flash_Deals",
        type: "carousel",
        thumbnail: creative3,
        dimensions: "1080×1080",
        totalSpend: 22100,
        totalRoas: 6.8,
        roasDelta: 32.1,
        channels: [
          { channel: "meta", spend: 12400, impressions: 520000, clicks: 15600, conversions: 1120, roas: 7.4, ctr: 3.0, cpc: 0.79 },
          { channel: "tiktok", spend: 5400, impressions: 230000, clicks: 6900, conversions: 248, roas: 4.2, ctr: 3.0, cpc: 0.78 },
          { channel: "google", spend: 4300, impressions: 165000, clicks: 4950, conversions: 312, roas: 5.8, ctr: 3.0, cpc: 0.87 },
        ],
      },
      {
        id: "CRV-7788",
        name: "Video_Pool_Party",
        type: "video",
        thumbnail: creative1,
        dimensions: "1080×1920",
        totalSpend: 19100,
        totalRoas: 3.9,
        roasDelta: -2.4,
        channels: [
          { channel: "meta", spend: 7200, impressions: 198000, clicks: 5940, conversions: 356, roas: 3.6, ctr: 3.0, cpc: 1.21 },
          { channel: "tiktok", spend: 8100, impressions: 490000, clicks: 14700, conversions: 588, roas: 4.8, ctr: 3.0, cpc: 0.55 },
          { channel: "google", spend: 3800, impressions: 112000, clicks: 3360, conversions: 118, roas: 2.0, ctr: 3.0, cpc: 1.13 },
        ],
      },
    ],
  },
  {
    id: "camp-004",
    name: "Back to School 2025",
    status: "active",
    startDate: "2025-08-01",
    endDate: "2025-09-30",
    totalBudget: 55000,
    totalSpend: 12800,
    assets: [
      {
        id: "CRI-9902",
        name: "Static_Backpack_Hero",
        type: "image",
        thumbnail: creative2,
        dimensions: "1200×628",
        totalSpend: 6400,
        totalRoas: 2.9,
        roasDelta: -8.3,
        channels: [
          { channel: "meta", spend: 3200, impressions: 88000, clicks: 2640, conversions: 132, roas: 3.1, ctr: 3.0, cpc: 1.21 },
          { channel: "google", spend: 3200, impressions: 95000, clicks: 2850, conversions: 114, roas: 2.7, ctr: 3.0, cpc: 1.12 },
        ],
      },
      {
        id: "CRV-1134",
        name: "Video_Student_UGC",
        type: "video",
        thumbnail: creative4,
        dimensions: "1080×1920",
        totalSpend: 6400,
        totalRoas: 3.4,
        roasDelta: 4.7,
        channels: [
          { channel: "meta", spend: 2400, impressions: 65000, clicks: 1950, conversions: 98, roas: 3.0, ctr: 3.0, cpc: 1.23 },
          { channel: "tiktok", spend: 4000, impressions: 280000, clicks: 8400, conversions: 252, roas: 3.8, ctr: 3.0, cpc: 0.48 },
        ],
      },
    ],
  },
  {
    id: "camp-005",
    name: "Winter Clearance 2024",
    status: "completed",
    startDate: "2024-01-10",
    endDate: "2024-02-28",
    totalBudget: 30000,
    totalSpend: 29800,
    assets: [],
  },
];

