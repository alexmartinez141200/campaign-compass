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

  if (asset.qualityRanking === "below_average") insights.push({ type: "negative", text: "Quality ranking below average" });
  if (asset.engagementRateRanking === "below_average") insights.push({ type: "warning", text: "Engagement ranking below average" });
  if (asset.conversionRateRanking === "below_average") insights.push({ type: "warning", text: "Conversion ranking below average" });

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

const KpiCard = ({ label, value, trend, trendInverse = false, health }: {
  label: string; value: string; trend?: number; trendInverse?: boolean; health?: "good" | "warning" | "critical";
}) => (
  <div className="p-3 rounded-lg border border-border/60 bg-surface flex-1 min-w-0">
    <div className="flex items-center justify-between mb-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      {health && <div className={`w-1.5 h-1.5 rounded-full ${health === "good" ? "bg-emerald-500" : health === "warning" ? "bg-yellow-500" : "bg-destructive"}`} />}
    </div>
    <p className="text-[17px] font-mono font-bold text-foreground leading-tight">{value}</p>
    {trend !== undefined && <TrendArrow value={trend} suffix="%" inverse={trendInverse} />}
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mt-7 mb-3">
    <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold flex items-center gap-2 mb-1">
      <span>{title}</span>
      <div className="flex-1 h-px bg-border/50" />
    </h3>
    <p className="text-[11px] text-muted-foreground">{description}</p>
  </div>
);

