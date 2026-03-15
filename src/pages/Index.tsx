import { useState, useMemo } from "react";
import { FolderOpen } from "lucide-react";
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
      const deltaA = Math.max(...a.channels.map((c) => c.roas)) - Math.min(...a.channels.map((c) => c.roas));
      const deltaB = Math.max(...b.channels.map((c) => c.roas)) - Math.min(...b.channels.map((c) => c.roas));
      return deltaB - deltaA;
    });
  }, [campaign, filter, sort]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <main className="ml-[232px]">
        {/* Page header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-muted-foreground/40" strokeWidth={1.5} />
          <h1 className="text-lg font-semibold text-foreground">Campaigns</h1>
        </div>

        <div className="p-6">
        {/* Campaign tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCampaignId(c.id)}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors duration-100 border-b-2 -mb-px ${
                c.id === activeCampaignId
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Header */}
        <CampaignHeader campaign={campaign} />

        {/* Filters */}
        <div className="mt-5 mb-4">
          <FilterBar filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />
        </div>

        {/* Diagnostic rows */}
        <div className="space-y-2.5">
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
