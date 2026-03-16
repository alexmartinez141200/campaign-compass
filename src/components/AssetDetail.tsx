import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown, AlertTriangle, Info, CalendarDays } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { CreativeAsset, DailyMetric } from "@/data/mockData";
import { buildCreativeStorySummary, formatStoryMetricValue } from "@/lib/creative-story";
import ChannelIcon from "./ChannelIcon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

interface AssetDetailProps {
  asset: CreativeAsset;
  campaignAssets: CreativeAsset[];
  onBack: () => void;
}

// ─── KPI Definitions (for info tooltips) ───
const kpiInfo: Record<string, string> = {
  // Universal
  "Impressions": "Total number of times this ad was displayed on screen. Includes repeat views by the same person.",
  "Conversions": "Number of completed purchase events attributed to this ad within the conversion window.",
  "ROAS": "Return on Ad Spend — revenue generated per dollar spent. A 4x ROAS means $4 revenue for every $1 spent.",
  "Reach": "Total unique users who saw this ad at least once. Unlike impressions, each person is counted only once.",
  "Frequency": "Average number of times each unique user saw this ad. Above 3.0 signals potential ad fatigue.",
  "CPM": "Cost Per Mille — cost per 1,000 impressions. Lower CPM means more efficient reach for your budget.",
  "Spend": "Total amount spent delivering this ad during the selected period.",
  "Revenue": "Total purchase value attributed to this ad within the conversion window.",
  "CPA": "Cost Per Acquisition — how much you pay for each purchase. Lower CPA means more efficient conversion spend.",
  "Avg Watch": "Average duration a viewer watched the video before scrolling or closing.",
  // Meta-specific
  "CTR": "Click-Through Rate — percentage of impressions that resulted in a link click. Higher CTR indicates more compelling creative.",
  "Link Clicks": "Clicks on links within the ad that lead to your website or app. Does not include post reactions or comments.",
  "CPC (Link)": "Cost Per Click on links only. Measures the efficiency of driving traffic to your destination.",
  "CPC (All)": "Cost Per Click including all click types — link clicks, post reactions, profile visits, etc.",
  "Outbound Clicks": "Clicks that take users off-platform to your website. Closest metric to actual site visits.",
  "Plays": "Total number of times the video started playing, including auto-plays in feed.",
  "ThruPlays": "Number of times the video was played to completion or for at least 15 seconds. Meta-specific metric.",
  "ThruPlay Rate": "Percentage of total plays that counted as ThruPlays (15s+ or completion). Meta-specific.",
  // TikTok-specific
  "Completed Views": "Number of times the video was watched to completion. TikTok's equivalent of Meta's ThruPlays.",
  "Completion Rate": "Percentage of viewers who watched the video to completion. TikTok's primary content retention metric.",
  "Video Views": "Total 2-second+ video views. TikTok's primary video metric.",
  "Video View Rate": "Percentage of impressions that resulted in a 2s+ video view. Higher = stronger hook.",
  "6s Views": "Video views that reached 6 seconds. TikTok's key hook metric — did your content hold attention past the critical first moments?",
  "6s View Rate": "Percentage of total video views that reached 6 seconds. The definitive measure of hook strength on TikTok.",
  "Website Clicks": "Clicks that take users to your website from TikTok. Equivalent to outbound clicks.",
  "Profile Visits": "Number of times users visited your TikTok profile after seeing this ad.",
  "Follows": "New followers attributed to this ad. Measures brand-building effectiveness.",
  "Paid Likes": "Likes from paid impressions only, excluding organic engagement.",
  "Paid Shares": "Shares from paid impressions only. High shares indicate viral potential.",
  // Google Ads-specific
  "Clicks": "Total clicks on the ad, including clicks to website. Google Ads' primary interaction metric.",
  "CPC": "Cost Per Click — average cost for each click on your ad. Google Ads' core efficiency metric.",
  "Interaction Rate": "Percentage of impressions that resulted in an interaction (click, video view, etc.). Google's engagement metric.",
  "View-Through Conv.": "Conversions from users who saw your ad but didn't click — they converted later. Key for measuring Display ad influence.",
  "Video Views (Google)": "Views of your video ad. On YouTube, counted when a user watches 30s (or the full ad if shorter) or interacts.",
  "View Rate": "Percentage of impressions that resulted in a video view. Measures how compelling your video thumbnail/hook is.",
  "Avg CPV": "Average Cost Per View — what you pay each time someone views your video ad. Core YouTube Ads efficiency metric.",
  "Video Completion": "Percentage of viewers who watched the video to 100%. Shows full content engagement.",
};

