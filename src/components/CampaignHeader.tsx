import type { Campaign } from "@/data/mockData";
import MetricCell from "./MetricCell";

interface CampaignHeaderProps {
  campaign: Campaign;
}

const CampaignHeader = ({ campaign }: CampaignHeaderProps) => {
  const totalRoas = campaign.assets.length > 0
    ? (campaign.assets.reduce((sum, a) => sum + a.totalRoas, 0) / campaign.assets.length).toFixed(1)
    : "—";
  const totalConversions = campaign.assets.reduce(
    (sum, a) => sum + a.channels.reduce((cs, c) => cs + c.conversions, 0), 0
  );

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {campaign.name}
          </h1>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
            campaign.status === "active"
              ? "bg-accent/10 text-accent-teal"
              : "bg-secondary text-muted-foreground"
          }`}>
            {campaign.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {campaign.startDate} → {campaign.endDate} · {campaign.assets.length} assets
        </p>
      </div>

      <div className="flex gap-8">
        <MetricCell label="Budget" value={`$${campaign.totalBudget.toLocaleString()}`} />
        <MetricCell label="Spend" value={`$${campaign.totalSpend.toLocaleString()}`} delta={`${((campaign.totalSpend / campaign.totalBudget) * 100).toFixed(0)}% used`} />
        <MetricCell label="Avg ROAS" value={`${totalRoas}x`} />
        <MetricCell label="Conversions" value={totalConversions.toLocaleString()} />
      </div>
    </div>
  );
};

export default CampaignHeader;
