import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, ShieldCheck, ShieldAlert, Stethoscope, Pill, FlaskConical } from "lucide-react";
import type { CreativeAsset, Channel } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";
import { useMemo } from "react";

/* ─── Types ─── */

type Confidence = "high" | "medium" | "low";

interface Diagnosis {
  assetName: string;
  assetId: string;
  thumbnail: string;
  roas: number;
  overallAssessment: "strong" | "mixed" | "weak";
  findings: Finding[];
}

interface Finding {
  area: "hook" | "engagement" | "delivery" | "conversion" | "efficiency";
  severity: "good" | "warning" | "problem";
  symptom: string;
  diagnosis: string;
  profileLink: string; // which creative profile attributes explain this
  confidence: Confidence;
}

interface CrossAssetPattern {
  title: string;
  detail: string;
  confidence: Confidence;
  actionable: boolean;
}

/* ─── Diagnostic Engine ─── */

function diagnoseAsset(asset: CreativeAsset, allAssets: CreativeAsset[]): Diagnosis {
  const findings: Finding[] = [];
  const avgRoas = allAssets.reduce((s, a) => s + a.roas, 0) / allAssets.length;
  const avgCtr = allAssets.reduce((s, a) => s + a.ctr, 0) / allAssets.length;
  const avgCpm = allAssets.reduce((s, a) => s + a.cpm, 0) / allAssets.length;
  const avgConvRate = allAssets.reduce((s, a) => s + a.conversionRate, 0) / allAssets.length;
  const avgEngRate = allAssets.reduce((s, a) => s + (a.postReactions + a.postComments + a.postShares) / a.impressions * 100, 0) / allAssets.length;
  const engRate = (asset.postReactions + asset.postComments + asset.postShares) / asset.impressions * 100;
  const p = asset.creativeProfile;

  // ─── HOOK: Does the creative grab attention? ───
  // Signals: CTR, engagement rate, video view rate (TikTok), saves
  if (asset.ctr < avgCtr * 0.85) {
    const causes: string[] = [];
    if (p.colorContrast === "Low") causes.push("low color contrast makes it easy to scroll past");
    if (p.motionIntensity === "None") causes.push("static format competes poorly in a motion-heavy feed");
    if (!p.productInFirst3s) causes.push("no product shown in the first 3 seconds to create immediate interest");
    if (p.brandProminence === "Dominant") causes.push("dominant branding in the opening may feel too promotional, causing scroll-past");

    findings.push({
      area: "hook",
      severity: "problem",
      symptom: `CTR is ${asset.ctr}% — ${((1 - asset.ctr / avgCtr) * 100).toFixed(0)}% below the group average (${avgCtr.toFixed(1)}%). The creative isn't stopping the scroll.`,
      diagnosis: causes.length > 0
        ? `Likely causes: ${causes.join("; ")}. The opening frames need to create more visual disruption to earn attention.`
        : `The creative may lack visual distinction. Consider testing bolder visuals, unexpected compositions, or a stronger opening hook.`,
      profileLink: [p.colorContrast + " contrast", p.motionIntensity + " motion", p.productInFirst3s ? "product visible" : "no product in 3s"].join(" · "),
      confidence: allAssets.length >= 3 ? "high" : "medium",
    });
  } else if (asset.ctr > avgCtr * 1.15) {
    findings.push({
      area: "hook",
      severity: "good",
      symptom: `CTR is ${asset.ctr}% — ${((asset.ctr / avgCtr - 1) * 100).toFixed(0)}% above group average. Strong scroll-stopping power.`,
      diagnosis: `The ${p.colorContrast.toLowerCase()} contrast${p.motionIntensity !== "None" ? ` and ${p.motionIntensity.toLowerCase()} motion` : ""} combination is working. ${p.productInFirst3s ? "Early product visibility creates immediate relevance." : "The hook works without immediate product reveal — curiosity-driven."}`,
      profileLink: [p.colorContrast + " contrast", p.motionIntensity + " motion"].join(" · "),
      confidence: "high",
    });
  }

  // ─── ENGAGEMENT: Does the creative resonate? ───
  if (engRate < avgEngRate * 0.75) {
    const causes: string[] = [];
    if (p.brandConsistency === "Low") causes.push("low brand consistency may make the content feel disconnected or generic");
    if (p.brandProminence === "Subtle") causes.push("subtle branding may not create enough identity for users to engage with");
    if (p.motionIntensity === "None") causes.push("static creatives typically drive lower emotional response than motion content");
    if (p.funnelStage === "Conversion") causes.push("conversion-focused copy prioritizes action over shareability");

    findings.push({
      area: "engagement",
      severity: "problem",
      symptom: `Engagement rate is ${engRate.toFixed(2)}% — significantly below group average (${avgEngRate.toFixed(2)}%). Low reactions, shares, and saves suggest the creative isn't resonating emotionally.`,
      diagnosis: causes.length > 0
        ? `Likely causes: ${causes.join("; ")}. The creative may be functionally adequate but lacks the emotional trigger needed for organic engagement.`
        : `The creative may be too formulaic. Consider UGC-style content, unexpected narratives, or stronger emotional hooks.`,
      profileLink: [p.brandConsistency + " consistency", p.brandProminence + " prominence", p.funnelStage].join(" · "),
      confidence: allAssets.length >= 3 ? "high" : "medium",
    });
  } else if (engRate > avgEngRate * 1.3) {
    findings.push({
      area: "engagement",
      severity: "good",
      symptom: `Engagement rate ${engRate.toFixed(2)}% is ${((engRate / avgEngRate - 1) * 100).toFixed(0)}% above average. High saves (${asset.postSaves.toLocaleString()}) and shares (${asset.postShares.toLocaleString()}) indicate strong resonance.`,
      diagnosis: `The ${p.funnelStage.toLowerCase()}-stage messaging combined with ${p.brandProminence.toLowerCase()} branding strikes the right balance — users find it worth saving and sharing.`,
      profileLink: [p.funnelStage, p.brandProminence + " prominence"].join(" · "),
      confidence: "high",
    });
  }

  // ─── DELIVERY: Is the platform distributing it efficiently? ───
  if (asset.cpm > avgCpm * 1.3) {
    const causes: string[] = [];
    if (p.aspectRatio === "16:9") causes.push("16:9 format may underperform in mobile-first placements where 9:16 or 1:1 get priority");
    if (p.motionIntensity === "None" && allAssets.some(a => a.creativeProfile.motionIntensity !== "None" && a.cpm < asset.cpm)) {
      causes.push("static format may be receiving less favorable auction treatment vs video inventory");
    }
    if (asset.qualityRanking === "below_average") causes.push("below-average quality ranking signals the platform is penalizing delivery");

    findings.push({
      area: "delivery",
      severity: "warning",
      symptom: `CPM of $${asset.cpm.toFixed(2)} is ${((asset.cpm / avgCpm - 1) * 100).toFixed(0)}% above group average ($${avgCpm.toFixed(2)}). Paying a premium for each impression.`,
      diagnosis: causes.length > 0
        ? `Likely causes: ${causes.join("; ")}. High CPM eats into ROAS even if conversion rates are decent.`
        : `The creative may be competing in a saturated placement. Test different aspect ratios or formats to find cheaper inventory.`,
      profileLink: [p.aspectRatio, asset.type].join(" · "),
      confidence: "medium",
    });
  } else if (asset.cpm < avgCpm * 0.75) {
    findings.push({
      area: "delivery",
      severity: "good",
      symptom: `CPM of $${asset.cpm.toFixed(2)} is ${((1 - asset.cpm / avgCpm) * 100).toFixed(0)}% below average. Efficient delivery.`,
      diagnosis: `The ${p.aspectRatio} format${p.motionIntensity !== "None" ? " with motion" : ""} is getting favorable platform distribution. This format-audience match is working well.`,
      profileLink: [p.aspectRatio, p.motionIntensity + " motion"].join(" · "),
      confidence: "high",
    });
  }

  // ─── CONVERSION: Does the creative drive purchase action? ───
  if (asset.conversionRate < avgConvRate * 0.8) {
    const highCtr = asset.ctr >= avgCtr * 0.95;
    const causes: string[] = [];

    if (highCtr) {
      causes.push("the hook is working (good CTR) but the landing experience or message doesn't close");
      if (p.funnelStage === "Awareness") causes.push("awareness-stage messaging may attract curiosity clicks without purchase intent");
    }
    if (p.callToAction === "Learn More" || p.callToAction === "Watch More" || p.callToAction === "Follow Us") {
      causes.push(`"${p.callToAction}" CTA signals exploration, not purchase — it may attract browsers instead of buyers`);
    }
    if (p.brandProminence === "Subtle") causes.push("subtle branding may not build enough trust for purchase commitment");

    findings.push({
      area: "conversion",
      severity: "problem",
      symptom: `Conversion rate ${asset.conversionRate}% is ${((1 - asset.conversionRate / avgConvRate) * 100).toFixed(0)}% below average (${avgConvRate.toFixed(1)}%). ${highCtr ? "People click but don't buy." : "Low interest from awareness through purchase."}`,
      diagnosis: causes.length > 0
        ? `${causes.join(". ")}. ${highCtr ? "The creative attracts the wrong audience or sets misaligned expectations." : "Consider a more direct, conversion-oriented creative approach."}`
        : `The message-to-landing-page alignment may be off. Ensure the creative promise matches the purchase experience.`,
      profileLink: [p.funnelStage, `CTA: "${p.callToAction}"`, p.brandProminence + " branding"].join(" · "),
      confidence: highCtr ? "high" : "medium",
    });
  } else if (asset.conversionRate > avgConvRate * 1.2) {
    findings.push({
      area: "conversion",
      severity: "good",
      symptom: `Conversion rate ${asset.conversionRate}% is ${((asset.conversionRate / avgConvRate - 1) * 100).toFixed(0)}% above average. Strong purchase intent.`,
      diagnosis: `The "${p.callToAction}" CTA paired with ${p.funnelStage.toLowerCase()}-stage messaging and ${p.brandProminence.toLowerCase()} branding effectively drives purchase commitment. ${p.productInFirst3s ? "Early product visibility sets clear expectations." : ""}`,
      profileLink: [`CTA: "${p.callToAction}"`, p.funnelStage, p.brandProminence + " branding"].join(" · "),
      confidence: "high",
    });
  }

  // ─── EFFICIENCY: Overall cost effectiveness ───
  if (asset.roas < avgRoas * 0.7) {
    findings.push({
      area: "efficiency",
      severity: "problem",
      symptom: `ROAS ${asset.roas}x is ${((1 - asset.roas / avgRoas) * 100).toFixed(0)}% below group average (${avgRoas.toFixed(1)}x). Generating $${asset.purchaseValue.toLocaleString()} revenue on $${asset.spend.toLocaleString()} spend.`,
      diagnosis: `This creative is a budget drain. ${findings.filter(f => f.severity === "problem").length > 1 ? "Multiple issues compound: " + findings.filter(f => f.severity === "problem").map(f => f.area).join(" + ") + " problems create a cascading efficiency loss." : "Address the root performance issues above before scaling spend."}`,
      profileLink: "See individual findings above",
      confidence: "high",
    });
  } else if (asset.roas > avgRoas * 1.3) {
    findings.push({
      area: "efficiency",
      severity: "good",
      symptom: `ROAS ${asset.roas}x is ${((asset.roas / avgRoas - 1) * 100).toFixed(0)}% above average. Strong returns on $${asset.spend.toLocaleString()} spend.`,
      diagnosis: `This creative profile is a winner. ${findings.filter(f => f.severity === "good").length > 1 ? "Multiple strengths compound: " + findings.filter(f => f.severity === "good").map(f => f.area).join(" + ") + " create a virtuous cycle." : "Consider increasing budget allocation here."}`,
      profileLink: "See individual findings above",
      confidence: "high",
    });
  }

  const goodCount = findings.filter(f => f.severity === "good").length;
  const problemCount = findings.filter(f => f.severity === "problem").length;
  const overallAssessment: "strong" | "mixed" | "weak" =
    problemCount === 0 && goodCount > 0 ? "strong" :
    problemCount > goodCount ? "weak" : "mixed";

  return {
    assetName: asset.name,
    assetId: asset.id,
    thumbnail: asset.thumbnail,
    roas: asset.roas,
    overallAssessment,
    findings,
  };
}

