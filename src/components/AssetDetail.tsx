import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Eye, MousePointerClick, ShoppingCart, Target, BarChart3, Heart, MessageCircle, Share2, Bookmark, Play, Clock, Users, Repeat, ExternalLink, Crosshair, CalendarDays } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import type { CreativeAsset, DailyMetric } from "@/data/mockData";
import ChannelIcon from "./ChannelIcon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

interface AssetDetailProps {
  asset: CreativeAsset;
  campaignAssets: CreativeAsset[];
  onBack: () => void;
}

function generateInsights(asset: CreativeAsset, all: CreativeAsset[]) {
  const insights: { type: "positive" | "warning" | "negative"; text: string }[] = [];
  const avgRoas = all.reduce((s, a) => s + a.roas, 0) / all.length;
  const avgCpm = all.reduce((s, a) => s + a.cpm, 0) / all.length;
  const avgCtr = all.reduce((s, a) => s + a.ctr, 0) / all.length;
  const avgCpc = all.reduce((s, a) => s + a.cpc, 0) / all.length;
  const avgConvRate = all.reduce((s, a) => s + a.conversionRate, 0) / all.length;
  const bestRoas = Math.max(...all.map(a => a.roas));
  const bestConvRate = Math.max(...all.map(a => a.conversionRate));

  if (asset.roas >= bestRoas) insights.push({ type: "positive", text: `Top performer — highest ROAS in this campaign at ${asset.roas}x` });
  else if (asset.roas >= avgRoas * 1.2) insights.push({ type: "positive", text: `ROAS is ${((asset.roas / avgRoas - 1) * 100).toFixed(0)}% above campaign average (${avgRoas.toFixed(1)}x)` });
  else if (asset.roas < avgRoas * 0.8) insights.push({ type: "negative", text: `ROAS is ${((1 - asset.roas / avgRoas) * 100).toFixed(0)}% below campaign average — consider pausing or iterating` });

  if (asset.cpm < avgCpm * 0.8) insights.push({ type: "positive", text: `CPM ($${asset.cpm.toFixed(2)}) is ${((1 - asset.cpm / avgCpm) * 100).toFixed(0)}% cheaper than average — great reach efficiency` });
  else if (asset.cpm > avgCpm * 1.3) insights.push({ type: "warning", text: `High CPM ($${asset.cpm.toFixed(2)}) — ${((asset.cpm / avgCpm - 1) * 100).toFixed(0)}% above average. Audience may be too narrow` });

  if (asset.ctr > avgCtr * 1.2) insights.push({ type: "positive", text: `Strong engagement — CTR ${asset.ctr}% outperforms campaign average of ${avgCtr.toFixed(1)}%` });
  else if (asset.ctr < avgCtr * 0.7) insights.push({ type: "negative", text: `Low CTR (${asset.ctr}%) — creative may need a stronger hook or CTA` });

  if (asset.conversionRate >= bestConvRate) insights.push({ type: "positive", text: `Best conversion rate in campaign (${asset.conversionRate}%) — landing page alignment is strong` });
  else if (asset.conversionRate < avgConvRate * 0.7) insights.push({ type: "warning", text: `Conv. rate (${asset.conversionRate}%) is below average — check landing page or audience intent` });

  if (asset.cpc > avgCpc * 1.4) insights.push({ type: "warning", text: `CPC ($${asset.cpc.toFixed(2)}) is high — ${((asset.cpc / avgCpc - 1) * 100).toFixed(0)}% above average. Optimize targeting` });

  const profit = asset.purchaseValue - asset.spend;
  if (profit > 0) insights.push({ type: "positive", text: `Estimated profit: $${profit.toLocaleString()} on $${asset.spend.toLocaleString()} spend` });
  else insights.push({ type: "negative", text: `Negative ROI — spending $${asset.spend.toLocaleString()} to generate $${asset.purchaseValue.toLocaleString()}` });

  if (asset.qualityRanking === "below_average") insights.push({ type: "negative", text: "Quality ranking is below average — creative quality needs improvement" });
  if (asset.engagementRateRanking === "below_average") insights.push({ type: "warning", text: "Engagement rate ranking is below average — try a more compelling hook" });
  if (asset.conversionRateRanking === "below_average") insights.push({ type: "warning", text: "Conversion rate ranking is below average — review landing page experience" });

  return insights;
}