// ─── Insights Generator ───
function generateInsights(asset: CreativeAsset, all: CreativeAsset[]) {
  const insights: { type: "positive" | "warning" | "negative"; text: string }[] = [];
  const avg = (fn: (a: CreativeAsset) => number) => all.reduce((s, a) => s + fn(a), 0) / all.length;
  const avgRoas = avg(a => a.roas), avgCpm = avg(a => a.cpm), avgCtr = avg(a => a.ctr);
  const avgCpc = avg(a => a.cpc), avgConvRate = avg(a => a.conversionRate);
  const bestRoas = Math.max(...all.map(a => a.roas));

  if (asset.roas >= bestRoas) insights.push({ type: "positive", text: `Top performer — highest ROAS at ${asset.roas}x` });
  else if (asset.roas >= avgRoas * 1.2) insights.push({ type: "positive", text: `ROAS ${((asset.roas / avgRoas - 1) * 100).toFixed(0)}% above avg (${avgRoas.toFixed(1)}x)` });
  else if (asset.roas < avgRoas * 0.8) insights.push({ type: "negative", text: `ROAS ${((1 - asset.roas / avgRoas) * 100).toFixed(0)}% below avg — consider pausing` });

  if (asset.cpm < avgCpm * 0.8) insights.push({ type: "positive", text: `CPM $${asset.cpm.toFixed(2)} is ${((1 - asset.cpm / avgCpm) * 100).toFixed(0)}% cheaper — great reach efficiency` });
  else if (asset.cpm > avgCpm * 1.3) insights.push({ type: "warning", text: `High CPM $${asset.cpm.toFixed(2)} — audience may be too narrow` });

  if (asset.ctr > avgCtr * 1.2) insights.push({ type: "positive", text: `Strong CTR ${asset.ctr}% vs ${avgCtr.toFixed(1)}% avg` });
  else if (asset.ctr < avgCtr * 0.7) insights.push({ type: "negative", text: `Low CTR ${asset.ctr}% — needs stronger hook/CTA` });

  if (asset.conversionRate < avgConvRate * 0.7) insights.push({ type: "warning", text: `Conv. rate ${asset.conversionRate}% below avg — check landing page` });
  if (asset.cpc > avgCpc * 1.4) insights.push({ type: "warning", text: `CPC $${asset.cpc.toFixed(2)} is high — optimize targeting` });

  if (asset.frequency > 3) insights.push({ type: "warning", text: `High frequency (${asset.frequency.toFixed(1)}) — ad fatigue risk, consider refreshing creative` });

  const profit = asset.purchaseValue - asset.spend;
  if (profit > 0) insights.push({ type: "positive", text: `Profit: $${profit.toLocaleString()} on $${asset.spend.toLocaleString()} spend` });
  else insights.push({ type: "negative", text: `Negative ROI — $${asset.spend.toLocaleString()} spend → $${asset.purchaseValue.toLocaleString()} revenue` });

  return insights;
}

// ─── Utility Components ───
const rankingLabel = (r: string) => r === "above_average" ? "Above Avg" : r === "average" ? "Average" : "Below Avg";
const rankingColor = (r: string) => r === "above_average" ? "text-emerald-600 bg-emerald-50" : r === "average" ? "text-yellow-700 bg-yellow-50" : "text-destructive bg-red-50";

const healthDot = (status: "good" | "warning" | "critical") =>
  status === "good" ? "bg-emerald-500" : status === "warning" ? "bg-yellow-500" : "bg-destructive";

const TrendArrow = ({ value, suffix = "", inverse = false }: { value: number; suffix?: string; inverse?: boolean }) => {
  const isUp = value > 0;
  const isGood = inverse ? !isUp : isUp;
  if (Math.abs(value) < 0.1) return <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5"><Minus className="w-3 h-3" />0%</span>;
  return (
    <span className={`text-[10px] font-mono font-medium flex items-center gap-0.5 ${isGood ? "text-emerald-600" : "text-destructive"}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
};

const InfoButton = ({ label }: { label: string }) => {
  const info = kpiInfo[label];
  if (!info) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <Info className="w-3 h-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-relaxed">
        {info}
      </TooltipContent>
    </Tooltip>
  );
};

const KpiCard = ({ label, value, trend, trendInverse = false, health, sub, onClick }: {
  label: string; value: string; trend?: number; trendInverse?: boolean; health?: "good" | "warning" | "critical"; sub?: string; onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3.5 rounded-lg border border-border/60 bg-card flex-1 min-w-0 text-left ${onClick ? "transition-colors hover:bg-muted/40 cursor-pointer" : "cursor-default"}`}
  >
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <InfoButton label={label} />
      </div>
      {health && <div className={`w-1.5 h-1.5 rounded-full ${healthDot(health)}`} />}
    </div>
    <p className="text-lg font-mono font-bold text-foreground leading-tight">{value}</p>
    <div className="flex items-center gap-2 mt-1">
      {trend !== undefined && <TrendArrow value={trend} suffix="%" inverse={trendInverse} />}
      {sub && <span className="text-[9px] text-muted-foreground">{sub}</span>}
    </div>
  </button>
);

const SectionHeader = ({ title, description, contribution, sectionId }: { title: string; description: string; contribution?: string; sectionId?: string }) => (
  <div id={sectionId} className="mt-10 mb-5 scroll-mt-24">
    <div className="flex items-center gap-3 mb-1.5">
      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground/80 font-bold whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-px bg-border/50" />
    </div>
    <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{description}</p>
    {contribution && (
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-2">
        Creative profile contribution: <span className="text-foreground">{contribution}</span>
      </p>
    )}
  </div>
);

const ChartCard = ({ title, children, height = "h-40" }: { title: string; children: React.ReactNode; height?: string }) => (
  <div className="rounded-lg border border-border/60 bg-card p-4">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">{title}</p>
    <div className={height}>{children}</div>
  </div>
);

const chartTooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '11px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
};

type DatePreset = "7d" | "14d" | "30d" | "custom";

