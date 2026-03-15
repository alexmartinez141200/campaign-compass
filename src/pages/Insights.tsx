import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, FlaskConical, BarChart3 } from "lucide-react";
import type { CreativeAsset, Channel } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";
import { useMemo } from "react";

/* ─── Types ─── */

type Confidence = "high" | "medium" | "low";
type Signal = "good" | "neutral" | "bad";

interface MetricSignal {
  area: string;
  metric: string;
  value: string;
  vs: string; // vs avg
  signal: Signal;
  cause: string; // short profile-based cause
}

interface CrossPattern {
  attribute: string;
  winner: string;
  loser: string;
  winAvg: number;
  loseAvg: number;
  confidence: Confidence;
}

/* ─── Engine ─── */

function getSignals(asset: CreativeAsset, all: CreativeAsset[]): MetricSignal[] {
  const signals: MetricSignal[] = [];
  const avg = (fn: (a: CreativeAsset) => number) => all.reduce((s, a) => s + fn(a), 0) / all.length;
  const p = asset.creativeProfile;

  const avgCtr = avg(a => a.ctr);
  const avgCpm = avg(a => a.cpm);
  const avgConv = avg(a => a.conversionRate);
  const avgEng = avg(a => (a.postReactions + a.postShares + a.postSaves) / a.impressions * 100);
  const engRate = (asset.postReactions + asset.postShares + asset.postSaves) / asset.impressions * 100;
  const avgRoas = avg(a => a.roas);

  const pctVs = (val: number, ref: number) => ref > 0 ? Math.round(((val - ref) / ref) * 100) : 0;

  // CTR
  const ctrPct = pctVs(asset.ctr, avgCtr);
  if (Math.abs(ctrPct) > 12) {
    const cause = ctrPct < 0
      ? [p.colorContrast === "Low" && "low contrast", p.motionIntensity === "None" && "no motion", !p.productInFirst3s && "no product in 3s"].filter(Boolean).join(", ") || "weak hook"
      : [p.colorContrast === "High" && "high contrast", p.motionIntensity !== "None" && p.motionIntensity.toLowerCase() + " motion", p.productInFirst3s && "product in 3s"].filter(Boolean).join(", ") || "strong hook";
    signals.push({ area: "Hook", metric: "CTR", value: `${asset.ctr}%`, vs: `${ctrPct > 0 ? "+" : ""}${ctrPct}%`, signal: ctrPct > 0 ? "good" : "bad", cause });
  }

  // Engagement
  const engPct = pctVs(engRate, avgEng);
  if (Math.abs(engPct) > 20) {
    const cause = engPct < 0
      ? [p.funnelStage === "Conversion" && "conversion copy", p.motionIntensity === "None" && "static", p.brandProminence === "Dominant" && "heavy branding"].filter(Boolean).join(", ") || "low resonance"
      : [p.motionIntensity === "High" && "high motion", p.brandConsistency === "High" && "consistent brand", p.funnelStage === "Awareness" && "awareness stage"].filter(Boolean).join(", ") || "strong resonance";
    signals.push({ area: "Engagement", metric: "Eng. Rate", value: `${engRate.toFixed(2)}%`, vs: `${engPct > 0 ? "+" : ""}${engPct}%`, signal: engPct > 0 ? "good" : "bad", cause });
  }

  // CPM
  const cpmPct = pctVs(asset.cpm, avgCpm);
  if (Math.abs(cpmPct) > 20) {
    const cause = cpmPct > 0
      ? [p.aspectRatio === "16:9" && "16:9 format", p.motionIntensity === "None" && "static", asset.qualityRanking === "below_average" && "low quality rank"].filter(Boolean).join(", ") || "poor auction fit"
      : [p.aspectRatio === "9:16" && "9:16 format", p.motionIntensity !== "None" && "motion content"].filter(Boolean).join(", ") || "good auction fit";
    signals.push({ area: "Delivery", metric: "CPM", value: `$${asset.cpm.toFixed(2)}`, vs: `${cpmPct > 0 ? "+" : ""}${cpmPct}%`, signal: cpmPct > 0 ? "bad" : "good", cause });
  }

  // Conversion Rate
  const convPct = pctVs(asset.conversionRate, avgConv);
  if (Math.abs(convPct) > 12) {
    const highCtr = asset.ctr >= avgCtr * 0.95;
    const cause = convPct < 0
      ? [highCtr && "clicks but no buy", p.callToAction === "Learn More" && '"Learn More" CTA', p.funnelStage === "Awareness" && "awareness stage", p.brandProminence === "Subtle" && "subtle branding"].filter(Boolean).join(", ") || "weak conversion path"
      : [p.callToAction === "Buy Now" || p.callToAction === "Shop Now" ? `"${p.callToAction}" CTA` : "", p.funnelStage === "Conversion" && "conversion stage", p.productInFirst3s && "product in 3s"].filter(Boolean).join(", ") || "strong conversion path";
    signals.push({ area: "Conversion", metric: "Conv.", value: `${asset.conversionRate}%`, vs: `${convPct > 0 ? "+" : ""}${convPct}%`, signal: convPct > 0 ? "good" : "bad", cause });
  }

  // ROAS
  const roasPct = pctVs(asset.roas, avgRoas);
  if (Math.abs(roasPct) > 15) {
    const problems = signals.filter(s => s.signal === "bad").map(s => s.area.toLowerCase());
    const strengths = signals.filter(s => s.signal === "good").map(s => s.area.toLowerCase());
    const cause = roasPct < 0
      ? problems.length > 0 ? problems.join(" + ") + " drag" : "compounding inefficiencies"
      : strengths.length > 0 ? strengths.join(" + ") + " lift" : "strong overall profile";
    signals.push({ area: "Efficiency", metric: "ROAS", value: `${asset.roas}x`, vs: `${roasPct > 0 ? "+" : ""}${roasPct}%`, signal: roasPct > 0 ? "good" : "bad", cause });
  }

  return signals;
}