function getVerdict(asset: CreativeAsset, all: CreativeAsset[]) {
  const avgRoas = all.reduce((s, a) => s + a.roas, 0) / all.length;
  const bestRoas = Math.max(...all.map(a => a.roas));
  if (asset.roas >= bestRoas) return { label: "Top Performer", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", description: "This creative is delivering the best returns in your campaign. Consider increasing budget allocation." };
  if (asset.roas >= avgRoas * 1.1) return { label: "Strong", color: "text-emerald-600", bg: "bg-emerald-50/60 border-emerald-200/60", description: "Above-average performance. A solid creative worth keeping active." };
  if (asset.roas >= avgRoas * 0.85) return { label: "Average", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", description: "Performing at campaign average. Monitor closely or test variations." };
  return { label: "Underperforming", color: "text-destructive", bg: "bg-red-50 border-red-200", description: "Below average returns. Consider pausing, reallocating budget, or refreshing creative." };
}

const rankingLabel = (r: string) => r === "above_average" ? "Above Average" : r === "average" ? "Average" : "Below Average";
const rankingColor = (r: string) => r === "above_average" ? "text-emerald-600 bg-emerald-50" : r === "average" ? "text-yellow-700 bg-yellow-50" : "text-destructive bg-red-50";

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="p-3 rounded-md border border-border/60 bg-surface">
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
    <p className="text-[15px] font-mono font-bold text-foreground mt-0.5 leading-tight">{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const SectionTitle = ({ children }: { children: string }) => (
  <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mt-7 mb-2.5 flex items-center gap-2">
    <span>{children}</span>
    <div className="flex-1 h-px bg-border/50" />
  </h3>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-border/60 bg-surface p-4">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">{title}</p>
    <div className="h-48">
      {children}
    </div>
  </div>
);

const chartTooltipStyle = {
  contentStyle: {
    background: 'hsl(0 0% 100%)',
    border: '1px solid hsl(228 14% 93%)',
    borderRadius: '8px',
    fontSize: '11px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
};

type DatePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

const AssetDetail = ({ asset, campaignAssets, onBack }: AssetDetailProps) => {
  const [datePreset, setDatePreset] = useState<DatePreset>("7d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const verdict = getVerdict(asset, campaignAssets);
  const insights = generateInsights(asset, campaignAssets);
  const rank = [...campaignAssets].sort((a, b) => b.roas - a.roas).findIndex(a => a.id === asset.id) + 1;
  const isVideo = asset.type === "video";
  const daily = asset.dailyMetrics;

  // Filter daily metrics by date range
  const filteredDaily = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let filtered: DailyMetric[];
    switch (datePreset) {
      case "today":
        filtered = daily.filter(d => d.fullDate === todayStr);
        break;
      case "yesterday":
        filtered = daily.filter(d => d.fullDate === yesterdayStr);
        break;
      case "7d": {
        const start = new Date(now); start.setDate(now.getDate() - 6);
        const startStr = start.toISOString().split('T')[0];
        filtered = daily.filter(d => d.fullDate >= startStr && d.fullDate <= todayStr);
        break;
      }
      case "30d":
        filtered = daily;
        break;
      case "custom":
        if (customRange?.from) {
          const fromStr = customRange.from.toISOString().split('T')[0];
          const toStr = customRange.to ? customRange.to.toISOString().split('T')[0] : fromStr;
          filtered = daily.filter(d => d.fullDate >= fromStr && d.fullDate <= toStr);
        } else {
          filtered = daily;
        }
        break;
      default:
        filtered = daily;
    }

    // Recalculate cumulative ROAS for filtered range
    let cumSpend = 0, cumPV = 0;
    return filtered.map(d => {
      cumSpend += d.spend;
      cumPV += d.purchaseValue;
      return {
        ...d,
        cumulativeRoas: cumSpend > 0 ? Math.round(cumPV / cumSpend * 100) / 100 : 0,
      };
    });
  }, [daily, datePreset, customRange]);

  // Summary stats for selected range
  const rangeSummary = useMemo(() => {
    const totalSpend = filteredDaily.reduce((s, d) => s + d.spend, 0);
    const totalPV = filteredDaily.reduce((s, d) => s + d.purchaseValue, 0);
    const totalConversions = filteredDaily.reduce((s, d) => s + d.conversions, 0);
    return {
      spend: totalSpend,
      revenue: totalPV,
      roas: totalSpend > 0 ? Math.round(totalPV / totalSpend * 100) / 100 : 0,
      conversions: totalConversions,
    };
  }, [filteredDaily]);

  const presetLabel: Record<DatePreset, string> = {
    today: "Today",
    yesterday: "Yesterday",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    custom: customRange?.from
      ? `${customRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${customRange.to ? ` – ${customRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
      : "Custom Range",
  };

  // Funnel data for bar chart
  const funnelData = [
    { step: "LPV", value: asset.landingPageViews, fill: "hsl(227, 71%, 55%)" },
    { step: "ATC", value: asset.addToCart, fill: "hsl(174, 100%, 33%)" },
    { step: "IC", value: asset.initiateCheckout, fill: "hsl(45, 93%, 47%)" },
    { step: "Purchase", value: asset.conversions, fill: "hsl(142, 71%, 45%)" },
  ];

  // Video retention data
  const videoRetentionData = isVideo ? [
    { point: "Start", pct: 100 },
    { point: "25%", pct: Math.round((asset.videoWatched25 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "50%", pct: Math.round((asset.videoWatched50 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "75%", pct: Math.round((asset.videoWatched75 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "95%", pct: Math.round((asset.videoWatched95 || 0) / (asset.videoPlays || 1) * 100) },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to assets
      </button>

      {/* Hero */}
      <div className="flex gap-5 mb-5">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{asset.name}</h2>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{asset.id} · {asset.dimensions} · {asset.type}</p>
              <div className="mt-2"><ChannelIcon channel={asset.channel} size="md" /></div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rank</p>
              <p className="text-2xl font-mono font-bold text-foreground">#{rank}</p>
              <p className="text-[10px] text-muted-foreground">of {campaignAssets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className={`rounded-lg border p-3.5 mb-5 ${verdict.bg}`}>
        <div className="flex items-center gap-2 mb-0.5">
          {verdict.label === "Top Performer" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
           verdict.label === "Underperforming" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
           <BarChart3 className="w-4 h-4 text-muted-foreground" />}
          <span className={`text-sm font-semibold ${verdict.color}`}>{verdict.label}</span>
        </div>
        <p className="text-[12px] text-foreground/75">{verdict.description}</p>
      </div>

      {/* Revenue Summary */}
      <SectionTitle>Revenue Summary</SectionTitle>
      <div className="grid grid-cols-4 gap-2.5">
        <Stat label="Total Spend" value={`$${asset.spend.toLocaleString()}`} sub="Input budget" />
        <Stat label="Purchase Value" value={`$${asset.purchaseValue.toLocaleString()}`} sub={`${asset.roas}x return`} />
        <Stat label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.conversionRate}% conv. rate`} />
        <Stat label="Cost / Result" value={`$${asset.costPerResult.toFixed(2)}`} sub="Per conversion" />
      </div>

      {/* ROAS Section with Date Filter */}
      <div className="flex items-center justify-between mt-7 mb-3">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold flex items-center gap-2">
          <span>ROAS — Purchase Value ÷ Ad Spend</span>
          <div className="flex-1 h-px bg-border/50" />
        </h3>
        <div className="flex items-center gap-1.5">
          {(["today", "yesterday", "7d", "30d"] as DatePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                datePreset === preset
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-muted-foreground border-border/60 hover:bg-muted"
              }`}
            >
              {preset === "today" ? "Today" : preset === "yesterday" ? "Yesterday" : preset === "7d" ? "7D" : "30D"}
            </button>
          ))}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setDatePreset("custom")}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors flex items-center gap-1 ${
                  datePreset === "custom"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface text-muted-foreground border-border/60 hover:bg-muted"
                }`}
              >
                <CalendarDays className="w-3 h-3" />
                Custom
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={(range) => {
                  setCustomRange(range);
                  setDatePreset("custom");
                  if (range?.to) setCalendarOpen(false);
                }}
                numberOfMonths={1}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ROAS Chart */}
      <div className="rounded-lg border border-border/60 bg-surface p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">ROAS</p>
        <p className="text-[9px] text-muted-foreground mb-3">Purchase conversion value ÷ ad spend per day</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredDaily} barSize={filteredDaily.length > 14 ? 6 : 12}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" tickFormatter={(v) => `${v}x`} />
              <Tooltip
                {...chartTooltipStyle}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  return (
                    <div style={chartTooltipStyle.contentStyle} className="p-2.5">
                      <p className="text-[11px] font-semibold text-foreground mb-1.5">{label}</p>
                      <p className="text-[11px]" style={{ color: "hsl(174, 100%, 33%)" }}>ROAS: {data.roas}x</p>
                      <p className="text-[11px]" style={{ color: "hsl(227, 71%, 55%)" }}>Spend: ${data.spend.toLocaleString()}</p>
                      <p className="text-[11px]" style={{ color: "hsl(142, 71%, 45%)" }}>Revenue: ${data.purchaseValue.toLocaleString()}</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={rangeSummary.roas} stroke="hsl(346, 84%, 61%)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Avg ${rangeSummary.roas}x`, position: "right", fontSize: 9, fill: "hsl(346, 84%, 61%)" }} />
              <Bar dataKey="roas" name="roas" fill="hsl(174, 100%, 33%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CTR & CPM trends */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <ChartCard title="CTR % Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" tickFormatter={(v) => `${v}%`} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
              <Line type="monotone" dataKey="ctr" name="CTR" stroke="hsl(227, 71%, 55%)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="CPM Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" tickFormatter={(v) => `$${v}`} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="cpm" name="CPM" stroke="hsl(346, 84%, 61%)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Conversion Funnel */}
      <SectionTitle>Conversion Funnel</SectionTitle>

      {/* Funnel Over Time Chart with integrated legend */}
      <div className="rounded-lg border border-border/60 bg-surface p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Funnel Over Time</p>
        <div className="flex gap-4">
          <div className="flex-1 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredDaily}>
                <defs>
                  <linearGradient id="lpvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="atcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 100%, 33%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(174, 100%, 33%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="icGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="landingPageViews" name="LPV" stroke="hsl(227, 71%, 55%)" fill="url(#lpvGrad)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="addToCart" name="ATC" stroke="hsl(174, 100%, 33%)" fill="url(#atcGrad)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="initiateCheckout" name="Checkout" stroke="hsl(45, 93%, 47%)" fill="url(#icGrad)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="conversions" name="Purchase" stroke="hsl(142, 71%, 45%)" fill="url(#purchGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend with totals and percentages */}
          <div className="w-36 flex flex-col justify-center gap-3.5 flex-shrink-0 border-l border-border/40 pl-4">
            {[
              { name: "LPV", full: "Landing Page Views", value: asset.landingPageViews, color: "hsl(227, 71%, 55%)" },
              { name: "ATC", full: "Add to Cart", value: asset.addToCart, color: "hsl(174, 100%, 33%)" },
              { name: "Checkout", full: "Initiate Checkout", value: asset.initiateCheckout, color: "hsl(45, 93%, 47%)" },
              { name: "Purchase", full: "Purchases", value: asset.conversions, color: "hsl(142, 71%, 45%)" },
            ].map((item) => {
              const pct = (item.value / asset.landingPageViews * 100).toFixed(1);
              return (
                <div key={item.name} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: item.color }} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">{item.full}</p>
                    <p className="text-[13px] font-mono font-bold text-foreground leading-tight">{item.value.toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground">{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Overall funnel efficiency */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Overall Funnel Efficiency</span>
            <span className="text-[11px] font-mono font-bold text-foreground">
              {(asset.conversions / asset.landingPageViews * 100).toFixed(1)}% LPV → Purchase
            </span>
          </div>
        </div>
      </div>

      {/* Delivery & Traffic — tells the story: how many people saw it → clicked → landed */}
      <SectionTitle>Delivery & Traffic</SectionTitle>
      <div className="rounded-lg border border-border/60 bg-surface p-4">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Impressions</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Reach</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.reach.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Freq: {asset.frequency.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CPM</p>
            <p className="text-lg font-mono font-bold text-foreground">${asset.cpm.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Link Clicks</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.linkClicks.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">CTR: {asset.ctr}%</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CPC</p>
            <p className="text-lg font-mono font-bold text-foreground">${asset.cpc.toFixed(2)}</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4 mt-3 pt-3 border-t border-border/30">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">All Clicks</p>
            <p className="text-[13px] font-mono font-semibold text-foreground">{asset.clicks.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">CTR: {asset.ctrAll}%</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Outbound Clicks</p>
            <p className="text-[13px] font-mono font-semibold text-foreground">{asset.outboundClicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Landing Page Views</p>
            <p className="text-[13px] font-mono font-semibold text-foreground">{asset.landingPageViews.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CPC (All)</p>
            <p className="text-[13px] font-mono font-semibold text-foreground">${asset.cpcAll.toFixed(2)}</p>
          </div>
          <div />
        </div>
      </div>

      {/* Engagement — social proof signals */}
      <SectionTitle>Engagement</SectionTitle>
      <div className="rounded-lg border border-border/60 bg-surface p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Reactions</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.postReactions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Comments</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.postComments.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Shares</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.postShares.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Saves</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.postSaves.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Total Engagement</span>
          <span className="text-[13px] font-mono font-bold text-foreground">{(asset.postReactions + asset.postComments + asset.postShares + asset.postSaves).toLocaleString()}</span>
        </div>
      </div>

      {/* Video Metrics with Retention Chart */}
      {isVideo && (
        <>
          <SectionTitle>Video Performance</SectionTitle>
          <div className="grid grid-cols-4 gap-2.5">
            <Stat label="Video Plays" value={(asset.videoPlays || 0).toLocaleString()} />
            <Stat label="ThruPlays" value={(asset.thruPlays || 0).toLocaleString()} sub="15s+ or complete" />
            <Stat label="Avg. Watch Time" value={`${asset.avgWatchTime || 0}s`} />
            <Stat label="ThruPlay Rate" value={`${((asset.thruPlays || 0) / (asset.videoPlays || 1) * 100).toFixed(1)}%`} />
          </div>
          <div className="mt-3">
            <ChartCard title="Video Retention Curve">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={videoRetentionData}>
                  <defs>
                    <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" />
                  <XAxis dataKey="point" tick={{ fontSize: 10 }} stroke="hsl(228 10% 52%)" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                  <Area type="monotone" dataKey="pct" name="Retention" stroke="hsl(227, 71%, 55%)" fill="url(#retentionGradient)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* Ad Quality / Relevance */}
      <SectionTitle>Ad Relevance Diagnostics</SectionTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {([
          ["Quality Ranking", asset.qualityRanking],
          ["Engagement Rate Ranking", asset.engagementRateRanking],
          ["Conversion Rate Ranking", asset.conversionRateRanking],
        ] as const).map(([label, val]) => (
          <div key={label} className="p-3 rounded-md border border-border/60 bg-surface">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${rankingColor(val)}`}>
              {rankingLabel(val)}
            </span>
          </div>
        ))}
      </div>

      {/* Insights */}
      <SectionTitle>Insights & Recommendations</SectionTitle>
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
  );
};

export default AssetDetail;
