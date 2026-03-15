import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Eye, MousePointerClick, ShoppingCart, Target, BarChart3 } from "lucide-react";
import type { CreativeAsset } from "@/data/mockData";
import ChannelIcon from "./ChannelIcon";

interface AssetDetailProps {
  asset: CreativeAsset;
  campaignAssets: CreativeAsset[];
  onBack: () => void;
}

/** Generate insights by comparing this asset against all campaign assets */
function generateInsights(asset: CreativeAsset, all: CreativeAsset[]) {
  const insights: { type: "positive" | "warning" | "negative"; text: string }[] = [];
  
  const avgRoas = all.reduce((s, a) => s + a.roas, 0) / all.length;
  const avgCpm = all.reduce((s, a) => s + a.cpm, 0) / all.length;
  const avgCtr = all.reduce((s, a) => s + a.ctr, 0) / all.length;
  const avgCpc = all.reduce((s, a) => s + a.cpc, 0) / all.length;
  const avgConvRate = all.reduce((s, a) => s + a.conversionRate, 0) / all.length;
  const bestRoas = Math.max(...all.map(a => a.roas));
  const bestConvRate = Math.max(...all.map(a => a.conversionRate));

  // ROAS
  if (asset.roas >= bestRoas) {
    insights.push({ type: "positive", text: `Top performer — highest ROAS in this campaign at ${asset.roas}x` });
  } else if (asset.roas >= avgRoas * 1.2) {
    insights.push({ type: "positive", text: `ROAS is ${((asset.roas / avgRoas - 1) * 100).toFixed(0)}% above campaign average (${avgRoas.toFixed(1)}x)` });
  } else if (asset.roas < avgRoas * 0.8) {
    insights.push({ type: "negative", text: `ROAS is ${((1 - asset.roas / avgRoas) * 100).toFixed(0)}% below campaign average — consider pausing or iterating` });
  }

  // CPM efficiency
  if (asset.cpm < avgCpm * 0.8) {
    insights.push({ type: "positive", text: `CPM ($${asset.cpm.toFixed(2)}) is ${((1 - asset.cpm / avgCpm) * 100).toFixed(0)}% cheaper than average — great reach efficiency` });
  } else if (asset.cpm > avgCpm * 1.3) {
    insights.push({ type: "warning", text: `High CPM ($${asset.cpm.toFixed(2)}) — ${((asset.cpm / avgCpm - 1) * 100).toFixed(0)}% above average. Audience may be too narrow` });
  }

  // CTR
  if (asset.ctr > avgCtr * 1.2) {
    insights.push({ type: "positive", text: `Strong engagement — CTR ${asset.ctr}% outperforms campaign average of ${avgCtr.toFixed(1)}%` });
  } else if (asset.ctr < avgCtr * 0.7) {
    insights.push({ type: "negative", text: `Low CTR (${asset.ctr}%) — creative may need a stronger hook or CTA` });
  }

  // Conversion rate
  if (asset.conversionRate >= bestConvRate) {
    insights.push({ type: "positive", text: `Best conversion rate in campaign (${asset.conversionRate}%) — landing page alignment is strong` });
  } else if (asset.conversionRate < avgConvRate * 0.7) {
    insights.push({ type: "warning", text: `Conv. rate (${asset.conversionRate}%) is below average — check landing page or audience intent` });
  }

  // CPC
  if (asset.cpc > avgCpc * 1.4) {
    insights.push({ type: "warning", text: `CPC ($${asset.cpc.toFixed(2)}) is high — ${((asset.cpc / avgCpc - 1) * 100).toFixed(0)}% above average. Optimize targeting` });
  }

  // Revenue estimate
  const estimatedRevenue = asset.spend * asset.roas;
  const profit = estimatedRevenue - asset.spend;
  if (profit > 0) {
    insights.push({ type: "positive", text: `Estimated profit: $${profit.toLocaleString()} on $${asset.spend.toLocaleString()} spend` });
  } else {
    insights.push({ type: "negative", text: `Negative ROI — spending $${asset.spend.toLocaleString()} to generate $${estimatedRevenue.toLocaleString()}` });
  }

  return insights;
}

