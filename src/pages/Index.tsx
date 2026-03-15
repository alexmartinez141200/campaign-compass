import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, ArrowLeft } from "lucide-react";
import type { Channel } from "@/data/mockData";
import AppSidebar from "@/components/AppSidebar";
import CampaignHeader from "@/components/CampaignHeader";
import CampaignList from "@/components/CampaignList";
import DiagnosticCard, { DiagnosticHeader } from "@/components/DiagnosticCard";
import AssetDetail from "@/components/AssetDetail";
import FilterBar from "@/components/FilterBar";
import { campaigns } from "@/data/mockData";

type SortOption = "roas" | "spend";
type CampaignTab = "active" | "archived";

const Index = () => {
  const navigate = useNavigate();
  const [campaignTab, setCampaignTab] = useState<CampaignTab>("active");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [sort, setSort] = useState<SortOption>("roas");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);

  const handleGetInsights = () => {
    const assets = filteredAssets.filter(a => selectedAssets.has(a.id));
    navigate("/insights", { state: { assets } });
  };

  const toggleAssetSelection = (id: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleCampaigns = campaigns.filter((c) =>
    campaignTab === "active" ? c.status === "active" : c.status !== "active"
  );

  const selectedCampaign = selectedCampaignId
    ? campaigns.find((c) => c.id === selectedCampaignId)!
    : null;

  const filteredAssets = useMemo(() => {
    if (!selectedCampaign) return [];
    let assets = selectedCampaign.assets;
    if (selectedChannels.length > 0) assets = assets.filter((a) => selectedChannels.includes(a.channel));

    return [...assets].sort((a, b) => {
      if (sort === "roas") return b.roas - a.roas;
      if (sort === "spend") return b.spend - a.spend;
      return 0;
    });
  }, [selectedCampaign, selectedChannels, sort]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <main className="ml-[232px]">
        {/* Page header */}
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          {selectedCampaign ? (
            <>
              <button
                onClick={() => { setSelectedCampaignId(null); setViewingAssetId(null); }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Campaigns
              </button>
              <span className="text-muted-foreground/40">/</span>
              <button
                onClick={() => setViewingAssetId(null)}
                className={`text-[13px] font-medium transition-colors ${viewingAssetId ? "text-muted-foreground hover:text-foreground" : "text-foreground"}`}
              >
                {selectedCampaign.name}
              </button>
              {viewingAssetId && (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-[13px] font-medium text-foreground">
                    {selectedCampaign.assets.find(a => a.id === viewingAssetId)?.name}
                  </span>
                </>
              )}
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
              {/* Annual budget overview */}
              <div className="flex justify-end mb-6">
                <div className="flex items-center gap-6 px-5 py-4 bg-surface rounded-lg border border-border shadow-card">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">2026 Budget</span>
                    <span className="text-base font-mono font-semibold text-foreground">$350,000</span>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Spent YTD</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-mono font-semibold text-foreground">
                        ${campaigns.filter(c => c.status === "active").reduce((s, c) => s + c.totalSpend, 0).toLocaleString()}
                      </span>
                      <span className="text-[11px] font-mono text-accent-teal">
                        {((campaigns.filter(c => c.status === "active").reduce((s, c) => s + c.totalSpend, 0) / 350000) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</span>
                    <span className="text-base font-mono font-semibold text-foreground">
                      ${(350000 - campaigns.filter(c => c.status === "active").reduce((s, c) => s + c.totalSpend, 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-24">
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(campaigns.filter(c => c.status === "active").reduce((s, c) => s + c.totalSpend, 0) / 350000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

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
          ) : viewingAssetId && selectedCampaign ? (
            <AssetDetail
              asset={selectedCampaign.assets.find(a => a.id === viewingAssetId)!}
              campaignAssets={selectedCampaign.assets}
              onBack={() => setViewingAssetId(null)}
            />
          ) : selectedCampaign ? (
            <>
              {/* Campaign detail view */}
              <CampaignHeader campaign={selectedCampaign} />

              <div className="mt-5 mb-4">
                <FilterBar selectedChannels={selectedChannels} sort={sort} selectedCount={selectedAssets.size} showInsights={selectedChannels.length > 0} onChannelsChange={(ch) => { setSelectedChannels(ch); setSelectedAssets(new Set()); }} onSortChange={setSort} onGetInsights={handleGetInsights} />
              </div>

              <div className="space-y-0.5">
                <DiagnosticHeader sort={sort} onSortChange={setSort} showCheckbox={selectedChannels.length > 0} />
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset, i) => (
                    <DiagnosticCard key={asset.id} asset={asset} index={i} rank={i} maxRoas={Math.max(...filteredAssets.map(a => a.roas))} selected={selectedAssets.has(asset.id)} showCheckbox={selectedChannels.length > 0} onSelectToggle={toggleAssetSelection} onClick={() => setViewingAssetId(asset.id)} />
                  ))
                ) : (
                  <div className="py-20 text-center text-muted-foreground text-sm">
                    No creative assets in this campaign yet.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Index;