function findPatterns(assets: CreativeAsset[]): CrossPattern[] {
  const patterns: CrossPattern[] = [];
  const sorted = [...assets].sort((a, b) => b.roas - a.roas);
  const mid = Math.ceil(sorted.length / 2);
  const top = sorted.slice(0, mid);
  const bottom = sorted.slice(mid);
  if (top.length === 0 || bottom.length === 0) return patterns;

  const attrs: { name: string; get: (a: CreativeAsset) => string }[] = [
    { name: "Color Contrast", get: a => a.creativeProfile.colorContrast },
    { name: "Motion", get: a => a.creativeProfile.motionIntensity },
    { name: "Brand Prominence", get: a => a.creativeProfile.brandProminence },
    { name: "Funnel Stage", get: a => a.creativeProfile.funnelStage },
    { name: "CTA", get: a => a.creativeProfile.callToAction },
    { name: "Product in 3s", get: a => a.creativeProfile.productInFirst3s ? "Yes" : "No" },
    { name: "Aspect Ratio", get: a => a.creativeProfile.aspectRatio },
  ];

  for (const attr of attrs) {
    const topVals = top.map(a => attr.get(a));
    const botVals = bottom.map(a => attr.get(a));
    const topMode = mode(topVals);
    const botMode = mode(botVals);
    if (!topMode || !botMode || topMode === botMode) continue;

    const topPct = topVals.filter(v => v === topMode).length / top.length;
    const botPct = botVals.filter(v => v === botMode).length / bottom.length;
    if (topPct < 0.6 || botPct < 0.5) continue;

    patterns.push({
      attribute: attr.name,
      winner: topMode,
      loser: botMode,
      winAvg: +(top.reduce((s, a) => s + a.roas, 0) / top.length).toFixed(1),
      loseAvg: +(bottom.reduce((s, a) => s + a.roas, 0) / bottom.length).toFixed(1),
      confidence: assets.length >= 4 ? "high" : assets.length >= 3 ? "medium" : "low",
    });
  }
  return patterns;
}

function mode(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best: string | null = null, bestCount = 0;
  for (const [v, c] of counts) { if (c > bestCount) { best = v; bestCount = c; } }
  return best;
}

/* ─── UI ─── */

const signalColor: Record<Signal, string> = {
  good: "text-emerald-600",
  neutral: "text-muted-foreground",
  bad: "text-destructive",
};
const signalBg: Record<Signal, string> = {
  good: "bg-emerald-500/8",
  neutral: "bg-muted/30",
  bad: "bg-destructive/5",
};
const signalDot: Record<Signal, string> = {
  good: "bg-emerald-500",
  neutral: "bg-muted-foreground/30",
  bad: "bg-destructive",
};