function findCrossPatterns(assets: CreativeAsset[], diagnoses: Diagnosis[]): CrossAssetPattern[] {
  const patterns: CrossAssetPattern[] = [];
  const sorted = [...assets].sort((a, b) => b.roas - a.roas);
  const top = sorted.slice(0, Math.ceil(sorted.length / 2));
  const bottom = sorted.slice(Math.ceil(sorted.length / 2));

  if (top.length === 0 || bottom.length === 0) return patterns;

  // Compare creative profiles between top and bottom
  const attrs: { name: string; get: (p: CreativeAsset) => string }[] = [
    { name: "Color Contrast", get: a => a.creativeProfile.colorContrast },
    { name: "Motion Intensity", get: a => a.creativeProfile.motionIntensity },
    { name: "Brand Prominence", get: a => a.creativeProfile.brandProminence },
    { name: "Brand Consistency", get: a => a.creativeProfile.brandConsistency },
    { name: "Funnel Stage", get: a => a.creativeProfile.funnelStage },
    { name: "CTA", get: a => a.creativeProfile.callToAction },
    { name: "Product in First 3s", get: a => a.creativeProfile.productInFirst3s ? "Yes" : "No" },
    { name: "Aspect Ratio", get: a => a.creativeProfile.aspectRatio },
  ];

  for (const attr of attrs) {
    const topValues = top.map(a => attr.get(a));
    const bottomValues = bottom.map(a => attr.get(a));
    const topMajority = mode(topValues);
    const bottomMajority = mode(bottomValues);

    if (topMajority && bottomMajority && topMajority !== bottomMajority) {
      const topCount = topValues.filter(v => v === topMajority).length;
      const bottomCount = bottomValues.filter(v => v === bottomMajority).length;
      const topPct = Math.round(topCount / top.length * 100);
      const bottomPct = Math.round(bottomCount / bottom.length * 100);

      if (topPct >= 60 && bottomPct >= 50) {
        const avgRoasTop = top.reduce((s, a) => s + a.roas, 0) / top.length;
        const avgRoasBottom = bottom.reduce((s, a) => s + a.roas, 0) / bottom.length;

        patterns.push({
          title: `${attr.name}: "${topMajority}" outperforms "${bottomMajority}"`,
          detail: `${topPct}% of top performers use "${topMajority}" ${attr.name.toLowerCase()} (avg ${avgRoasTop.toFixed(1)}x ROAS), while ${bottomPct}% of bottom performers use "${bottomMajority}" (avg ${avgRoasBottom.toFixed(1)}x ROAS). Prioritize "${topMajority}" in future creative production.`,
          confidence: assets.length >= 4 && topCount >= 2 ? "high" : assets.length >= 3 ? "medium" : "low",
          actionable: true,
        });
      }
    }
  }

  // Check if low engagement consistently comes with specific profiles
  const lowEngAssets = assets.filter(a => {
    const engRate = (a.postReactions + a.postComments + a.postShares) / a.impressions * 100;
    const avgEngRate = assets.reduce((s, x) => s + (x.postReactions + x.postComments + x.postShares) / x.impressions * 100, 0) / assets.length;
    return engRate < avgEngRate * 0.8;
  });

  if (lowEngAssets.length >= 2) {
    const commonTraits: string[] = [];
    if (lowEngAssets.every(a => a.creativeProfile.motionIntensity === "None")) commonTraits.push("static (no motion)");
    if (lowEngAssets.every(a => a.creativeProfile.colorContrast === "Low" || a.creativeProfile.colorContrast === "Medium")) commonTraits.push("low-to-medium contrast");
    if (lowEngAssets.every(a => a.creativeProfile.brandProminence === "Dominant")) commonTraits.push("dominant branding");
    if (lowEngAssets.every(a => a.creativeProfile.funnelStage === "Conversion")) commonTraits.push("conversion-stage messaging");

    if (commonTraits.length > 0) {
      patterns.push({
        title: "Low-engagement creatives share common traits",
        detail: `${lowEngAssets.length} assets with below-average engagement all share: ${commonTraits.join(", ")}. These design choices may suppress organic interaction. Consider introducing more motion, contrast, or authentic content formats.`,
        confidence: lowEngAssets.length >= 3 ? "high" : "medium",
        actionable: true,
      });
    }
  }

  // Spend efficiency signal
  const spendValues = assets.map(a => a.spend);
  const maxSpend = Math.max(...spendValues);
  const minSpend = Math.min(...spendValues);
  if (maxSpend > minSpend * 2) {
    const underspent = assets.filter(a => a.spend < maxSpend * 0.5 && a.roas > sorted[0].roas * 0.8);
    if (underspent.length > 0) {
      patterns.push({
        title: "Hidden winners may be underfunded",
        detail: `${underspent.map(a => a.name).join(", ")} ${underspent.length === 1 ? "shows" : "show"} strong ROAS despite receiving ${((1 - minSpend / maxSpend) * 100).toFixed(0)}% less budget than top-funded assets. Performance could improve further with more spend — or it could be inflated by small sample. Test with equal budgets.`,
        confidence: "low",
        actionable: true,
      });
    }
  }

  return patterns;
}

