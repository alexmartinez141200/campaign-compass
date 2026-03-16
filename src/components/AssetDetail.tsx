import { useMemo, useState } from "react";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from "recharts";
import type { CreativeAsset } from "@/data/mockData";
import { axisStoryDimensionMap, buildCreativeStorySummary, formatStoryMetricValue } from "@/lib/creative-story";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface AssetDetailProps {
  asset: CreativeAsset;
  campaignAssets: CreativeAsset[];
  onBack: () => void;
}

type PillarKey = "delivery" | "engagement" | "traffic" | "revenue";

const kpiInfo: Record<string, string> = {
  Impressions: "Total number of times this ad was shown.",
  CTR: "Click-through rate from impressions to clicks.",
  "Link Clicks": "Clicks to the landing destination.",
  Conversions: "Attributed purchase actions.",
  ROAS: "Revenue divided by spend.",
  Reach: "Unique users reached.",
  Frequency: "Average number of times each person saw the ad.",
  CPM: "Cost per 1,000 impressions.",
  Spend: "Total spend for this asset.",
  Revenue: "Attributed purchase value.",
  CPA: "Cost per conversion.",
  Engagement: "Total reactions, comments, shares, and saves.",
  "Eng. Rate": "Engagement rate = total reactions, comments, shares, and saves divided by impressions.",
  Shares: "Total shares from the asset.",
  Saves: "How many users saved the creative for later.",
  Reactions: "Total likes and reactions on the ad.",
  Comments: "Total comments on the ad.",
  Clicks: "Total ad clicks recorded for this asset.",
  "Website Clicks": "Clicks that send users to the site.",
  "Landing Page Views": "Visits that successfully landed on the page.",
  "Click → LPV": "Share of clicks that turned into successful landing page views.",
};

const healthDot = (status: "good" | "warning" | "critical") =>
  status === "good" ? "bg-accent" : status === "warning" ? "bg-primary" : "bg-destructive";

const InfoButton = ({ label }: { label: string }) => {
  const info = kpiInfo[label];
  if (!info) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <Info className="w-3 h-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-relaxed">
        {info}
      </TooltipContent>
    </Tooltip>
  );
};