const confLabel: Record<Confidence, { text: string; class: string }> = {
  high: { text: "Reliable", class: "text-emerald-600" },
  medium: { text: "Likely", class: "text-amber-600" },
  low: { text: "Weak", class: "text-muted-foreground" },
};

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];
  const channel: Channel | null = assets.length > 0 ? assets[0].channel : null;

  const { ranked, allSignals, patterns } = useMemo(() => {
    const ranked = [...assets].sort((a, b) => b.roas - a.roas);
    const allSignals = new Map<string, MetricSignal[]>();
    for (const a of ranked) allSignals.set(a.id, getSignals(a, assets));
    const patterns = findPatterns(assets);
    return { ranked, allSignals, patterns };
  }, [assets]);

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-muted-foreground text-sm mt-4">No assets selected.</p>
      </div>
    );
  }

  const maxRoas = Math.max(...assets.map(a => a.roas));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-semibold text-foreground">Creative Diagnostics</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${channelConfig[channel!]?.bgClass}`}>
            {channelConfig[channel!]?.label}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">{assets.length} assets</span>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ═══ Performance Ranking + Signals ═══ */}
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header row */}
          <div className="flex items-center h-8 px-4 bg-muted/20 border-b border-border/40 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/60">
            <div className="w-[200px] flex-shrink-0">Asset</div>
            <div className="w-[80px] flex-shrink-0 text-right">ROAS</div>
            <div className="w-[100px] flex-shrink-0 ml-3" />
            <div className="flex-1 text-center">Diagnostic Signals</div>
          </div>

          {ranked.map((asset) => {
            const signals = allSignals.get(asset.id) || [];
            const barW = maxRoas > 0 ? (asset.roas / maxRoas) * 100 : 0;
            const roasColor = asset.roas >= 5 ? "text-emerald-600" : asset.roas >= 3 ? "text-foreground" : "text-destructive";
            const barColor = asset.roas >= 5 ? "bg-emerald-500" : asset.roas >= 3 ? "bg-primary" : "bg-destructive";

            return (
              <div key={asset.id} className="flex items-center px-4 py-2.5 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                {/* Asset info */}
                <div className="w-[200px] flex-shrink-0 flex items-center gap-2.5">
                  <img src={asset.thumbnail} alt={asset.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{asset.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">{asset.id}</p>
                  </div>
                </div>

                {/* ROAS */}
                <div className={`w-[80px] flex-shrink-0 text-right text-[14px] font-mono font-bold ${roasColor}`}>
                  {asset.roas}x
                </div>

                {/* Bar */}
                <div className="w-[100px] flex-shrink-0 ml-3">
                  <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barW}%` }} />
                  </div>
                </div>

                {/* Signal pills */}
                <div className="flex-1 flex items-center gap-1.5 ml-4 flex-wrap">
                  {signals.length > 0 ? signals.map((s, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${signalBg[s.signal]} border border-border/30`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${signalDot[s.signal]}`} />
                      <span className="text-[10px] font-semibold text-foreground">{s.metric}</span>
                      <span className={`text-[10px] font-mono font-bold ${signalColor[s.signal]}`}>{s.vs}</span>
                      <span className="text-[9px] text-muted-foreground">←</span>
                      <span className="text-[9px] text-muted-foreground italic">{s.cause}</span>
                    </div>
                  )) : (
                    <span className="text-[10px] text-muted-foreground">In line with average</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ Cross-Creative Patterns ═══ */}
        {patterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-primary" />
              <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground">Produce More / Less</h2>
              <span className="text-[10px] text-muted-foreground">— top vs bottom performers' creative profiles</span>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/20 border-b border-border/40">
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-1.5 text-left">Attribute</th>
                    <th className="text-[9px] uppercase tracking-wider text-emerald-600 font-semibold px-3 py-1.5 text-center">Winner</th>
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-center">Avg ROAS</th>
                    <th className="text-[9px] uppercase tracking-wider text-destructive/70 font-semibold px-3 py-1.5 text-center">Underperformer</th>
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-center">Avg ROAS</th>
                    <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-1.5 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((p, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2 text-[11px] font-semibold text-foreground">{p.attribute}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">{p.winner}</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[12px] font-mono font-bold text-foreground">{p.winAvg}x</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">{p.loser}</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[12px] font-mono text-muted-foreground">{p.loseAvg}x</td>
                      <td className={`px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider ${confLabel[p.confidence].class}`}>{confLabel[p.confidence].text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ Profile Comparison ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-foreground">Profile Comparison</h2>
            <span className="text-[10px] text-muted-foreground">— differences marked with <span className="text-primary">●</span></span>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[130px]">Attribute</th>
                  {ranked.map(a => (
                    <th key={a.id} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center">
                      <span className="truncate max-w-[80px] block">{a.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "Format", get: (a: CreativeAsset) => a.type.charAt(0).toUpperCase() + a.type.slice(1) },
                  { label: "Aspect Ratio", get: (a: CreativeAsset) => a.creativeProfile.aspectRatio },
                  { label: "Duration", get: (a: CreativeAsset) => a.creativeProfile.videoDuration ? `${a.creativeProfile.videoDuration}s` : "—" },
                  { label: "Motion", get: (a: CreativeAsset) => a.creativeProfile.motionIntensity },
                  { label: "Contrast", get: (a: CreativeAsset) => a.creativeProfile.colorContrast },
                  { label: "Brand Prom.", get: (a: CreativeAsset) => a.creativeProfile.brandProminence },
                  { label: "Brand Cons.", get: (a: CreativeAsset) => a.creativeProfile.brandConsistency },
                  { label: "Funnel", get: (a: CreativeAsset) => a.creativeProfile.funnelStage },
                  { label: "CTA", get: (a: CreativeAsset) => a.creativeProfile.callToAction },
                  { label: "Product 3s", get: (a: CreativeAsset) => a.creativeProfile.productInFirst3s ? "Yes" : "No" },
                ] as { label: string; get: (a: CreativeAsset) => string }[]).map(row => {
                  const vals = ranked.map(a => row.get(a));
                  const diff = !vals.every(v => v === vals[0]);
                  return (
                    <tr key={row.label} className={`border-b border-border/20 last:border-0 ${diff ? "bg-primary/[0.02]" : ""}`}>
                      <td className={`px-4 py-1.5 text-[10px] font-semibold ${diff ? "text-foreground" : "text-muted-foreground"}`}>
                        {row.label}{diff && <span className="ml-1 text-primary text-[8px]">●</span>}
                      </td>
                      {ranked.map(a => (
                        <td key={a.id} className={`px-3 py-1.5 text-center text-[11px] font-mono ${diff ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                          {row.get(a)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