function mode(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}

/* ─── UI ─── */

const areaLabels: Record<string, { label: string; emoji: string }> = {
  hook: { label: "Hook & Attention", emoji: "👁" },
  engagement: { label: "Engagement & Resonance", emoji: "💬" },
  delivery: { label: "Platform Delivery", emoji: "📡" },
  conversion: { label: "Conversion & Purchase", emoji: "🛒" },
  efficiency: { label: "Overall Efficiency", emoji: "⚡" },
};

const severityStyle = {
  good: { border: "border-l-emerald-500", bg: "bg-emerald-50/30", label: "Strength", labelClass: "text-emerald-600 bg-emerald-500/10" },
  warning: { border: "border-l-amber-500", bg: "bg-amber-50/20", label: "Watch", labelClass: "text-amber-600 bg-amber-500/10" },
  problem: { border: "border-l-destructive", bg: "bg-destructive/[0.03]", label: "Issue", labelClass: "text-destructive bg-destructive/10" },
};

const confStyle: Record<Confidence, { label: string; class: string }> = {
  high: { label: "Reliable", class: "text-emerald-600" },
  medium: { label: "Likely", class: "text-amber-600" },
  low: { label: "Possible", class: "text-muted-foreground" },
};

const assessmentStyle = {
  strong: { label: "Strong Performer", class: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  mixed: { label: "Mixed Results", class: "bg-amber-500/10 text-amber-700 border-amber-200" },
  weak: { label: "Underperforming", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];
  const channel: Channel | null = assets.length > 0 ? assets[0].channel : null;

  const { diagnoses, patterns } = useMemo(() => {
    const d = assets.map(a => diagnoseAsset(a, assets));
    d.sort((a, b) => b.roas - a.roas); // Best first
    const p = findCrossPatterns(assets, d);
    return { diagnoses: d, patterns: p };
  }, [assets]);

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-muted-foreground text-sm">No assets selected.</p>
      </div>
    );
  }

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
          <span className="text-[11px] text-muted-foreground font-mono">{assets.length} assets analyzed</span>
        </div>
      </div>

      <div className="p-6 space-y-8">

        {/* ═══ Performance Ranking ═══ */}
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="px-4 py-2 bg-muted/20 border-b border-border/40">
            <h2 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Performance Ranking</h2>
          </div>
          <div className="divide-y divide-border/30">
            {diagnoses.map((d, i) => {
              const asset = assets.find(a => a.id === d.assetId)!;
              const roasColor = d.roas >= 5 ? "text-emerald-600" : d.roas >= 3 ? "text-foreground" : "text-destructive";
              const maxRoas = Math.max(...assets.map(a => a.roas));
              const barW = maxRoas > 0 ? (d.roas / maxRoas) * 100 : 0;
              return (
                <div key={d.assetId} className="flex items-center gap-4 px-4 py-2.5">
                  <img src={d.thumbnail} alt={d.assetName} className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
                  <div className="min-w-[120px] max-w-[160px] flex-shrink-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{d.assetName}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">{d.assetId}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${d.roas >= 5 ? "bg-emerald-500" : d.roas >= 3 ? "bg-primary" : "bg-destructive"}`}
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                    <span className={`text-[14px] font-mono font-bold min-w-[50px] text-right ${roasColor}`}>{d.roas}x</span>
                  </div>
                  <div className="flex items-center gap-4 ml-2 text-[11px] font-mono text-muted-foreground flex-shrink-0">
                    <span>${asset.spend.toLocaleString()}<span className="text-[8px] ml-0.5 uppercase tracking-wider">spend</span></span>
                    <span>${asset.purchaseValue.toLocaleString()}<span className="text-[8px] ml-0.5 uppercase tracking-wider">rev</span></span>
                    <span>{asset.conversionRate}%<span className="text-[8px] ml-0.5 uppercase tracking-wider">conv</span></span>
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${assessmentStyle[d.overallAssessment].class}`}>
                    {assessmentStyle[d.overallAssessment].label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ Cross-Asset Patterns ═══ */}
        {patterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="w-4 h-4 text-primary" />
              <h2 className="text-[12px] uppercase tracking-wider font-bold text-foreground">Cross-Creative Patterns</h2>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Patterns found by comparing top and bottom performers' creative profiles
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {patterns.map((p, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-[12px] font-semibold text-foreground leading-snug">{p.title}</p>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${confStyle[p.confidence].class} ${p.confidence === "high" ? "bg-emerald-500/10" : p.confidence === "medium" ? "bg-amber-500/10" : "bg-muted"}`}>
                      {confStyle[p.confidence].label}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/70 leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Per-Asset Diagnostics ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-4 h-4 text-primary" />
            <h2 className="text-[12px] uppercase tracking-wider font-bold text-foreground">Per-Creative Diagnostic</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Each creative is assessed across the funnel — from first impression to purchase — with root causes traced to the creative profile
          </p>

          <div className="space-y-5">
            {diagnoses.map((diag) => (
              <div key={diag.assetId} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Asset header */}
                <div className="px-4 py-3 bg-muted/15 border-b border-border/40 flex items-center gap-3">
                  <img src={diag.thumbnail} alt={diag.assetName} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground">{diag.assetName}</p>
                      <span className="text-[9px] font-mono text-muted-foreground">{diag.assetId}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-[14px] font-mono font-bold ${diag.roas >= 5 ? "text-emerald-600" : diag.roas >= 3 ? "text-foreground" : "text-destructive"}`}>
                        {diag.roas}x ROAS
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${assessmentStyle[diag.overallAssessment].class}`}>
                    {assessmentStyle[diag.overallAssessment].label}
                  </span>
                </div>

                {/* Findings */}
                {diag.findings.length > 0 ? (
                  <div className="divide-y divide-border/20">
                    {diag.findings.map((f, i) => {
                      const style = severityStyle[f.severity];
                      const area = areaLabels[f.area];
                      return (
                        <div key={i} className={`flex border-l-[3px] ${style.border} ${style.bg}`}>
                          <div className="flex-1 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px]">{area.emoji}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{area.label}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style.labelClass}`}>{style.label}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-wider ml-auto ${confStyle[f.confidence].class}`}>{confStyle[f.confidence].label}</span>
                            </div>
                            <p className="text-[12px] text-foreground/90 leading-relaxed mb-1">{f.symptom}</p>
                            <p className="text-[11px] text-foreground/70 leading-relaxed mb-1.5">{f.diagnosis}</p>
                            <div className="flex items-center gap-1">
                              <Palette className="w-3 h-3 text-muted-foreground/40" />
                              <span className="text-[9px] font-mono text-muted-foreground/60">{f.profileLink}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-[11px] text-muted-foreground">
                    No significant deviations from group average — this creative performs in line with expectations.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Creative Profile Comparison ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="text-[12px] uppercase tracking-wider font-bold text-foreground">Profile Comparison</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Differing attributes are highlighted — these are the design variables that explain performance gaps</p>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 text-left w-[140px]">Attribute</th>
                  {diagnoses.map(d => (
                    <th key={d.assetId} className="text-[10px] font-semibold text-foreground px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <img src={d.thumbnail} alt={d.assetName} className="w-7 h-7 rounded object-cover" />
                        <span className="truncate max-w-[90px]">{d.assetName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "Format", get: (a: CreativeAsset) => a.type.charAt(0).toUpperCase() + a.type.slice(1) },
                  { label: "Aspect Ratio", get: (a: CreativeAsset) => a.creativeProfile.aspectRatio },
                  { label: "Video Duration", get: (a: CreativeAsset) => a.creativeProfile.videoDuration ? `${a.creativeProfile.videoDuration}s` : "—" },
                  { label: "Motion Intensity", get: (a: CreativeAsset) => a.creativeProfile.motionIntensity },
                  { label: "Color Contrast", get: (a: CreativeAsset) => a.creativeProfile.colorContrast },
                  { label: "Brand Prominence", get: (a: CreativeAsset) => a.creativeProfile.brandProminence },
                  { label: "Brand Consistency", get: (a: CreativeAsset) => a.creativeProfile.brandConsistency },
                  { label: "Funnel Stage", get: (a: CreativeAsset) => a.creativeProfile.funnelStage },
                  { label: "CTA", get: (a: CreativeAsset) => a.creativeProfile.callToAction },
                  { label: "Product in First 3s", get: (a: CreativeAsset) => a.creativeProfile.productInFirst3s ? "Yes" : "No" },
                ] as { label: string; get: (a: CreativeAsset) => string }[]).map(row => {
                  const values = assets.map(a => row.get(a));
                  const allSame = values.every(v => v === values[0]);
                  return (
                    <tr key={row.label} className={`border-b border-border/20 last:border-0 ${!allSame ? "bg-primary/[0.02]" : ""}`}>
                      <td className={`px-4 py-1.5 text-[10px] font-semibold ${!allSame ? "text-foreground" : "text-muted-foreground"}`}>
                        {row.label}
                        {!allSame && <span className="ml-1 text-primary text-[8px]">●</span>}
                      </td>
                      {assets.map(a => (
                        <td key={a.id} className={`px-3 py-1.5 text-center text-[11px] font-mono ${allSame ? "text-muted-foreground" : "text-foreground font-semibold"}`}>
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