const ChartCard = ({ title, desc, children, height = "h-40" }: { title: string; desc?: string; children: React.ReactNode; height?: string }) => (
  <div className="rounded-lg border border-border/60 bg-surface p-4">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{title}</p>
    {desc && <p className="text-[9px] text-muted-foreground mb-3">{desc}</p>}
    {!desc && <div className="mb-3" />}
    <div className={height}>{children}</div>
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
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let filtered: DailyMetric[];
    switch (datePreset) {
      case "today": filtered = daily.filter(d => d.fullDate === todayStr); break;
      case "yesterday": filtered = daily.filter(d => d.fullDate === yesterdayStr); break;
      case "7d": { const s = new Date(now); s.setDate(now.getDate() - 6); filtered = daily.filter(d => d.fullDate >= s.toISOString().split('T')[0] && d.fullDate <= todayStr); break; }
      case "30d": filtered = daily; break;
      case "custom":
        if (customRange?.from) { const f = customRange.from.toISOString().split('T')[0]; const t = customRange.to ? customRange.to.toISOString().split('T')[0] : f; filtered = daily.filter(d => d.fullDate >= f && d.fullDate <= t); }
        else filtered = daily; break;
      default: filtered = daily;
    }
    let cumSpend = 0, cumPV = 0;
    return filtered.map(d => { cumSpend += d.spend; cumPV += d.purchaseValue; return { ...d, cumulativeRoas: cumSpend > 0 ? Math.round(cumPV / cumSpend * 100) / 100 : 0 }; });
  }, [daily, datePreset, customRange]);

  // Trend calculations (compare first half vs second half of range)
  const trends = useMemo(() => {
    if (filteredDaily.length < 4) return { impressions: 0, cpm: 0, ctr: 0, cpc: 0, roas: 0, linkClicks: 0 };
    const mid = Math.floor(filteredDaily.length / 2);
    const first = filteredDaily.slice(0, mid);
    const second = filteredDaily.slice(mid);
    const avgOf = (arr: typeof filteredDaily, key: keyof DailyMetric) => arr.reduce((s, d) => s + (d[key] as number), 0) / arr.length;
    const pctChange = (a: number, b: number) => b === 0 ? 0 : ((a - b) / b) * 100;
    return {
      impressions: pctChange(avgOf(second, 'impressions'), avgOf(first, 'impressions')),
      cpm: pctChange(avgOf(second, 'cpm'), avgOf(first, 'cpm')),
      ctr: pctChange(avgOf(second, 'ctr'), avgOf(first, 'ctr')),
      cpc: pctChange(avgOf(second, 'cpc'), avgOf(first, 'cpc')),
      roas: pctChange(avgOf(second, 'roas'), avgOf(first, 'roas')),
      linkClicks: pctChange(avgOf(second, 'linkClicks'), avgOf(first, 'linkClicks')),
    };
  }, [filteredDaily]);

  const rangeSummary = useMemo(() => {
    const s = filteredDaily.reduce((a, d) => a + d.spend, 0);
    const r = filteredDaily.reduce((a, d) => a + d.purchaseValue, 0);
    return { spend: s, revenue: r, roas: s > 0 ? Math.round(r / s * 100) / 100 : 0, conversions: filteredDaily.reduce((a, d) => a + d.conversions, 0) };
  }, [filteredDaily]);

  // Health indicators
  const freqHealth: "good" | "warning" | "critical" = asset.frequency > 4 ? "critical" : asset.frequency > 2.5 ? "warning" : "good";
  const cpmAvg = campaignAssets.reduce((s, a) => s + a.cpm, 0) / campaignAssets.length;
  const cpmHealth: "good" | "warning" | "critical" = asset.cpm < cpmAvg * 0.9 ? "good" : asset.cpm > cpmAvg * 1.2 ? "critical" : "warning";
  const ctrAvg = campaignAssets.reduce((s, a) => s + a.ctr, 0) / campaignAssets.length;
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

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to assets
      </button>

      {/* ─── HERO ─── */}
      <div className="flex gap-5 mb-4">
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

      {/* Verdict */}
      <div className={`rounded-lg border p-3 mb-4 ${verdict.bg}`}>
        <div className="flex items-center gap-2 mb-0.5">
          {verdict.label === "Top Performer" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
           verdict.label === "Underperforming" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
           <BarChart3 className="w-4 h-4 text-muted-foreground" />}
          <span className={`text-sm font-semibold ${verdict.color}`}>{verdict.label}</span>
        </div>
        <p className="text-[12px] text-foreground/75">{verdict.desc}</p>
      </div>

      {/* ─── DATE FILTER ─── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-muted-foreground">Trends compare first vs second half of selected period</p>
        <div className="flex items-center gap-1.5">
          {(["today", "yesterday", "7d", "30d"] as DatePreset[]).map((preset) => (
            <button key={preset} onClick={() => setDatePreset(preset)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                datePreset === preset ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border/60 hover:bg-muted"
              }`}
            >{preset === "today" ? "Today" : preset === "yesterday" ? "Yesterday" : preset === "7d" ? "7D" : "30D"}</button>
          ))}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button onClick={() => setDatePreset("custom")}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md border transition-colors flex items-center gap-1 ${
                  datePreset === "custom" ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border/60 hover:bg-muted"
                }`}
              ><CalendarDays className="w-3 h-3" />Custom</button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" selected={customRange}
                onSelect={(range) => { setCustomRange(range); setDatePreset("custom"); if (range?.to) setCalendarOpen(false); }}
                numberOfMonths={1} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ─── KPI SUMMARY BAR ─── */}
      <div className="flex gap-2.5 mb-2">
        <KpiCard label="Impressions" value={asset.impressions.toLocaleString()} trend={trends.impressions} />
        <KpiCard label="Reach" value={asset.reach.toLocaleString()} />
        <KpiCard label="Link Clicks" value={asset.linkClicks.toLocaleString()} trend={trends.linkClicks} />
        <KpiCard label="CPC" value={`$${asset.cpc.toFixed(2)}`} trend={trends.cpc} trendInverse />
        <KpiCard label="ROAS" value={`${asset.roas}x`} trend={trends.roas} health={roasHealth} />
      </div>

      {/* ═══════════════════════════════════════════════════
          A. TOP OF FUNNEL — AWARENESS & ENGAGEMENT
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Awareness & Engagement" description="How visible and engaging is the ad on-platform? These metrics show delivery efficiency and audience response." />

      {/* Delivery metrics */}
      <div className="rounded-lg border border-border/60 bg-surface p-4 mb-3">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Impressions</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.impressions.toLocaleString()}</p>
            <TrendArrow value={trends.impressions} suffix="%" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Reach</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.reach.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Unique users</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Frequency</p>
              {freqHealth !== "good" && <div className={`w-1.5 h-1.5 rounded-full ${freqHealth === "warning" ? "bg-yellow-500" : "bg-destructive"}`} />}
            </div>
            <p className={`text-lg font-mono font-bold ${healthColor(freqHealth)}`}>{asset.frequency.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground">{freqHealth === "critical" ? "⚠ Ad fatigue risk" : freqHealth === "warning" ? "Monitor closely" : "Healthy range"}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CPM</p>
              <div className={`w-1.5 h-1.5 rounded-full ${cpmHealth === "good" ? "bg-emerald-500" : cpmHealth === "warning" ? "bg-yellow-500" : "bg-destructive"}`} />
            </div>
            <p className="text-lg font-mono font-bold text-foreground">${asset.cpm.toFixed(2)}</p>
            <TrendArrow value={trends.cpm} suffix="%" inverse />
          </div>
        </div>
      </div>

      {/* CPM trend */}
      <div className="mb-3">
        <ChartCard title="CPM Over Time" desc="Cost per 1K impressions — lower is more efficient delivery. Rising CPM may signal audience saturation.">
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

      {/* Engagement donut */}
      <div className="rounded-lg border border-border/60 bg-surface p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">On-Platform Engagement</p>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={engagementData} cx="50%" cy="50%" innerRadius={28} outerRadius={55} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {engagementData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(value: number, name: string) => [`${value.toLocaleString()} (${(value / engagementTotal * 100).toFixed(1)}%)`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2.5">
            {engagementData.map((item) => (
              <div key={item.name} className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: item.color }} />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">{item.name}</p>
                  <p className="text-[14px] font-mono font-bold text-foreground leading-tight">{item.value.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{(item.value / engagementTotal * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Total Engagement</span>
          <span className="text-[13px] font-mono font-bold text-foreground">{engagementTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          B. MIDDLE OF FUNNEL — TRAFFIC & ACTION
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Traffic & Action" description="Are users taking action? These metrics show who clicked through to your landing page and at what cost." />

      <div className="rounded-lg border border-border/60 bg-surface p-4 mb-3">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Link Clicks</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.linkClicks.toLocaleString()}</p>
            <TrendArrow value={trends.linkClicks} suffix="%" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CTR</p>
              <div className={`w-1.5 h-1.5 rounded-full ${ctrHealth === "good" ? "bg-emerald-500" : ctrHealth === "warning" ? "bg-yellow-500" : "bg-destructive"}`} />
            </div>
            <p className="text-lg font-mono font-bold text-foreground">{asset.ctr}%</p>
            <TrendArrow value={trends.ctr} suffix="%" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CPC</p>
            <p className="text-lg font-mono font-bold text-foreground">${asset.cpc.toFixed(2)}</p>
            <TrendArrow value={trends.cpc} suffix="%" inverse />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">All Clicks</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.clicks.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">CTR: {asset.ctrAll}%</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Outbound</p>
            <p className="text-lg font-mono font-bold text-foreground">{asset.outboundClicks.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Off-platform</p>
          </div>
        </div>
      </div>

      {/* CTR trend */}
      <ChartCard title="CTR % Over Time" desc="Higher CTR = more compelling creative. Declining trend may signal ad fatigue or audience saturation.">
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

      {/* ═══════════════════════════════════════════════════
          C. BOTTOM OF FUNNEL — CONVERSIONS & REVENUE
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Conversions & Revenue" description="The bottom line — actual business results from landing page visit through to purchase, and your return on ad spend." />

      {/* Revenue KPIs */}
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        <KpiCard label="Spend" value={`$${asset.spend.toLocaleString()}`} />
        <KpiCard label="Revenue" value={`$${asset.purchaseValue.toLocaleString()}`} />
        <KpiCard label="ROAS" value={`${asset.roas}x`} trend={trends.roas} health={roasHealth} />
        <KpiCard label="CPA" value={`$${asset.costPerResult.toFixed(2)}`} health={asset.costPerResult > asset.purchaseValue / Math.max(asset.conversions, 1) * 1.5 ? "warning" : "good"} />
      </div>

      {/* ROAS Chart */}
      <div className="mb-3">
        <ChartCard title="ROAS Over Time" desc="Revenue ÷ Spend per day. Days above the average line are profitable." height="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredDaily} barSize={filteredDaily.length > 14 ? 6 : 12}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" tickFormatter={(v) => `${v}x`} />
              <Tooltip {...chartTooltipStyle}
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
        </ChartCard>
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-lg border border-border/60 bg-surface p-5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Conversion Funnel</p>
        <p className="text-[9px] text-muted-foreground mb-4">LPV → Add to Cart → Checkout → Purchase. Drop-off % shows where users leave.</p>
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredDaily}>
                  <defs>
                    <linearGradient id="lpvGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0.12} /><stop offset="95%" stopColor="hsl(227, 71%, 55%)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="atcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(174, 100%, 33%)" stopOpacity={0.12} /><stop offset="95%" stopColor="hsl(174, 100%, 33%)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="icGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.12} /><stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.12} /><stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(228 10% 52%)" />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="landingPageViews" name="LPV" stroke="hsl(227, 71%, 55%)" fill="url(#lpvGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="addToCart" name="ATC" stroke="hsl(174, 100%, 33%)" fill="url(#atcGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="initiateCheckout" name="Checkout" stroke="hsl(45, 93%, 47%)" fill="url(#icGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="conversions" name="Purchase" stroke="hsl(142, 71%, 45%)" fill="url(#purchGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Funnel Legend */}
          <div className="w-44 flex flex-col justify-center gap-1 flex-shrink-0">
            {[
              { full: "Landing Page Views", value: asset.landingPageViews, color: "hsl(227, 71%, 55%)" },
              { full: "Add to Cart", value: asset.addToCart, color: "hsl(174, 100%, 33%)" },
              { full: "Initiate Checkout", value: asset.initiateCheckout, color: "hsl(45, 93%, 47%)" },
              { full: "Purchases", value: asset.conversions, color: "hsl(142, 71%, 45%)" },
            ].map((item, i, arr) => {
              const pct = (item.value / asset.landingPageViews * 100).toFixed(1);
              const stepRate = i > 0 ? (item.value / arr[i - 1].value * 100).toFixed(1) : null;
              const dropOff = i > 0 ? (100 - (item.value / arr[i - 1].value * 100)).toFixed(1) : null;
              return (
                <div key={item.full} className="py-2 px-3 rounded-md hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-3 h-[3px] rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">{item.full}</p>
                  </div>
                  <div className="flex items-baseline gap-2 pl-5">
                    <p className="text-[14px] font-mono font-bold text-foreground leading-tight">{item.value.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{pct}%</p>
                  </div>
                  {dropOff && (
                    <p className="text-[9px] pl-5 mt-0.5 font-mono text-destructive/60">↓ {dropOff}% drop-off</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-3 gap-4">
          <div className="flex items-center justify-between col-span-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Conv. Rate</span>
            <span className="text-[12px] font-mono font-bold text-foreground">{asset.conversionRate}%</span>
          </div>
          <div className="flex items-center justify-between col-span-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">CPA</span>
            <span className="text-[12px] font-mono font-bold text-foreground">${asset.costPerResult.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between col-span-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">LPV → Purchase</span>
            <span className="text-[12px] font-mono font-bold text-foreground">{(asset.conversions / asset.landingPageViews * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          D. CREATIVE QUALITY (Platform Signals)
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Creative Quality Signals" description="How the ad platform ranks this creative against competitors for the same audience." />
      <div className="grid grid-cols-3 gap-2.5">
        {([
          ["Quality", asset.qualityRanking],
          ["Engagement Rate", asset.engagementRateRanking],
          ["Conversion Rate", asset.conversionRateRanking],
        ] as const).map(([label, val]) => (
          <div key={label} className="p-3 rounded-lg border border-border/60 bg-surface text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">{label}</p>
            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${rankingColor(val)}`}>
              {rankingLabel(val)}
            </span>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          E. VIDEO PERFORMANCE (conditional)
          ═══════════════════════════════════════════════════ */}
      {isVideo && (
        <>
          <SectionHeader title="Video Performance" description="Retention analysis — where viewers drop off reveals content engagement quality." />
          <div className="grid grid-cols-4 gap-2.5 mb-3">
            <KpiCard label="Plays" value={(asset.videoPlays || 0).toLocaleString()} />
            <KpiCard label="ThruPlays" value={(asset.thruPlays || 0).toLocaleString()} />
            <KpiCard label="Avg Watch" value={`${asset.avgWatchTime || 0}s`} />
            <KpiCard label="ThruPlay Rate" value={`${((asset.thruPlays || 0) / (asset.videoPlays || 1) * 100).toFixed(1)}%`} />
          </div>
          <ChartCard title="Retention Curve" desc="% of viewers remaining at each quartile. Steep drops indicate weak sections.">
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
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          F. INSIGHTS & RECOMMENDATIONS
          ═══════════════════════════════════════════════════ */}
      <SectionHeader title="Insights & Recommendations" description="AI-generated analysis comparing this creative against others in your campaign." />
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