// ─── Main Component ───
const AssetDetail = ({ asset, campaignAssets, onBack }: AssetDetailProps) => {
  const [datePreset, setDatePreset] = useState<DatePreset>("7d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const insights = generateInsights(asset, campaignAssets);
  const rank = [...campaignAssets].sort((a, b) => b.roas - a.roas).findIndex(a => a.id === asset.id) + 1;
  const isVideo = asset.type === "video";
  const isTikTok = asset.channel === "tiktok";
  const isMeta = asset.channel === "meta";
  const isGoogle = asset.channel === "google";
  const daily = asset.dailyMetrics;
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Filter daily metrics
  const filteredDaily = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let filtered: DailyMetric[];
    switch (datePreset) {
      case "7d": { const s = new Date(now); s.setDate(now.getDate() - 6); filtered = daily.filter(d => d.fullDate >= s.toISOString().split('T')[0] && d.fullDate <= todayStr); break; }
      case "14d": { const s = new Date(now); s.setDate(now.getDate() - 13); filtered = daily.filter(d => d.fullDate >= s.toISOString().split('T')[0] && d.fullDate <= todayStr); break; }
      case "30d": filtered = daily; break;
      case "custom":
        if (customRange?.from) { const f = customRange.from.toISOString().split('T')[0]; const t = customRange.to ? customRange.to.toISOString().split('T')[0] : f; filtered = daily.filter(d => d.fullDate >= f && d.fullDate <= t); }
        else filtered = daily; break;
      default: filtered = daily;
    }
    let cumSpend = 0, cumPV = 0;
    return filtered.map(d => {
      cumSpend += d.spend;
      cumPV += d.purchaseValue;
      const baseVvr = asset.videoViewRate || 88;
      const vvrNoise = (d.ctr - (asset.ctr || 3)) * 2;
      const videoViewRate = Math.round((baseVvr + vvrNoise) * 10) / 10;
      return {
        ...d,
        cumulativeRoas: cumSpend > 0 ? Math.round(cumPV / cumSpend * 100) / 100 : 0,
        videoViewRate: Math.max(60, Math.min(99, videoViewRate)),
      };
    });
  }, [daily, datePreset, customRange]);

  const trends = useMemo(() => {
    if (filteredDaily.length < 4) return { impressions: 0, cpm: 0, ctr: 0, roas: 0, clicks: 0 };
    const mid = Math.floor(filteredDaily.length / 2);
    const first = filteredDaily.slice(0, mid);
    const second = filteredDaily.slice(mid);
    const avgOf = (arr: typeof filteredDaily, key: keyof DailyMetric) => arr.reduce((s, d) => s + (d[key] as number), 0) / arr.length;
    const pctChange = (a: number, b: number) => b === 0 ? 0 : ((a - b) / b) * 100;
    return {
      impressions: pctChange(avgOf(second, 'impressions'), avgOf(first, 'impressions')),
      cpm: pctChange(avgOf(second, 'cpm'), avgOf(first, 'cpm')),
      ctr: pctChange(avgOf(second, 'ctr'), avgOf(first, 'ctr')),
      roas: pctChange(avgOf(second, 'roas'), avgOf(first, 'roas')),
      clicks: pctChange(avgOf(second, 'clicks'), avgOf(first, 'clicks')),
    };
  }, [filteredDaily]);

  const rangeSummary = useMemo(() => {
    const s = filteredDaily.reduce((a, d) => a + d.spend, 0);
    const r = filteredDaily.reduce((a, d) => a + d.purchaseValue, 0);
    return { spend: s, revenue: r, roas: s > 0 ? Math.round(r / s * 100) / 100 : 0 };
  }, [filteredDaily]);

  const campaignAverages = useMemo(() => {
    const avg = (getValue: (item: CreativeAsset) => number) => campaignAssets.reduce((sum, item) => sum + getValue(item), 0) / campaignAssets.length;

    return {
      ctr: avg((item) => item.ctr),
      roas: avg((item) => item.roas),
      cpm: avg((item) => item.cpm),
      linkClicks: avg((item) => isGoogle ? item.clicks : item.linkClicks),
      engagement: avg((item) => item.postReactions + item.postComments + item.postShares + item.postSaves),
      landingPageViews: avg((item) => item.landingPageViews),
      addToCart: avg((item) => item.addToCart),
      checkout: avg((item) => item.initiateCheckout),
      conversions: avg((item) => item.conversions),
      avgWatch: avg((item) => item.avgWatchTime || 0),
      hookRate: avg((item) => item.videoPlays ? ((item.videoViews6s || 0) / item.videoPlays) * 100 : item.ctr),
    };
  }, [campaignAssets, isGoogle]);

  const storySummaryRows = useMemo(
    () => buildCreativeStorySummary(asset, campaignAssets, { selectedRoas: rangeSummary.roas }),
    [asset, campaignAssets, rangeSummary.roas],
  );

  const pillarSectionMap: Record<string, string> = {
    delivery: "section-delivery",
    engagement: isGoogle ? "section-click-performance" : "section-engagement",
    traffic: "section-traffic",
    revenue: "section-revenue",
  };

  // Health indicators
  const cpmAvg = campaignAverages.cpm;
  const ctrAvg = campaignAverages.ctr;
  const freqHealth: "good" | "warning" | "critical" = asset.frequency > 4 ? "critical" : asset.frequency > 2.5 ? "warning" : "good";
  const cpmHealth: "good" | "warning" | "critical" = asset.cpm < cpmAvg * 0.9 ? "good" : asset.cpm > cpmAvg * 1.2 ? "critical" : "warning";
  const ctrHealth: "good" | "warning" | "critical" = asset.ctr > ctrAvg * 1.1 ? "good" : asset.ctr < ctrAvg * 0.8 ? "critical" : "warning";
  const roasHealth: "good" | "warning" | "critical" = asset.roas > 2 ? "good" : asset.roas > 1 ? "warning" : "critical";

  // Engagement data — platform-aware labels
  const engagementData = isTikTok ? [
    { name: "Likes", value: asset.postReactions, color: "hsl(227, 71%, 55%)" },
    { name: "Comments", value: asset.postComments, color: "hsl(174, 100%, 33%)" },
    { name: "Shares", value: asset.postShares, color: "hsl(45, 93%, 47%)" },
    { name: "Favorites", value: asset.postSaves, color: "hsl(346, 84%, 61%)" },
  ] : [
    { name: "Reactions", value: asset.postReactions, color: "hsl(227, 71%, 55%)" },
    { name: "Comments", value: asset.postComments, color: "hsl(174, 100%, 33%)" },
    { name: "Shares", value: asset.postShares, color: "hsl(45, 93%, 47%)" },
    { name: "Saves", value: asset.postSaves, color: "hsl(346, 84%, 61%)" },
  ];
  const engagementTotal = engagementData.reduce((s, d) => s + d.value, 0);

  // Funnel steps — platform-aware labels
  const funnelSteps = [
    { label: isGoogle ? "Website Visits" : "Landing Page Views", value: asset.landingPageViews, color: "hsl(227, 71%, 55%)" },
    { label: "Add to Cart", value: asset.addToCart, color: "hsl(174, 100%, 33%)" },
    { label: "Checkout", value: asset.initiateCheckout, color: "hsl(45, 93%, 47%)" },
    { label: "Purchase", value: asset.conversions, color: "hsl(142, 71%, 45%)" },
  ];

  // Video retention
  const videoRetentionData = isVideo ? (isTikTok ? [
    { point: "Start", pct: 100 },
    { point: "6s", pct: Math.round((asset.videoViews6s || 0) / (asset.videoPlays || 1) * 100) },
    { point: "25%", pct: Math.round((asset.videoWatched25 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "50%", pct: Math.round((asset.videoWatched50 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "75%", pct: Math.round((asset.videoWatched75 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "100%", pct: Math.round((asset.completedViews || 0) / (asset.videoPlays || 1) * 100) },
  ] : [
    { point: "Start", pct: 100 },
    { point: "25%", pct: Math.round((asset.videoWatched25 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "50%", pct: Math.round((asset.videoWatched50 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "75%", pct: Math.round((asset.videoWatched75 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "95%", pct: Math.round((asset.videoWatched95 || 0) / (asset.videoPlays || 1) * 100) },
  ]) : [];

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

        {/* ─── ASSET HEADER ─── */}
        <div className="rounded-xl border border-border/60 bg-card mb-4 overflow-hidden flex shadow-card">
          {/* Left: Identity */}
          <div className="w-1/3 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <ChannelIcon channel={asset.channel} size="md" />
              <div className="text-right">
                <p className="text-xl font-mono font-bold text-foreground leading-none">#{rank}</p>
                <p className="text-[9px] text-muted-foreground">of {campaignAssets.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/30">
                <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground leading-tight">{asset.name}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-1">{asset.id} · {asset.dimensions}</p>
              </div>
            </div>
          </div>

          {/* Right: Creative Profile */}
          <div className="flex-1 border-l border-border/40 bg-muted/20 px-5 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {[
                ["Platform", asset.channel === "meta" ? "Meta" : asset.channel === "tiktok" ? "TikTok" : "Google"],
                ["Format", asset.type.charAt(0).toUpperCase() + asset.type.slice(1)],
                ...(asset.creativeProfile.videoDuration ? [["Duration", `${asset.creativeProfile.videoDuration}s`]] : []),
                ["Ratio", asset.creativeProfile.aspectRatio],
                ["Motion", asset.creativeProfile.motionIntensity],
                ["Contrast", asset.creativeProfile.colorContrast],
                ["Brand", asset.creativeProfile.brandProminence],
                ["Consistency", asset.creativeProfile.brandConsistency],
                ["Funnel", asset.creativeProfile.funnelStage],
                ["CTA", asset.creativeProfile.callToAction],
                ["Product 3s", asset.creativeProfile.productInFirst3s ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {storySummaryRows.map((row) => (
            <KpiCard
              key={row.key}
              label={row.title}
              value={formatStoryMetricValue(row.drivers[0].value, row.drivers[0].format)}
              sub={`${row.drivers[0].label} · ${row.profileSignal}`}
              onClick={() => scrollToSection(pillarSectionMap[row.key])}
            />
          ))}
        </div>

        {/* ─── DATE FILTER ─── */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
          <p className="text-[11px] text-muted-foreground font-medium">Date Range</p>
          <div className="flex items-center gap-1.5">
            {(["7d", "14d", "30d"] as DatePreset[]).map((preset) => (
              <button key={preset} onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md border transition-colors ${
                  datePreset === preset ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                }`}
              >{preset === "7d" ? "7 Days" : preset === "14d" ? "14 Days" : "30 Days"}</button>
            ))}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button onClick={() => setDatePreset("custom")}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
                    datePreset === "custom" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                  }`}
                ><CalendarDays className="w-3.5 h-3.5" />Custom</button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="range" selected={customRange}
                  onSelect={(range) => { setCustomRange(range); setDatePreset("custom"); if (range?.to) setCalendarOpen(false); }}
                  numberOfMonths={1} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ─── TOP-LINE KPIs (platform-aware) ─── */}
        {isTikTok ? (
          <div className="grid grid-cols-5 gap-3 mb-2">
            <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} trend={trends.impressions} />
            <KpiCard label="Video Views" value={(asset.videoPlays || 0).toLocaleString()} sub="2s+ views" />
            <KpiCard label="6s View Rate" value={`${asset.videoPlays ? ((asset.videoViews6s || 0) / asset.videoPlays * 100).toFixed(1) : 0}%`} sub="Hook strength" />
            <KpiCard label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.conversionRate}% rate`} />
            <KpiCard label="ROAS" value={`${asset.roas}x`} trend={trends.roas} health={roasHealth} />
          </div>
        ) : isGoogle ? (
          <div className="grid grid-cols-5 gap-3 mb-2">
            <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} trend={trends.impressions} />
            <KpiCard label="Clicks" value={asset.clicks.toLocaleString()} trend={trends.clicks} />
            <KpiCard label="CTR" value={`${asset.ctr}%`} trend={trends.ctr} health={ctrHealth} />
            <KpiCard label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.conversionRate}% rate`} />
            <KpiCard label="ROAS" value={`${asset.roas}x`} trend={trends.roas} health={roasHealth} />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3 mb-2">
            <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} trend={trends.impressions} />
            <KpiCard label="CTR" value={`${asset.ctr}%`} trend={trends.ctr} health={ctrHealth} />
            <KpiCard label="Link Clicks" value={asset.linkClicks.toLocaleString()} trend={trends.clicks} />
            <KpiCard label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.conversionRate}% rate`} />
            <KpiCard label="ROAS" value={`${asset.roas}x`} trend={trends.roas} health={roasHealth} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TIKTOK FLOW: Video → Engagement & Growth → Delivery → Traffic → Conversions → Insights
            META/OTHER FLOW: Delivery → Engagement → Traffic → Conversions → Video → Insights
            ═══════════════════════════════════════════════════ */}

        {isTikTok ? (
          <>
            {/* ═══ A. VIDEO PERFORMANCE (TikTok's core — first) ═══ */}
            <SectionHeader sectionId="section-delivery" title="Video Performance" description="TikTok video metrics — 6-second view rate measures hook strength, completion rate shows content quality." contribution="Motion intensity, product in first 3s, and video duration strengthen delivery by improving hold and early qualification." />
            <div className="grid grid-cols-2 gap-3">
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Video Views" value={(asset.videoPlays || 0).toLocaleString()} sub="2s+ views" />
                <KpiCard label="6s Views" value={(asset.videoViews6s || 0).toLocaleString()} sub="Passed the hook" />
                <KpiCard label="6s View Rate" value={`${asset.videoPlays ? ((asset.videoViews6s || 0) / asset.videoPlays * 100).toFixed(1) : 0}%`} sub="Hook strength" />
                <KpiCard label="Completed Views" value={(asset.completedViews || 0).toLocaleString()} sub="Watched to end" />
                <KpiCard label="Avg Watch" value={`${asset.avgWatchTime || 0}s`} />
                <KpiCard label="Completion Rate" value={`${asset.videoPlays ? ((asset.completedViews || 0) / asset.videoPlays * 100).toFixed(1) : 0}%`} sub="Views to completion" />
              </div>
              <ChartCard title="Retention Curve" height="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={videoRetentionData}>
                    <defs>
                      <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="point" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                    <Area type="monotone" dataKey="pct" name="Retention" stroke="hsl(227, 71%, 55%)" fill="url(#retentionGrad)" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ═══ B. ENGAGEMENT & GROWTH ═══ */}
            <SectionHeader sectionId="section-engagement" title="Engagement & Growth" description="On-platform signals — likes, shares, and profile actions that drive organic reach and brand building." contribution="Brand prominence and format contribute most here by shaping how worth-sharing and memorable the asset feels." />
            <div className="grid grid-cols-2 gap-3">
              {/* Engagement donut */}
              <div className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex items-center gap-5">
                  <div className="w-28 h-28 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={engagementData} cx="50%" cy="50%" innerRadius={26} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {engagementData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip {...chartTooltipStyle} formatter={(value: number, name: string) => [`${value.toLocaleString()} (${(value / engagementTotal * 100).toFixed(1)}%)`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {engagementData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-[11px] text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-[12px] font-mono font-bold text-foreground">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">Total</span>
                      <span className="text-[13px] font-mono font-bold text-foreground">{engagementTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TikTok Growth Signals */}
              <div className="rounded-lg border border-border/60 bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4">TikTok Growth Signals</p>
                <div className="grid grid-cols-2 gap-3">
                  <KpiCard label="Profile Visits" value={(asset.profileVisits || 0).toLocaleString()} sub="From this ad" />
                  <KpiCard label="Follows" value={(asset.follows || 0).toLocaleString()} sub="New followers" />
                  <KpiCard label="Paid Likes" value={(asset.paidLikes || 0).toLocaleString()} sub="From paid reach" />
                  <KpiCard label="Paid Shares" value={(asset.paidShares || 0).toLocaleString()} sub="Viral potential" />
                </div>
              </div>
            </div>

            {/* ═══ C. DELIVERY ═══ */}
            <SectionHeader sectionId="section-delivery" title="Delivery" description="How efficiently the ad reaches your audience. Watch frequency for fatigue and CPM for cost efficiency." contribution="Motion intensity, product in first 3s, and color contrast contribute to delivery by improving thumb-stop power and scalable reach." />
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <KpiCard label="Reach" value={asset.reach.toLocaleString()} sub="Unique users" />
                <KpiCard label="Frequency" value={asset.frequency.toFixed(2)} health={freqHealth} sub={freqHealth === "critical" ? "⚠ Ad fatigue risk" : freqHealth === "warning" ? "Monitor closely" : "Healthy range"} />
                <KpiCard label="CPM" value={`$${asset.cpm.toFixed(2)}`} trend={trends.cpm} trendInverse health={cpmHealth} />
                <KpiCard label="Spend" value={`$${asset.spend.toLocaleString()}`} sub="Total budget used" />
              </div>
              <div className="col-span-3">
                <ChartCard title="CPM Over Time" height="h-[168px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredDaily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Line type="monotone" dataKey="cpm" name="CPM" stroke="hsl(346, 84%, 61%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {/* ═══ D. TRAFFIC ═══ */}
            <SectionHeader sectionId="section-traffic" title="Traffic" description="Video view rate trend shows hook effectiveness over time. CPC and website clicks measure off-platform traffic quality." contribution="CTA and aspect ratio contribute most to traffic because they govern click intent and how natively the asset performs in-feed." />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <KpiCard label="CPC (Link)" value={`$${asset.cpc.toFixed(2)}`} sub="Cost per link click" />
              <KpiCard label="CPC (All)" value={`$${asset.cpcAll.toFixed(2)}`} sub="All click types" />
              <KpiCard label="Website Clicks" value={asset.outboundClicks.toLocaleString()} sub="To your site" />
            </div>
            <ChartCard title="Video View Rate % Over Time" height="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} domain={['dataMin - 5', 'dataMax + 2']} />
                  <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                  <Line type="monotone" dataKey="videoViewRate" name="Video View Rate" stroke="hsl(227, 71%, 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ═══ E. CONVERSIONS & REVENUE ═══ */}
            <SectionHeader sectionId="section-revenue" title="Conversions & Revenue" description="The bottom line — from click-through to purchase, and your return on ad spend." contribution="Funnel stage and brand consistency contribute most to revenue because they influence purchase readiness, trust, and downstream efficiency." />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <KpiCard label="Revenue" value={`$${rangeSummary.revenue.toLocaleString()}`} sub="Selected period" />
              <KpiCard label="ROAS" value={`${rangeSummary.roas}x`} health={roasHealth} sub="Revenue ÷ Spend" />
              <KpiCard label="CPA" value={`$${asset.costPerResult.toFixed(2)}`} sub="Cost per purchase" />
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3">
                <ChartCard title="ROAS Over Time" height="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredDaily} barSize={filteredDaily.length > 14 ? 6 : 12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}x`} />
                      <RechartsTooltip {...chartTooltipStyle}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0]?.payload;
                          return (
                            <div style={chartTooltipStyle.contentStyle} className="p-2.5">
                              <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
                              <p className="text-[11px]">ROAS: {data.roas}x</p>
                              <p className="text-[11px]">Spend: ${data.spend.toLocaleString()}</p>
                              <p className="text-[11px]">Revenue: ${data.purchaseValue.toLocaleString()}</p>
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine y={rangeSummary.roas} stroke="hsl(346, 84%, 61%)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Avg ${rangeSummary.roas}x`, position: "right", fontSize: 9, fill: "hsl(346, 84%, 61%)" }} />
                      <Bar dataKey="roas" name="ROAS" fill="hsl(174, 100%, 33%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-span-2 rounded-lg border border-border/60 bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Conversion Funnel</p>
                <div className="space-y-2">
                  {funnelSteps.map((step, i, arr) => {
                    const pctOfTop = (step.value / arr[0].value * 100).toFixed(1);
                    const dropOff = i > 0 ? (100 - (step.value / arr[i - 1].value * 100)).toFixed(1) : null;
                    return (
                      <div key={step.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
                            <span className="text-[11px] text-foreground font-medium">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-mono font-bold text-foreground">{step.value.toLocaleString()}</span>
                            {dropOff && <span className="text-[9px] font-mono text-destructive/70">↓{dropOff}%</span>}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pctOfTop}%`, background: step.color, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium">LPV → Purchase</span>
                  <span className="text-[12px] font-mono font-bold text-foreground">{(asset.conversions / asset.landingPageViews * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </>
        ) : isGoogle ? (
          <>
            {/* ═══════ GOOGLE ADS FLOW ═══════ */}
            {/* Flow: Delivery → Click Performance → Conversions & Revenue → Video (if applicable) */}

            {/* ═══ A. DELIVERY ═══ */}
            <SectionHeader sectionId="section-delivery" title="Delivery" description="How efficiently the ad reaches your audience. Monitor frequency for fatigue and CPM for cost efficiency." contribution="Motion intensity, product in first 3s, and color contrast contribute to delivery by improving attention capture and media efficiency." />
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <KpiCard label="Reach" value={asset.reach.toLocaleString()} sub="Unique users" />
                <KpiCard label="Frequency" value={asset.frequency.toFixed(2)} health={freqHealth} sub={freqHealth === "critical" ? "⚠ Ad fatigue risk" : freqHealth === "warning" ? "Monitor closely" : "Healthy range"} />
                <KpiCard label="CPM" value={`$${asset.cpm.toFixed(2)}`} trend={trends.cpm} trendInverse health={cpmHealth} />
                <KpiCard label="Spend" value={`$${asset.spend.toLocaleString()}`} sub="Total budget used" />
              </div>
              <div className="col-span-3">
                <ChartCard title="CPM Over Time" height="h-[168px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredDaily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Line type="monotone" dataKey="cpm" name="CPM" stroke="hsl(346, 84%, 61%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {/* ═══ B. CLICK PERFORMANCE ═══ */}
            <SectionHeader sectionId="section-click-performance" title="Click Performance" description="How users interact with your ad. CTR and CPC are Google Ads' core performance signals." contribution="CTA and aspect ratio contribute most here because they shape click intent, ad clarity, and landing-page continuation quality." />
            <div className="grid grid-cols-4 gap-3 mb-3">
              <KpiCard label="Clicks" value={asset.clicks.toLocaleString()} trend={trends.clicks} />
              <KpiCard label="CTR" value={`${asset.ctr}%`} trend={trends.ctr} health={ctrHealth} />
              <KpiCard label="CPC" value={`$${asset.cpc.toFixed(2)}`} sub="Avg cost per click" />
              <KpiCard label="Interaction Rate" value={`${asset.interactionRate || 0}%`} sub="Interactions / Impressions" />
            </div>
            <ChartCard title="CTR % Over Time" height="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                  <Line type="monotone" dataKey="ctr" name="CTR" stroke="hsl(227, 71%, 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ═══ C. CONVERSIONS & REVENUE ═══ */}
            <SectionHeader sectionId="section-revenue" title="Conversions & Revenue" description="Direct and view-through conversions. View-through measures users who saw your ad but converted later without clicking." contribution="Funnel stage and brand consistency contribute most to revenue by aligning message depth with intent and reinforcing trust through conversion." />
            <div className="grid grid-cols-4 gap-3 mb-3">
              <KpiCard label="Revenue" value={`$${rangeSummary.revenue.toLocaleString()}`} sub="Selected period" />
              <KpiCard label="ROAS" value={`${rangeSummary.roas}x`} health={roasHealth} sub="Revenue ÷ Spend" />
              <KpiCard label="CPA" value={`$${asset.costPerResult.toFixed(2)}`} sub="Cost per purchase" />
              <KpiCard label="View-Through Conv." value={(asset.viewThroughConversions || 0).toLocaleString()} sub="Saw ad, converted later" />
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3">
                <ChartCard title="ROAS Over Time" height="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredDaily} barSize={filteredDaily.length > 14 ? 6 : 12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}x`} />
                      <RechartsTooltip {...chartTooltipStyle}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0]?.payload;
                          return (
                            <div style={chartTooltipStyle.contentStyle} className="p-2.5">
                              <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
                              <p className="text-[11px]">ROAS: {data.roas}x</p>
                              <p className="text-[11px]">Spend: ${data.spend.toLocaleString()}</p>
                              <p className="text-[11px]">Revenue: ${data.purchaseValue.toLocaleString()}</p>
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine y={rangeSummary.roas} stroke="hsl(346, 84%, 61%)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Avg ${rangeSummary.roas}x`, position: "right", fontSize: 9, fill: "hsl(346, 84%, 61%)" }} />
                      <Bar dataKey="roas" name="ROAS" fill="hsl(174, 100%, 33%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-span-2 rounded-lg border border-border/60 bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Conversion Funnel</p>
                <div className="space-y-2">
                  {funnelSteps.map((step, i, arr) => {
                    const pctOfTop = (step.value / arr[0].value * 100).toFixed(1);
                    const dropOff = i > 0 ? (100 - (step.value / arr[i - 1].value * 100)).toFixed(1) : null;
                    return (
                      <div key={step.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
                            <span className="text-[11px] text-foreground font-medium">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-mono font-bold text-foreground">{step.value.toLocaleString()}</span>
                            {dropOff && <span className="text-[9px] font-mono text-destructive/70">↓{dropOff}%</span>}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pctOfTop}%`, background: step.color, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium">LPV → Purchase</span>
                  <span className="text-[12px] font-mono font-bold text-foreground">{(asset.conversions / asset.landingPageViews * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* ═══ D. VIDEO PERFORMANCE (Google Video/YouTube — if applicable) ═══ */}
            {isVideo && (
              <>
                <SectionHeader title="Video Performance" description="YouTube/Google Video metrics — view rate measures creative appeal, quartile retention shows where viewers drop off." />
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <KpiCard label="Video Views (Google)" value={(asset.videoPlays || 0).toLocaleString()} sub="30s+ or interaction" />
                    <KpiCard label="View Rate" value={`${((asset.videoPlays || 0) / (asset.impressions || 1) * 100).toFixed(1)}%`} sub="Views / Impressions" />
                    <KpiCard label="Avg CPV" value={`$${(asset.avgCpv || 0).toFixed(3)}`} sub="Cost per view" />
                    <KpiCard label="Avg Watch" value={`${asset.avgWatchTime || 0}s`} />
                    <KpiCard label="Video Completion" value={`${((asset.videoWatched95 || 0) / (asset.videoPlays || 1) * 100).toFixed(1)}%`} sub="Watched to 100%" />
                    <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} sub="Total ad serves" />
                  </div>
                  <ChartCard title="Quartile Retention" height="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={videoRetentionData}>
                        <defs>
                          <linearGradient id="retentionGradGoogle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="point" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                        <Area type="monotone" dataKey="pct" name="Retention" stroke="hsl(227, 71%, 55%)" fill="url(#retentionGradGoogle)" strokeWidth={2} dot={{ r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* ═══════ META FLOW ═══════ */}

            {/* ═══ A. DELIVERY ═══ */}
            <SectionHeader title="Delivery" description="How efficiently the ad reaches your audience. Watch frequency for fatigue and CPM for cost efficiency." />
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <KpiCard label="Reach" value={asset.reach.toLocaleString()} sub="Unique users" />
                <KpiCard label="Frequency" value={asset.frequency.toFixed(2)} health={freqHealth} sub={freqHealth === "critical" ? "⚠ Ad fatigue risk" : freqHealth === "warning" ? "Monitor closely" : "Healthy range"} />
                <KpiCard label="CPM" value={`$${asset.cpm.toFixed(2)}`} trend={trends.cpm} trendInverse health={cpmHealth} />
                <KpiCard label="Spend" value={`$${asset.spend.toLocaleString()}`} sub="Total budget used" />
              </div>
              <div className="col-span-3">
                <ChartCard title="CPM Over Time" height="h-[168px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredDaily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Line type="monotone" dataKey="cpm" name="CPM" stroke="hsl(346, 84%, 61%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {/* ═══ B. ENGAGEMENT ═══ */}
            <SectionHeader title="Engagement" description="On-platform signals showing how users respond to the creative before clicking through." />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex items-center gap-5">
                  <div className="w-28 h-28 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={engagementData} cx="50%" cy="50%" innerRadius={26} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {engagementData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip {...chartTooltipStyle} formatter={(value: number, name: string) => [`${value.toLocaleString()} (${(value / engagementTotal * 100).toFixed(1)}%)`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {engagementData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-[11px] text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-[12px] font-mono font-bold text-foreground">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">Total</span>
                      <span className="text-[13px] font-mono font-bold text-foreground">{engagementTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Meta Ad Relevance Diagnostics */}
              <div className="rounded-lg border border-border/60 bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4">Ad Relevance Diagnostics</p>
                <div className="space-y-3">
                  {([
                    ["Quality Ranking", asset.qualityRanking, "Ad creative quality vs competitors"],
                    ["Engagement Ranking", asset.engagementRateRanking, "Expected engagement vs competitors"],
                    ["Conversion Ranking", asset.conversionRateRanking, "Expected conversion vs competitors"],
                  ] as const).map(([label, val, desc]) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-foreground">{label}</p>
                        <p className="text-[9px] text-muted-foreground">{desc}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${rankingColor(val)}`}>
                        {rankingLabel(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ C. TRAFFIC ═══ */}
            <SectionHeader title="Traffic" description="Users clicking through to your site. CTR trends reveal creative effectiveness over time." />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <KpiCard label="CPC (Link)" value={`$${asset.cpc.toFixed(2)}`} sub="Cost per link click" />
              <KpiCard label="CPC (All)" value={`$${asset.cpcAll.toFixed(2)}`} sub="All click types" />
              <KpiCard label="Outbound Clicks" value={asset.outboundClicks.toLocaleString()} sub="Off-platform" />
            </div>
            <ChartCard title="CTR % Over Time" height="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                  <Line type="monotone" dataKey="ctr" name="CTR" stroke="hsl(227, 71%, 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ═══ D. CONVERSIONS & REVENUE ═══ */}
            <SectionHeader title="Conversions & Revenue" description="The bottom line — from landing page through purchase, and your return on ad spend." />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <KpiCard label="Revenue" value={`$${rangeSummary.revenue.toLocaleString()}`} sub="Selected period" />
              <KpiCard label="ROAS" value={`${rangeSummary.roas}x`} health={roasHealth} sub="Revenue ÷ Spend" />
              <KpiCard label="CPA" value={`$${asset.costPerResult.toFixed(2)}`} sub="Cost per purchase" />
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3">
                <ChartCard title="ROAS Over Time" height="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredDaily} barSize={filteredDaily.length > 14 ? 6 : 12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}x`} />
                      <RechartsTooltip {...chartTooltipStyle}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0]?.payload;
                          return (
                            <div style={chartTooltipStyle.contentStyle} className="p-2.5">
                              <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
                              <p className="text-[11px]">ROAS: {data.roas}x</p>
                              <p className="text-[11px]">Spend: ${data.spend.toLocaleString()}</p>
                              <p className="text-[11px]">Revenue: ${data.purchaseValue.toLocaleString()}</p>
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine y={rangeSummary.roas} stroke="hsl(346, 84%, 61%)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Avg ${rangeSummary.roas}x`, position: "right", fontSize: 9, fill: "hsl(346, 84%, 61%)" }} />
                      <Bar dataKey="roas" name="ROAS" fill="hsl(174, 100%, 33%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-span-2 rounded-lg border border-border/60 bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Conversion Funnel</p>
                <div className="space-y-2">
                  {funnelSteps.map((step, i, arr) => {
                    const pctOfTop = (step.value / arr[0].value * 100).toFixed(1);
                    const dropOff = i > 0 ? (100 - (step.value / arr[i - 1].value * 100)).toFixed(1) : null;
                    return (
                      <div key={step.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
                            <span className="text-[11px] text-foreground font-medium">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-mono font-bold text-foreground">{step.value.toLocaleString()}</span>
                            {dropOff && <span className="text-[9px] font-mono text-destructive/70">↓{dropOff}%</span>}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pctOfTop}%`, background: step.color, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium">LPV → Purchase</span>
                  <span className="text-[12px] font-mono font-bold text-foreground">{(asset.conversions / asset.landingPageViews * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* ═══ E. VIDEO PERFORMANCE (Meta — at the end) ═══ */}
            {isVideo && (
              <>
                <SectionHeader title="Video Performance" description="Retention analysis — where viewers drop off reveals content quality." />
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <KpiCard label="Plays" value={(asset.videoPlays || 0).toLocaleString()} />
                    <KpiCard label="ThruPlays" value={(asset.thruPlays || 0).toLocaleString()} />
                    <KpiCard label="Avg Watch" value={`${asset.avgWatchTime || 0}s`} />
                    <KpiCard label="ThruPlay Rate" value={`${((asset.thruPlays || 0) / (asset.videoPlays || 1) * 100).toFixed(1)}%`} />
                  </div>
                  <ChartCard title="Retention Curve" height="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={videoRetentionData}>
                        <defs>
                          <linearGradient id="retentionGradMeta" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="point" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                        <Area type="monotone" dataKey="pct" name="Retention" stroke="hsl(227, 71%, 55%)" fill="url(#retentionGradMeta)" strokeWidth={2} dot={{ r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ INSIGHTS & RECOMMENDATIONS (always last) ═══ */}
        <SectionHeader title="Insights" description="AI-generated analysis comparing this creative against others in your campaign." />
        <div className="space-y-1.5 mb-8">
          {insights.map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-md border ${
                insight.type === "positive" ? "bg-emerald-50/50 border-emerald-200/50" :
                insight.type === "warning" ? "bg-yellow-50/50 border-yellow-200/50" :
                "bg-red-50/50 border-red-200/50"
              }`}
            >
              {insight.type === "positive" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" /> :
               insight.type === "warning" ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" /> :
               <TrendingDown className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />}
              <p className="text-[12px] text-foreground/80 leading-relaxed">{insight.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default AssetDetail;