const TrendArrow = ({ value, inverse = false }: { value?: number; inverse?: boolean }) => {
  if (value === undefined) return null;
  const isUp = value > 0;
  const isGood = inverse ? !isUp : isUp;

  if (Math.abs(value) < 0.1) {
    return (
      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
        <Minus className="w-3 h-3" />0%
      </span>
    );
  }

  return (
    <span className={`text-[10px] font-mono font-medium flex items-center gap-0.5 ${isGood ? "text-accent" : "text-destructive"}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const KpiCard = ({
  label,
  value,
  sub,
  trend,
  trendInverse = false,
  health,
  onClick,
  active = false,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  trendInverse?: boolean;
  health?: "good" | "warning" | "critical";
  onClick?: () => void;
  active?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3.5 rounded-lg border text-left min-w-0 ${active ? "border-primary bg-primary/5" : "border-border/60 bg-card"} ${onClick ? "hover:bg-muted/40 transition-colors" : "cursor-default"}`}
  >
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <InfoButton label={label} />
      </div>
      {health && <div className={`w-2 h-2 rounded-full ${healthDot(health)}`} />}
    </div>
    <p className="text-lg font-mono font-bold text-foreground leading-tight break-words">{value}</p>
    <div className="flex items-center gap-2 mt-1">
      <TrendArrow value={trend} inverse={trendInverse} />
      {sub && <span className="text-[9px] text-muted-foreground">{sub}</span>}
    </div>
  </button>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mt-6 mb-4">
    <div className="flex items-center gap-3 mb-1.5">
      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground/80 font-bold whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-px bg-border/50" />
    </div>
    <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{description}</p>
  </div>
);

const AssetDetail = ({ asset, campaignAssets, onBack }: AssetDetailProps) => {
  const [activePillar, setActivePillar] = useState<PillarKey>("delivery");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("format");
  const [activeTopTab, setActiveTopTab] = useState<"creative" | "campaign">("creative");

  const storySummaryRows = useMemo(
    () => buildCreativeStorySummary(asset, campaignAssets, { selectedRoas: asset.roas }),
    [asset, campaignAssets],
  );

  const engagementTotal = asset.postReactions + asset.postComments + asset.postShares + asset.postSaves;
  const trafficClicks = asset.channel === "google" ? asset.clicks : asset.linkClicks;
  const trafficRate = trafficClicks > 0 ? (asset.landingPageViews / trafficClicks) * 100 : 0;

  const trends = useMemo(() => {
    const daily = asset.dailyMetrics;
    if (daily.length < 4) return { impressions: 0, ctr: 0, roas: 0, cpm: 0 };
    const mid = Math.floor(daily.length / 2);
    const first = daily.slice(0, mid);
    const second = daily.slice(mid);
    const avgOf = (arr: typeof daily, key: "impressions" | "ctr" | "roas" | "cpm") => arr.reduce((sum, row) => sum + row[key], 0) / arr.length;
    const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);

    return {
      impressions: pct(avgOf(second, "impressions"), avgOf(first, "impressions")),
      ctr: pct(avgOf(second, "ctr"), avgOf(first, "ctr")),
      roas: pct(avgOf(second, "roas"), avgOf(first, "roas")),
      cpm: pct(avgOf(second, "cpm"), avgOf(first, "cpm")),
    };
  }, [asset.dailyMetrics]);

  const chartData = useMemo(
    () =>
      asset.dailyMetrics.map((day) => ({
        date: day.date,
        cpm: day.cpm,
        ctr: day.ctr,
        clicks: day.clicks,
        lpv: day.landingPageViews,
        roas: day.roas,
        conversions: day.conversions,
      })),
    [asset.dailyMetrics],
  );

  const cpmAvg = campaignAssets.reduce((sum, item) => sum + item.cpm, 0) / campaignAssets.length;
  const ctrAvg = campaignAssets.reduce((sum, item) => sum + item.ctr, 0) / campaignAssets.length;
  const freqHealth: "good" | "warning" | "critical" = asset.frequency > 4 ? "critical" : asset.frequency > 2.5 ? "warning" : "good";
  const cpmHealth: "good" | "warning" | "critical" = asset.cpm < cpmAvg * 0.9 ? "good" : asset.cpm > cpmAvg * 1.2 ? "critical" : "warning";
  const ctrHealth: "good" | "warning" | "critical" = asset.ctr > ctrAvg * 1.1 ? "good" : asset.ctr < ctrAvg * 0.8 ? "critical" : "warning";
  const roasHealth: "good" | "warning" | "critical" = asset.roas > 2 ? "good" : asset.roas > 1 ? "warning" : "critical";

  const chartConfig = {
    cpm: { label: "CPM", color: "hsl(var(--destructive))" },
    ctr: { label: "CTR", color: "hsl(var(--accent))" },
    clicks: { label: "Clicks", color: "hsl(var(--primary))" },
    lpv: { label: "LPV", color: "hsl(var(--accent))" },
    roas: { label: "ROAS", color: "hsl(var(--primary))" },
    conversions: { label: "Conversions", color: "hsl(var(--destructive))" },
  };

  const creativeDiagnostics = useMemo(() => {
    const profileRows = [
      { key: "format", label: "Format", value: asset.type },
      { key: "duration", label: "Duration", value: asset.creativeProfile.videoDuration ? `${asset.creativeProfile.videoDuration}s` : "N/A" },
      { key: "aspect", label: "Aspect Ratio", value: asset.creativeProfile.aspectRatio },
      { key: "motion", label: "Motion", value: asset.creativeProfile.motionIntensity },
      { key: "contrast", label: "Contrast", value: asset.creativeProfile.colorContrast },
      { key: "brandProminence", label: "Brand", value: asset.creativeProfile.brandProminence },
      { key: "brandConsistency", label: "Consistency", value: asset.creativeProfile.brandConsistency },
      { key: "funnelStage", label: "Funnel", value: asset.creativeProfile.funnelStage },
      { key: "cta", label: "CTA", value: asset.creativeProfile.callToAction },
      { key: "productInFirst3s", label: "3s Product", value: asset.type === "video" ? (asset.creativeProfile.productInFirst3s ? "Yes" : "No") : "N/A" },
    ];

    return profileRows.map((row) => {
      const mappedDimension = axisStoryDimensionMap[row.key];
      const summary = mappedDimension ? storySummaryRows.find((item) => item.key === mappedDimension) : undefined;
      const metrics = (summary?.drivers ?? []).map((driver) => {
        const pctDiff = driver.average > 0 ? ((driver.value - driver.average) / driver.average) * 100 : 0;
        const inverseMetric = driver.metricKey.includes("cpm") || driver.metricKey.includes("cpc") || driver.metricKey.includes("cpa");
        const adjustedDiff = inverseMetric ? -pctDiff : pctDiff;

        return {
          label: driver.label,
          value: formatStoryMetricValue(driver.value, driver.format),
          average: formatStoryMetricValue(driver.average, driver.format),
          delta: Math.round(adjustedDiff),
        };
      });

      const score = metrics.length ? Math.max(0, Math.min(100, Math.round(50 + metrics.reduce((sum, metric) => sum + metric.delta, 0) / metrics.length))) : 50;

      return {
        key: row.key,
        label: row.label,
        value: row.value,
        score,
        status: score >= 70 ? "Good" : score <= 40 ? "Weak" : "Mixed",
        metrics,
      };
    });
  }, [asset, storySummaryRows]);

  const radarData = creativeDiagnostics.map((item) => ({
    key: item.key,
    label: item.label === "Aspect Ratio" ? "Aspect" : item.label,
    value: item.score,
  }));

  const pillarContent = {
    delivery: (
      <>
        <SectionHeader title="Delivery" description="A full view of how efficiently this creative scales reach, controls cost, and manages audience exposure." />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} trend={trends.impressions} />
            <KpiCard label="Reach" value={asset.reach.toLocaleString()} sub="Unique users" />
            <KpiCard label="Frequency" value={asset.frequency.toFixed(2)} health={freqHealth} sub="Avg exposures per person" />
            <KpiCard label="CPM" value={`$${asset.cpm.toFixed(2)}`} trend={trends.cpm} trendInverse health={cpmHealth} />
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">CPM over time</p>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={true} strokeDasharray="4 4" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} tickFormatter={(value) => `$${value}`} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line type="monotone" dataKey="cpm" stroke="var(--color-cpm)" strokeWidth={3} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        <SectionHeader title="What builds delivery" description="These are the core inputs behind delivery quality: total scale, unique reach, audience repetition, and cost efficiency." />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} sub="Total ad delivery" trend={trends.impressions} />
          <KpiCard label="Reach" value={asset.reach.toLocaleString()} sub="Unique people reached" />
          <KpiCard label="Frequency" value={asset.frequency.toFixed(2)} sub="Impressions ÷ reach" health={freqHealth} />
          <KpiCard label="CPM" value={`$${asset.cpm.toFixed(2)}`} sub="Cost per 1,000 impressions" trend={trends.cpm} trendInverse health={cpmHealth} />
          <KpiCard label="Spend" value={`$${asset.spend.toLocaleString()}`} sub="Budget used to generate delivery" />
        </div>
      </>
    ),
    engagement: (
      <>
        <SectionHeader title="Engagement" description="A full view of how this creative earns attention, interaction depth, and response quality across the audience." />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <KpiCard label="Engagement" value={engagementTotal.toLocaleString()} sub="Total interactions" />
            <KpiCard label="Eng. Rate" value={formatStoryMetricValue(storySummaryRows.find((row) => row.key === "engagement")?.drivers[0].value || 0, "pct")} sub="Interactions ÷ impressions" />
            <KpiCard label="Shares" value={asset.postShares.toLocaleString()} sub={`${engagementTotal ? ((asset.postShares / engagementTotal) * 100).toFixed(1) : "0.0"}% of engagement`} />
            <KpiCard label="Saves" value={asset.postSaves.toLocaleString()} sub={`${engagementTotal ? ((asset.postSaves / engagementTotal) * 100).toFixed(1) : "0.0"}% of engagement`} />
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Click response over time</p>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={true} strokeDasharray="4 4" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} tickFormatter={(value) => `${value}%`} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line type="monotone" dataKey="ctr" stroke="var(--color-ctr)" strokeWidth={3} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        <SectionHeader title="What builds engagement rate" description="These are the raw inputs behind the headline engagement rate, with impressions as the denominator." />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-6">
          <KpiCard label="Reactions" value={asset.postReactions.toLocaleString()} sub={`${engagementTotal ? ((asset.postReactions / engagementTotal) * 100).toFixed(1) : "0.0"}% of engagement`} />
          <KpiCard label="Comments" value={asset.postComments.toLocaleString()} sub={`${engagementTotal ? ((asset.postComments / engagementTotal) * 100).toFixed(1) : "0.0"}% of engagement`} />
          <KpiCard label="Shares" value={asset.postShares.toLocaleString()} sub={`${engagementTotal ? ((asset.postShares / engagementTotal) * 100).toFixed(1) : "0.0"}% of engagement`} />
          <KpiCard label="Saves" value={asset.postSaves.toLocaleString()} sub={`${engagementTotal ? ((asset.postSaves / engagementTotal) * 100).toFixed(1) : "0.0"}% of engagement`} />
          <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} sub="Rate denominator" />
          <KpiCard label="Eng. Rate" value={formatStoryMetricValue(storySummaryRows.find((row) => row.key === "engagement")?.drivers[0].value || 0, "pct")} sub="Final blended rate" />
        </div>
      </>
    ),
    traffic: (
      <>
        <SectionHeader title="Traffic" description="A full view of how efficiently this creative converts attention into outbound clicks, site visits, and successful landing sessions." />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <KpiCard label={asset.channel === "google" ? "Clicks" : "Link Clicks"} value={trafficClicks.toLocaleString()} sub="Qualified traffic" />
            <KpiCard label="Website Clicks" value={asset.outboundClicks.toLocaleString()} sub="Outbound visits" />
            <KpiCard label="Landing Page Views" value={asset.landingPageViews.toLocaleString()} sub="Successful loads" />
            <KpiCard label="Click → LPV" value={`${trafficRate.toFixed(1)}%`} sub="Landing efficiency" />
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Traffic over time</p>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={true} strokeDasharray="4 4" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="lpv" stroke="var(--color-lpv)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        <SectionHeader title="What builds traffic" description="These are the raw traffic steps from click generation to successful landing page arrival." />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          <KpiCard label={asset.channel === "google" ? "Clicks" : "Link Clicks"} value={trafficClicks.toLocaleString()} sub="Primary traffic signal" />
          <KpiCard label="Website Clicks" value={asset.outboundClicks.toLocaleString()} sub={`${trafficClicks ? ((asset.outboundClicks / trafficClicks) * 100).toFixed(1) : "0.0"}% of link clicks`} />
          <KpiCard label="Landing Page Views" value={asset.landingPageViews.toLocaleString()} sub={`${trafficClicks ? ((asset.landingPageViews / trafficClicks) * 100).toFixed(1) : "0.0"}% of link clicks`} />
          <KpiCard label="Click → LPV" value={`${trafficRate.toFixed(1)}%`} sub="Final landing efficiency" />
          <KpiCard label="CTR" value={`${asset.ctr.toFixed(1)}%`} sub="Impression to click rate" health={ctrHealth} trend={trends.ctr} />
        </div>
      </>
    ),
    revenue: (
      <>
        <SectionHeader title="Revenue" description="A full view of how efficiently this creative turns site intent into conversion volume, purchase value, and return on spend." />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <KpiCard label="Revenue" value={`$${asset.purchaseValue.toLocaleString()}`} sub="Attributed value" />
            <KpiCard label="ROAS" value={`${asset.roas.toFixed(1)}x`} health={roasHealth} trend={trends.roas} sub="Revenue ÷ spend" />
            <KpiCard label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.conversionRate}% LPV conversion rate`} />
            <KpiCard label="CPA" value={`$${asset.costPerResult.toFixed(2)}`} sub="Cost per purchase" />
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">ROAS over time</p>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={true} strokeDasharray="4 4" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line type="monotone" dataKey="roas" stroke="var(--color-roas)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="var(--color-conversions)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        <SectionHeader title="What builds revenue" description="These are the raw conversion steps behind revenue generation, from landing intent to checkout progression and final purchase efficiency." />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-6">
          <KpiCard label="Landing Page Views" value={asset.landingPageViews.toLocaleString()} sub="Qualified visit base" />
          <KpiCard label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.landingPageViews ? ((asset.conversions / asset.landingPageViews) * 100).toFixed(1) : "0.0"}% of LPVs`} />
          <KpiCard label="Revenue" value={`$${asset.purchaseValue.toLocaleString()}`} sub={`${asset.conversions ? `$${(asset.purchaseValue / asset.conversions).toFixed(2)}` : "$0.00"} per conversion`} />
          <KpiCard label="ROAS" value={`${asset.roas.toFixed(1)}x`} sub="Revenue ÷ spend" health={roasHealth} trend={trends.roas} />
          <KpiCard label="CPA" value={`$${asset.costPerResult.toFixed(2)}`} sub="Spend ÷ conversions" />
          <KpiCard label="Spend" value={`$${asset.spend.toLocaleString()}`} sub="Budget used to drive revenue" />
        </div>

        <SectionHeader title="Conversion funnel" description="This shows how post-click traffic moves through the lower-funnel journey from landing page visit to cart, checkout, and purchase." />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard label="Landing Page Views" value={asset.landingPageViews.toLocaleString()} sub="Top of conversion funnel" />
          <KpiCard label="Add to Cart" value={asset.addToCart.toLocaleString()} sub={`${asset.landingPageViews ? ((asset.addToCart / asset.landingPageViews) * 100).toFixed(1) : "0.0"}% of LPVs`} />
          <KpiCard label="Initiate Checkout" value={asset.initiateCheckout.toLocaleString()} sub={`${asset.addToCart ? ((asset.initiateCheckout / asset.addToCart) * 100).toFixed(1) : "0.0"}% of ATC`} />
          <KpiCard label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.initiateCheckout ? ((asset.conversions / asset.initiateCheckout) * 100).toFixed(1) : "0.0"}% of checkout`} />
        </div>
      </>
    ),
  } satisfies Record<PillarKey, JSX.Element>;

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Creative asset being analyzed</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-xl font-semibold text-foreground">{asset.name}</p>
                <p className="text-[11px] text-muted-foreground">{asset.id} · {asset.type}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                  Launched on {asset.channel}
                </span>
                <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Format: {asset.type}
                </span>
                <span className="rounded-full border border-border/60 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Campaign asset profile
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTopTab} onValueChange={(value) => setActiveTopTab(value as "creative" | "campaign")} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-lg border border-border/60 bg-muted/20 p-0.5 shadow-card">
            <TabsTrigger value="campaign" className="rounded-md px-4 py-2 text-[10px] uppercase tracking-[0.18em] data-[state=active]:bg-background data-[state=active]:shadow-sm">Campaign Performance</TabsTrigger>
            <TabsTrigger value="creative" className="rounded-md px-4 py-2 text-[10px] uppercase tracking-[0.18em] data-[state=active]:bg-background data-[state=active]:shadow-sm">Creative Asset Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="creative" className="mt-0 space-y-4">
            <SectionHeader title="Creative asset performance" description="Each row shows whether a creative profile category is doing good, mixed, or weak based on the campaign-average metrics used to evaluate it." />
            <div className="grid gap-4 lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]">
              <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-card self-start">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">Creative Attribute Analysis Chart</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Click any chart point or attribute label to inspect the matching category in the table.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Overall Score</p>
                    <p className="text-[26px] leading-none font-mono font-bold mt-1 text-accent">{Math.round(radarData.reduce((sum, item) => sum + item.value, 0) / radarData.length)}</p>
                  </div>
                </div>

                <div className="relative rounded-lg border border-border/70 bg-background">
                  <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-border/60" />
                  <div className="pointer-events-none absolute left-1/2 top-6 bottom-6 w-px -translate-x-1/2 border-l border-dashed border-border/60" />
                  <ChartContainer config={{ score: { label: "Score", color: "hsl(var(--primary))" } }} className="mx-auto h-[280px] w-full max-w-[420px]">
                    <RadarChart data={radarData} outerRadius="68%">
                      <PolarGrid radialLines={true} gridType="polygon" stroke="hsl(var(--border))" strokeOpacity={0.75} />
                      <PolarAngleAxis
                        dataKey="label"
                        tick={(tickProps: any) => {
                          const { payload, x, y, textAnchor } = tickProps;
                          const active = payload?.payload?.key === selectedCategoryKey;
                          const labelWidth = Math.max(String(payload?.value ?? "").length * 7.2, 44);
                          return (
                            <g
                              transform={`translate(${x}, ${y})`}
                              style={{ cursor: payload?.payload?.key ? "pointer" : "default" }}
                              onClick={() => payload?.payload?.key && setSelectedCategoryKey(payload.payload.key)}
                            >
                              <rect
                                x={textAnchor === "start" ? -4 : textAnchor === "end" ? -labelWidth + 4 : -labelWidth / 2}
                                y={-12}
                                width={labelWidth}
                                height={24}
                                rx={6}
                                fill="hsl(var(--background))"
                                fillOpacity={0.01}
                              />
                              <text
                                textAnchor={textAnchor}
                                fill={active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                                fontSize={10}
                                fontWeight={active ? 700 : 600}
                              >
                                {payload?.value}
                              </text>
                            </g>
                          );
                        }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="var(--color-score)"
                        fill="var(--color-score)"
                        fillOpacity={0.1}
                        strokeWidth={2.5}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (typeof cx !== "number" || typeof cy !== "number" || !payload?.key) return null;
                          const active = payload.key === selectedCategoryKey;
                          return (
                            <g style={{ cursor: "pointer" }} onClick={() => setSelectedCategoryKey(payload.key)}>
                              <circle cx={cx} cy={cy} r={18} fill="hsl(var(--background))" fillOpacity={0.01} />
                              <circle
                                cx={cx}
                                cy={cy}
                                r={active ? 8 : 6.5}
                                fill={active ? "hsl(var(--primary))" : "hsl(var(--background))"}
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                              />
                            </g>
                          );
                        }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
                <div className="grid grid-cols-[minmax(0,0.9fr)_96px_minmax(0,1.5fr)] gap-3 border-b border-border bg-muted/20 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  <div>Category</div>
                  <div>Status</div>
                  <div>Metric comparison</div>
                </div>
                {creativeDiagnostics.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedCategoryKey(item.key)}
                    className={`grid w-full grid-cols-[minmax(0,0.9fr)_96px_minmax(0,1.5fr)] gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 ${selectedCategoryKey === item.key ? "bg-primary/5" : "hover:bg-muted/20"}`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.value}</p>
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[11px] font-semibold text-foreground">{item.status}</p>
                    </div>
                    <div className="space-y-1.5">
                      {item.metrics.map((metric) => (
                        <div key={`${item.key}-${metric.label}`} className="grid grid-cols-[minmax(88px,0.95fr)_minmax(76px,0.8fr)_minmax(76px,0.8fr)_56px] items-center gap-3 rounded-md border border-border/50 bg-background/70 px-3 py-2">
                          <p className="text-[10px] font-semibold leading-snug text-foreground break-words">{metric.label}</p>
                          <div className="min-w-0">
                            <p className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Actual</p>
                            <p className="text-[10px] font-mono font-semibold leading-tight text-foreground break-words">{metric.value}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Average</p>
                            <p className="text-[10px] font-mono leading-tight text-muted-foreground break-words">{metric.average}</p>
                          </div>
                          <p className={`text-right text-[10px] font-mono font-semibold ${metric.delta > 0 ? "text-accent" : metric.delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {metric.delta > 0 ? "+" : ""}{metric.delta}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campaign" className="mt-0 space-y-4">
            <SectionHeader title="Campaign performance" description="" />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              {storySummaryRows.map((row) => (
                <KpiCard
                  key={row.key}
                  label={row.title}
                  value={formatStoryMetricValue(row.drivers[0].value, row.drivers[0].format)}
                  sub={row.drivers[0].label}
                  active={activePillar === row.key}
                  onClick={() => setActivePillar(row.key)}
                />
              ))}
            </div>

            {pillarContent[activePillar]}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default AssetDetail;
