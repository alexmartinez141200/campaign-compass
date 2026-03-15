import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, ArrowLeft, Search } from "lucide-react";
import type { Channel } from "@/data/mockData";
import AppSidebar from "@/components/AppSidebar";
import CampaignHeader from "@/components/CampaignHeader";
import CampaignList from "@/components/CampaignList";
import DiagnosticCard, { DiagnosticHeader } from "@/components/DiagnosticCard";
import AssetDetail from "@/components/AssetDetail";
import FilterBar from "@/components/FilterBar";
import { campaigns } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";

type SortOption = "roas" | "spend";
type TopTab = "campaigns" | "creatives";
type CampaignFilter = "active" | "past" | "all";
type CreativeSortKey = "name" | "roas" | "spend" | "conversions";

const Index = () => {
  const navigate = useNavigate();
  const [topTab, setTopTab] = useState<TopTab>("campaigns");
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [sort, setSort] = useState<SortOption>("roas");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);
  const [creativeSortKey, setCreativeSortKey] = useState<CreativeSortKey>("roas");
  const [creativeFilterChannel, setCreativeFilterChannel] = useState<Channel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const visibleCampaigns = campaigns.filter((c) => {
    const matchesFilter = campaignFilter === "all" ? true : campaignFilter === "active" ? c.status === "active" : c.status !== "active";
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  // All creatives flat list
  const allCreativeAssets = useMemo(() => {
    const list: { campaignName: string; asset: (typeof campaigns)[0]["assets"][0] }[] = [];
    for (const c of campaigns) {
      for (const a of c.assets) list.push({ campaignName: c.name, asset: a });
    }
    return list;
  }, []);

  const filteredCreatives = useMemo(() => {
    let list = allCreativeAssets;
    if (creativeFilterChannel !== "all") list = list.filter(r => r.asset.channel === creativeFilterChannel);
    if (searchQuery) list = list.filter(r => r.asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.campaignName.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...list].sort((a, b) => {
      if (creativeSortKey === "name") return a.asset.name.localeCompare(b.asset.name);
      if (creativeSortKey === "roas") return b.asset.roas - a.asset.roas;
      if (creativeSortKey === "spend") return b.asset.spend - a.asset.spend;
      return b.asset.conversions - a.asset.conversions;
    });
  }, [allCreativeAssets, creativeFilterChannel, creativeSortKey]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <main className="ml-[232px]">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {selectedCampaign ? (
              <>
                <button
                  onClick={() => { if (viewingAssetId) { setViewingAssetId(null); } else { setSelectedCampaignId(null); setViewingAssetId(null); } }}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setSelectedCampaignId(null); setViewingAssetId(null); }}
                  className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Campaigns
                </button>
                <span className="text-muted-foreground/30 text-xs">›</span>
                <button
                  onClick={() => setViewingAssetId(null)}
                  className={`text-[13px] font-medium transition-colors ${viewingAssetId ? "text-muted-foreground hover:text-foreground" : "text-foreground"}`}
                >
                  Campaign Profile
                </button>
                {viewingAssetId && (
                  <>
                    <span className="text-muted-foreground/30 text-xs">›</span>
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

          {/* Search */}
          {!selectedCampaign && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search campaigns or assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[13px] bg-muted/30 border border-border rounded-md w-64 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
              />
            </div>
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

              {/* Top tabs */}
              <div className="flex gap-1 border-b border-border mb-5">
                {([
                  { key: "campaigns" as TopTab, label: "All Campaigns" },
                  { key: "creatives" as TopTab, label: "All Creative Assets" },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTopTab(key)}
                    className={`px-4 py-2.5 text-[13px] font-medium transition-colors duration-100 border-b-2 -mb-px ${
                      topTab === key
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {topTab === "campaigns" ? (
                <>
                  {/* Sub-filters */}
                  <div className="flex items-center gap-2 mb-4">
                    {([
                      { key: "all" as CampaignFilter, label: "All" },
                      { key: "active" as CampaignFilter, label: "Active" },
                      { key: "past" as CampaignFilter, label: "Past" },
                    ]).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setCampaignFilter(key)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                          campaignFilter === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <CampaignList
                    campaigns={visibleCampaigns}
                    onSelect={(id) => setSelectedCampaignId(id)}
                  />
                </>
              ) : (
                <>
                  {/* Channel filters */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setCreativeFilterChannel("all")}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${creativeFilterChannel === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      All
                    </button>
                    {(["meta", "tiktok", "google"] as Channel[]).map(ch => {
                      const cfg = channelConfig[ch];
                      if (!cfg) return null;
                      return (
                        <button
                          key={ch}
                          onClick={() => setCreativeFilterChannel(ch)}
                          className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${creativeFilterChannel === ch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Creatives list — same style as campaign detail */}
                  <div className="space-y-0.5">
                    <DiagnosticHeader sort={sort} onSortChange={setSort} showCheckbox={false} />
                    {filteredCreatives.map(({ asset, campaignName }, i) => (
                      <DiagnosticCard
                        key={asset.id}
                        asset={asset}
                        index={i}
                        rank={i}
                        maxRoas={Math.max(...filteredCreatives.map(r => r.asset.roas))}
                        selected={false}
                        showCheckbox={false}
                        campaignName={campaignName}
                        onSelectToggle={() => {}}
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                </>
              )}
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
                    <DiagnosticCard key={asset.id} asset={asset} index={i} rank={i} maxRoas={Math.max(...filteredAssets.map(a => a.roas))} selected={selectedAssets.has(asset.id)} showCheckbox={selectedChannels.length > 0} campaignName={selectedCampaign.name} onSelectToggle={toggleAssetSelection} onClick={() => setViewingAssetId(asset.id)} />
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
