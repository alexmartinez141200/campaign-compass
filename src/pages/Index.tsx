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
import { channelConfig } from "@/components/ChannelIcon";

type SortOption = "roas" | "spend";
type TopTab = "campaigns" | "creatives";
type CampaignFilter = "active" | "past" | "all";
type CreativeSortKey = "name" | "roas" | "spend" | "conversions";

const Index = () => {
  const navigate = useNavigate();
  const [campaignTab, setCampaignTab] = useState<CampaignTab>("active");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [sort, setSort] = useState<SortOption>("roas");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);
  const [creativeSortKey, setCreativeSortKey] = useState<CreativeSortKey>("roas");
  const [creativeFilterChannel, setCreativeFilterChannel] = useState<Channel | "all">("all");

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
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          {selectedCampaign ? (
            <>
              <button
                onClick={() => { setSelectedCampaignId(null); setViewingAssetId(null); }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium"
              >
                Campaigns
              </button>
              <span className="text-muted-foreground/40">{'>'}</span>
              <button
                onClick={() => setViewingAssetId(null)}
                className={`text-[13px] font-medium transition-colors ${viewingAssetId ? "text-muted-foreground hover:text-foreground" : "text-foreground"}`}
              >
                Campaign Profile
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

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border mb-5">
                {([
                  { key: "active" as CampaignTab, label: "Active Campaigns" },
                  { key: "archived" as CampaignTab, label: "Past Campaigns" },
                  { key: "creatives" as CampaignTab, label: "All Creative Assets" },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setCampaignTab(key)}
                    className={`px-4 py-2.5 text-[13px] font-medium transition-colors duration-100 border-b-2 -mb-px ${
                      campaignTab === key
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {campaignTab !== "creatives" ? (
                <CampaignList
                  campaigns={visibleCampaigns}
                  onSelect={(id) => setSelectedCampaignId(id)}
                />
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

                  {/* Creatives table */}
                  <div className="rounded-lg border border-border overflow-hidden shadow-[var(--shadow-card)]">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left cursor-pointer hover:text-foreground transition-colors" style={{ minWidth: 200 }} onClick={() => setCreativeSortKey("name")}>Asset</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left">Campaign</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left">Channel</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left">Type</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => setCreativeSortKey("spend")}>Spend</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => setCreativeSortKey("roas")}>ROAS</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => setCreativeSortKey("conversions")}>Conv.</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right">CTR</th>
                          <th className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right">CPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCreatives.map(({ campaignName, asset }) => (
                          <tr key={asset.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors cursor-pointer">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={asset.thumbnail} alt={asset.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-border/40" />
                                <div className="min-w-0">
                                  <p className="text-[12px] font-semibold text-foreground truncate">{asset.name}</p>
                                  <p className="text-[10px] font-mono text-muted-foreground/50">{asset.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-muted-foreground">{campaignName}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${channelConfig[asset.channel]?.bgClass}`}>
                                {channelConfig[asset.channel]?.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-muted-foreground capitalize">{asset.type}</td>
                            <td className="px-4 py-3 text-right text-[12px] font-mono text-foreground">${asset.spend.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-[12px] font-mono font-semibold text-accent">{asset.roas.toFixed(1)}x</td>
                            <td className="px-4 py-3 text-right text-[12px] font-mono text-foreground">{asset.conversions.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-[12px] font-mono text-foreground">{asset.ctr.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-right text-[12px] font-mono text-foreground">${asset.costPerResult.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
