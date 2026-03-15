import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart3, CalendarDays } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
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

function getVerdict(asset: CreativeAsset, all: CreativeAsset[]) {
  const avgRoas = all.reduce((s, a) => s + a.roas, 0) / all.length;
  const bestRoas = Math.max(...all.map(a => a.roas));
  if (asset.roas >= bestRoas) return { label: "Top Performer", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", desc: "Best ROAS in campaign. Consider scaling budget." };
  if (asset.roas >= avgRoas * 1.1) return { label: "Strong", color: "text-emerald-600", bg: "bg-emerald-50/60 border-emerald-200/60", desc: "Above-average performance. Keep active." };
  if (asset.roas >= avgRoas * 0.85) return { label: "Average", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", desc: "At campaign average. Monitor or test variations." };
  return { label: "Underperforming", color: "text-destructive", bg: "bg-red-50 border-red-200", desc: "Below average. Consider pausing or refreshing." };
}

// ─── Utility Components ───
const rankingLabel = (r: string) => r === "above_average" ? "Above Avg" : r === "average" ? "Average" : "Below Avg";
const rankingColor = (r: string) => r === "above_average" ? "text-emerald-600 bg-emerald-50" : r === "average" ? "text-yellow-700 bg-yellow-50" : "text-destructive bg-red-50";

const healthDot = (status: "good" | "warning" | "critical") =>
  status === "good" ? "bg-emerald-500" : status === "warning" ? "bg-yellow-500" : "bg-destructive";

const healthColor = (status: "good" | "warning" | "critical") =>
  status === "good" ? "text-emerald-600" : status === "warning" ? "text-yellow-600" : "text-destructive";

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

const KpiCard = ({ label, value, trend, trendInverse = false, health, sub }: {
  label: string; value: string; trend?: number; trendInverse?: boolean; health?: "good" | "warning" | "critical"; sub?: string;
}) => (
  <div className="p-3 rounded-lg border border-border/60 bg-card flex-1 min-w-0">
    <div className="flex items-center justify-between mb-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      {health && <div className={`w-1.5 h-1.5 rounded-full ${healthDot(health)}`} />}
    </div>
    <p className="text-base font-mono font-bold text-foreground leading-tight">{value}</p>
    <div className="flex items-center gap-2 mt-0.5">
      {trend !== undefined && <TrendArrow value={trend} suffix="%" inverse={trendInverse} />}
      {sub && <span className="text-[9px] text-muted-foreground">{sub}</span>}
    </div>
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mt-8 mb-4">
    <div className="flex items-center gap-3 mb-1">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground/80 font-semibold whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-px bg-border/40" />
    </div>
    <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
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

  const verdict = getVerdict(asset, campaignAssets);
  const insights = generateInsights(asset, campaignAssets);
  const rank = [...campaignAssets].sort((a, b) => b.roas - a.roas).findIndex(a => a.id === asset.id) + 1;
  const isVideo = asset.type === "video";
  const daily = asset.dailyMetrics;

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
    return filtered.map(d => { cumSpend += d.spend; cumPV += d.purchaseValue; return { ...d, cumulativeRoas: cumSpend > 0 ? Math.round(cumPV / cumSpend * 100) / 100 : 0 }; });
  }, [daily, datePreset, customRange]);

  // Trend calculations
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

  // Health indicators
  const cpmAvg = campaignAssets.reduce((s, a) => s + a.cpm, 0) / campaignAssets.length;
  const ctrAvg = campaignAssets.reduce((s, a) => s + a.ctr, 0) / campaignAssets.length;
  const freqHealth: "good" | "warning" | "critical" = asset.frequency > 4 ? "critical" : asset.frequency > 2.5 ? "warning" : "good";
  const cpmHealth: "good" | "warning" | "critical" = asset.cpm < cpmAvg * 0.9 ? "good" : asset.cpm > cpmAvg * 1.2 ? "critical" : "warning";
  const ctrHealth: "good" | "warning" | "critical" = asset.ctr > ctrAvg * 1.1 ? "good" : asset.ctr < ctrAvg * 0.8 ? "critical" : "warning";
  const roasHealth: "good" | "warning" | "critical" = asset.roas > 2 ? "good" : asset.roas > 1 ? "warning" : "critical";

  // Engagement data
  const engagementData = [
    { name: "Reactions", value: asset.postReactions, color: "hsl(227, 71%, 55%)" },
    { name: "Comments", value: asset.postComments, color: "hsl(174, 100%, 33%)" },
    { name: "Shares", value: asset.postShares, color: "hsl(45, 93%, 47%)" },
    { name: "Saves", value: asset.postSaves, color: "hsl(346, 84%, 61%)" },
  ];
  const engagementTotal = engagementData.reduce((s, d) => s + d.value, 0);

  // Video retention
  const videoRetentionData = isVideo ? [
    { point: "Start", pct: 100 },
    { point: "25%", pct: Math.round((asset.videoWatched25 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "50%", pct: Math.round((asset.videoWatched50 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "75%", pct: Math.round((asset.videoWatched75 || 0) / (asset.videoPlays || 1) * 100) },
    { point: "95%", pct: Math.round((asset.videoWatched95 || 0) / (asset.videoPlays || 1) * 100) },
  ] : [];

  // Funnel steps
  const funnelSteps = [
    { label: "Landing Page Views", value: asset.landingPageViews, color: "hsl(227, 71%, 55%)" },
    { label: "Add to Cart", value: asset.addToCart, color: "hsl(174, 100%, 33%)" },
    { label: "Checkout", value: asset.initiateCheckout, color: "hsl(45, 93%, 47%)" },
    { label: "Purchase", value: asset.conversions, color: "hsl(142, 71%, 45%)" },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to assets
      </button>

      {/* ─── HERO + VERDICT (side by side for wide screens) ─── */}
      <div className="flex gap-4 mb-5">
        <div className="flex gap-4 flex-1 min-w-0">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{asset.name}</h2>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{asset.id} · {asset.dimensions} · {asset.type}</p>
                <div className="mt-1.5"><ChannelIcon channel={asset.channel} size="md" /></div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold text-foreground">#{rank}</p>
                <p className="text-[10px] text-muted-foreground">of {campaignAssets.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={`rounded-lg border p-3 w-72 flex-shrink-0 ${verdict.bg}`}>
          <div className="flex items-center gap-2 mb-0.5">
            {verdict.label === "Top Performer" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
             verdict.label === "Underperforming" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
             <BarChart3 className="w-4 h-4 text-muted-foreground" />}
            <span className={`text-sm font-semibold ${verdict.color}`}>{verdict.label}</span>
          </div>
          <p className="text-[12px] text-foreground/75">{verdict.desc}</p>
        </div>
      </div>

      {/* ─── DATE FILTER (global for all charts) ─── */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/40">
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

      {/* ─── KPI OVERVIEW (5 key metrics — one per funnel stage) ─── */}
      <div className="grid grid-cols-5 gap-2.5 mb-2">
        <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} trend={trends.impressions} />
        <KpiCard label="CTR" value={`${asset.ctr}%`} trend={trends.ctr} health={ctrHealth} />
        <KpiCard label="Link Clicks" value={asset.linkClicks.toLocaleString()} trend={trends.clicks} />
        <KpiCard label="Conversions" value={asset.conversions.toLocaleString()} sub={`${asset.conversionRate}% rate`} />
        <KpiCard label="ROAS" value={`${asset.roas}x`} trend={trends.roas} health={roasHealth} />
      </div>

      {/* ═══════════════════════════════════════════════════
          A. DELIVERY — How the ad is being shown
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Delivery" description="How efficiently the ad reaches your audience. Watch frequency for fatigue and CPM for cost efficiency." />

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Delivery stats */}
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Reach</p>
                <p className="text-lg font-mono font-bold text-foreground">{asset.reach.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Unique users</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Frequency</p>
                  {freqHealth !== "good" && <div className={`w-1.5 h-1.5 rounded-full ${healthDot(freqHealth)}`} />}
                </div>
                <p className={`text-lg font-mono font-bold ${healthColor(freqHealth)}`}>{asset.frequency.toFixed(2)}</p>
                <p className="text-[9px] text-muted-foreground">{freqHealth === "critical" ? "⚠ Ad fatigue risk" : freqHealth === "warning" ? "Monitor closely" : "Healthy range"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CPM</p>
                  <div className={`w-1.5 h-1.5 rounded-full ${healthDot(cpmHealth)}`} />
                </div>
                <p className="text-lg font-mono font-bold text-foreground">${asset.cpm.toFixed(2)}</p>
                <TrendArrow value={trends.cpm} suffix="%" inverse />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Spend</p>
                <p className="text-lg font-mono font-bold text-foreground">${asset.spend.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Total budget used</p>
              </div>
            </div>
          </div>
        </div>

        {/* CPM trend chart */}
        <ChartCard title="CPM Over Time" height="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
              <Tooltip {...chartTooltipStyle} formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="cpm" name="CPM" stroke="hsl(346, 84%, 61%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ═══════════════════════════════════════════════════
          B. ENGAGEMENT — On-platform response
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Engagement" description="On-platform signals showing how users respond to the creative before clicking through." />

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
                  <Tooltip {...chartTooltipStyle} formatter={(value: number, name: string) => [`${value.toLocaleString()} (${(value / engagementTotal * 100).toFixed(1)}%)`, name]} />
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

        {/* Platform quality signals */}
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4">Platform Quality Signals</p>
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

      {/* ═══════════════════════════════════════════════════
          C. TRAFFIC — Clicks & site visits
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Traffic" description="Users clicking through to your site. CTR trends reveal creative effectiveness over time." />

      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2 grid grid-cols-1 gap-2.5">
          <KpiCard label="CPC (Link)" value={`$${asset.cpc.toFixed(2)}`} sub="Cost per link click" />
          <KpiCard label="CPC (All)" value={`$${asset.cpcAll.toFixed(2)}`} sub="All click types" />
          <KpiCard label="Outbound Clicks" value={asset.outboundClicks.toLocaleString()} sub="Off-platform" />
        </div>
        <div className="col-span-3">
          <ChartCard title="CTR % Over Time" height="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredDaily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
                <Tooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                <Line type="monotone" dataKey="ctr" name="CTR" stroke="hsl(227, 71%, 55%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          D. CONVERSIONS & REVENUE
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Conversions & Revenue" description="The bottom line — from landing page through purchase, and your return on ad spend." />

      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <KpiCard label="Spend" value={`$${rangeSummary.spend.toLocaleString()}`} sub="Selected period" />
        <KpiCard label="Revenue" value={`$${rangeSummary.revenue.toLocaleString()}`} sub="Selected period" />
        <KpiCard label="ROAS" value={`${rangeSummary.roas}x`} health={roasHealth} sub="Revenue ÷ Spend" />
        <KpiCard label="CPA" value={`$${asset.costPerResult.toFixed(2)}`} sub="Cost per purchase" />
      </div>

      {/* ROAS over time */}
      <div className="mb-3">
        <ChartCard title="ROAS Over Time" height="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredDaily} barSize={filteredDaily.length > 14 ? 6 : 12}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}x`} />
              <Tooltip {...chartTooltipStyle}
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

      {/* Conversion Funnel */}
      <div className="rounded-lg border border-border/60 bg-card p-5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4">Conversion Funnel</p>
        <div className="flex gap-6">
          {/* Funnel area chart */}
          <div className="flex-1 min-w-0 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredDaily}>
                <defs>
                  {funnelSteps.map((step, i) => (
                    <linearGradient key={i} id={`funnel${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={step.color} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={step.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="landingPageViews" name="LPV" stroke={funnelSteps[0].color} fill="url(#funnel0)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="addToCart" name="Add to Cart" stroke={funnelSteps[1].color} fill="url(#funnel1)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="initiateCheckout" name="Checkout" stroke={funnelSteps[2].color} fill="url(#funnel2)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="conversions" name="Purchase" stroke={funnelSteps[3].color} fill="url(#funnel3)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Funnel legend with drop-off */}
          <div className="w-40 flex flex-col justify-center gap-1 flex-shrink-0">
            {funnelSteps.map((step, i, arr) => {
              const dropOff = i > 0 ? (100 - (step.value / arr[i - 1].value * 100)).toFixed(1) : null;
              return (
                <div key={step.label} className="py-2 px-3 rounded-md hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-3 h-[3px] rounded-full flex-shrink-0" style={{ background: step.color }} />
                    <p className="text-[10px] text-muted-foreground font-medium">{step.label}</p>
                  </div>
                  <p className="text-sm font-mono font-bold text-foreground pl-5">{step.value.toLocaleString()}</p>
                  {dropOff && <p className="text-[9px] pl-5 font-mono text-destructive/70">↓ {dropOff}% drop-off</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          E. VIDEO PERFORMANCE (conditional)
          ═══════════════════════════════════════════════════ */}
      {isVideo && (
        <>
          <SectionHeader title="Video Performance" description="Retention analysis — where viewers drop off reveals content quality." />
          <div className="grid grid-cols-4 gap-2.5 mb-3">
            <KpiCard label="Plays" value={(asset.videoPlays || 0).toLocaleString()} />
            <KpiCard label="ThruPlays" value={(asset.thruPlays || 0).toLocaleString()} />
            <KpiCard label="Avg Watch" value={`${asset.avgWatchTime || 0}s`} />
            <KpiCard label="ThruPlay Rate" value={`${((asset.thruPlays || 0) / (asset.videoPlays || 1) * 100).toFixed(1)}%`} />
          </div>
          <ChartCard title="Retention Curve">
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
                <Tooltip {...chartTooltipStyle} formatter={(value: number) => `${value}%`} />
                <Area type="monotone" dataKey="pct" name="Retention" stroke="hsl(227, 71%, 55%)" fill="url(#retentionGrad)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          F. INSIGHTS & RECOMMENDATIONS
          ═══════════════════════════════════════════════════ */}
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
  );
};

export default AssetDetail;
