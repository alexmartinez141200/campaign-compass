import { useState, useMemo } from "react";
import AppSidebar from "@/components/AppSidebar";
import CampaignHeader from "@/components/CampaignHeader";
import DiagnosticCard from "@/components/DiagnosticCard";
import FilterBar from "@/components/FilterBar";
import { campaigns } from "@/data/mockData";

type AssetFilter = "all" | "video" | "image" | "carousel";
type SortOption = "roas" | "spend" | "delta";

const Index = () => {
  const [activeCampaignId, setActiveCampaignId] = useState(campaigns[0].id);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [sort, setSort] = useState<SortOption>("roas");

  const campaign = campaigns.find((c) => c.id === activeCampaignId)!;

  const filteredAssets = useMemo(() => {
    let assets = campaign.assets;
    if (filter !== "all") assets = assets.filter((a) => a.type === filter);

    return [...assets].sort((a, b) => {
      if (sort === "roas") return b.totalRoas - a.totalRoas;
      if (sort === "spend") return b.totalSpend - a.totalSpend;
      // delta: biggest gap between best and worst channel
      const deltaA = Math.max(...a.channels.map((c) => c.roas)) - Math.min(...a.channels.map((c) => c.roas));
      const deltaB = Math.max(...b.channels.map((c) => c.roas)) - Math.min(...b.channels.map((c) => c.roas));
      return deltaB - deltaA;
    });
  }, [campaign, filter, sort]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <main className="ml-60 p-8">
        {/* Campaign tabs */}
        <div className="flex gap-2 mb-6">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCampaignId(c.id)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-150 ${
                c.id === activeCampaignId
                  ? "bg-surface text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Header */}
        <CampaignHeader campaign={campaign} />

        {/* Filters */}
        <div className="mt-6 mb-4">
          <FilterBar filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />
        </div>

        {/* Diagnostic rows */}
        <div className="space-y-3">
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset, i) => (
              <DiagnosticCard key={asset.id} asset={asset} index={i} />
            ))
          ) : (
            <div className="py-20 text-center text-muted-foreground text-sm">
              No creative assets in this campaign yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