function getVerdict(asset: CreativeAsset, all: CreativeAsset[]): { label: string; color: string; bg: string; description: string } {
  const avgRoas = all.reduce((s, a) => s + a.roas, 0) / all.length;
  const bestRoas = Math.max(...all.map(a => a.roas));
  
  if (asset.roas >= bestRoas) return { label: "Top Performer", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", description: "This creative is delivering the best returns in your campaign. Consider increasing budget allocation." };
  if (asset.roas >= avgRoas * 1.1) return { label: "Strong", color: "text-emerald-600", bg: "bg-emerald-50/60 border-emerald-200/60", description: "Above-average performance. A solid creative worth keeping active." };
  if (asset.roas >= avgRoas * 0.85) return { label: "Average", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", description: "Performing at campaign average. Monitor closely or test variations." };
  return { label: "Underperforming", color: "text-destructive", bg: "bg-red-50 border-red-200", description: "Below average returns. Consider pausing, reallocating budget, or refreshing creative." };
}

const MetricCard = ({ icon: Icon, label, value, subValue, className = "" }: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  subValue?: string;
  className?: string;
}) => (
  <div className={`flex items-start gap-3 p-4 rounded-lg border border-border bg-surface ${className}`}>
    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-lg font-mono font-bold text-foreground mt-0.5">{value}</p>
      {subValue && <p className="text-[11px] text-muted-foreground mt-0.5">{subValue}</p>}
    </div>
  </div>
);

const AssetDetail = ({ asset, campaignAssets, onBack }: AssetDetailProps) => {
  const verdict = getVerdict(asset, campaignAssets);
  const insights = generateInsights(asset, campaignAssets);
  const estimatedRevenue = asset.spend * asset.roas;
  const rank = [...campaignAssets].sort((a, b) => b.roas - a.roas).findIndex(a => a.id === asset.id) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Back + title */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to assets
      </button>

      {/* Hero section */}
      <div className="flex gap-5 mb-6">
        {/* Thumbnail */}
        <div className="w-28 h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          <img src={asset.thumbnail} alt={asset.name} className="object-cover w-full h-full" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{asset.name}</h2>
              <p className="text-[12px] text-muted-foreground font-mono mt-1">
                {asset.id} · {asset.dimensions} · {asset.type}
              </p>
              <div className="mt-2">
                <ChannelIcon channel={asset.channel} size="md" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rank</p>
              <p className="text-2xl font-mono font-bold text-foreground">#{rank}</p>
              <p className="text-[11px] text-muted-foreground">of {campaignAssets.length} assets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verdict banner */}
      <div className={`rounded-lg border p-4 mb-6 ${verdict.bg}`}>
        <div className="flex items-center gap-2 mb-1">
          {verdict.label === "Top Performer" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
           verdict.label === "Underperforming" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
           <BarChart3 className="w-4 h-4 text-muted-foreground" />}
          <span className={`text-sm font-semibold ${verdict.color}`}>{verdict.label}</span>
        </div>
        <p className="text-[13px] text-foreground/80">{verdict.description}</p>
      </div>

      {/* Key financial metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <MetricCard icon={DollarSign} label="Total Spend" value={`$${asset.spend.toLocaleString()}`} subValue="Input budget" />
        <MetricCard icon={TrendingUp} label="Est. Revenue" value={`$${estimatedRevenue.toLocaleString()}`} subValue={`${asset.roas}x return`} />
        <MetricCard icon={ShoppingCart} label="Conversions" value={asset.conversions.toLocaleString()} subValue={`${asset.conversionRate}% conv. rate`} />
      </div>

      {/* All metrics grid */}
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Performance Breakdown</h3>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard icon={Target} label="ROAS" value={`${asset.roas}x`} />
        <MetricCard icon={DollarSign} label="CPM" value={`$${asset.cpm.toFixed(2)}`} subValue="Cost per 1K impressions" />
        <MetricCard icon={MousePointerClick} label="CTR" value={`${asset.ctr}%`} subValue={`${asset.clicks.toLocaleString()} clicks`} />
        <MetricCard icon={DollarSign} label="CPC" value={`$${asset.cpc.toFixed(2)}`} subValue="Cost per click" />
        <MetricCard icon={Eye} label="Impressions" value={asset.impressions.toLocaleString()} />
        <MetricCard icon={MousePointerClick} label="Clicks" value={asset.clicks.toLocaleString()} />
        <MetricCard icon={ShoppingCart} label="Conversions" value={asset.conversions.toLocaleString()} />
        <MetricCard icon={Target} label="Conv. Rate" value={`${asset.conversionRate}%`} subValue="Clicks → purchases" />
      </div>

      {/* Insights */}
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Insights & Recommendations</h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
              insight.type === "positive" ? "bg-emerald-50/50 border-emerald-200/50" :
              insight.type === "warning" ? "bg-yellow-50/50 border-yellow-200/50" :
              "bg-red-50/50 border-red-200/50"
            }`}
          >
            {insight.type === "positive" ? <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> :
             insight.type === "warning" ? <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" /> :
             <TrendingDown className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />}
            <p className="text-[13px] text-foreground/85 leading-relaxed">{insight.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AssetDetail;
