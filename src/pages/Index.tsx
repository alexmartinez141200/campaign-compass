import { useState, useMemo } from "react";
import { FolderOpen, ArrowLeft } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import CampaignHeader from "@/components/CampaignHeader";
import CampaignList from "@/components/CampaignList";
import DiagnosticCard from "@/components/DiagnosticCard";
import FilterBar from "@/components/FilterBar";
import { campaigns } from "@/data/mockData";

type AssetFilter = "all" | "video" | "image" | "carousel";
type SortOption = "roas" | "spend" | "delta";
type CampaignTab = "active" | "archived";

const Index = () => {
  const [campaignTab, setCampaignTab] = useState<CampaignTab>("active");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [sort, setSort] = useState<SortOption>("roas");

  const visibleCampaigns = campaigns.filter((c) =>
    campaignTab === "active" ? c.status === "active" : c.status !== "active"
  );

  const selectedCampaign = selectedCampaignId
    ? campaigns.find((c) => c.id === selectedCampaignId)!
    : null;

  const filteredAssets = useMemo(() => {
    if (!selectedCampaign) return [];
    let assets = selectedCampaign.assets;
    if (filter !== "all") assets = assets.filter((a) => a.type === filter);

    return [...assets].sort((a, b) => {
      if (sort === "roas") return b.totalRoas - a.totalRoas;
      if (sort === "spend") return b.totalSpend - a.totalSpend;
      const deltaA = Math.max(...a.channels.map((c) => c.roas)) - Math.min(...a.channels.map((c) => c.roas));
      const deltaB = Math.max(...b.channels.map((c) => c.roas)) - Math.min(...b.channels.map((c) => c.roas));
      return deltaB - deltaA;
    });
  }, [selectedCampaign, filter, sort]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <main className="ml-[232px]">
        {/* Page header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          {selectedCampaign ? (
            <>
              <button
                onClick={() => setSelectedCampaignId(null)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Campaigns
              </button>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-[13px] font-medium text-foreground">{selectedCampaign.name}</span>
            </>
          ) : (
            <>
              <FolderOpen className="w-6 h-6 text-muted-foreground/40" strokeWidth={1.5} />
              <h1 className="text-lg font-semibold text-foreground">Campaigns</h1>
            </>
          )}
        </div>

        <div className="p-6">
          {!selectedCampaign ? (
            <>
              {/* Active / Archived tabs */}
              <div className="flex gap-1 border-b border-border mb-5">
                {(["active", "archived"] as CampaignTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCampaignTab(tab)}
                    className={`px-4 py-2.5 text-[13px] font-medium transition-colors duration-100 border-b-2 -mb-px ${
                      campaignTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "active" ? "Active Campaigns" : "Archived"}
                  </button>
                ))}
              </div>

              {/* Campaign list */}
              <CampaignList
                campaigns={visibleCampaigns}
                onSelect={(id) => setSelectedCampaignId(id)}
              />
            </>
          ) : (
            <>
              {/* Campaign detail view */}
              <CampaignHeader campaign={selectedCampaign} />

              <div className="mt-5 mb-4">
                <FilterBar filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />
              </div>

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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
