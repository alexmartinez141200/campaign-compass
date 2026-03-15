import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { campaigns } from "@/data/mockData";
import type { Channel } from "@/data/mockData";
import { channelConfig } from "@/components/ChannelIcon";

type SortKey = "name" | "roas" | "spend" | "conversions";

const Creatives = () => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("roas");
  const [filterChannel, setFilterChannel] = useState<Channel | "all">("all");

  const allAssets = useMemo(() => {
    const assets: { campaignName: string; campaignId: string; asset: (typeof campaigns)[0]["assets"][0] }[] = [];
    for (const c of campaigns) {
      for (const a of c.assets) {
        assets.push({ campaignName: c.name, campaignId: c.id, asset: a });
      }
    }
    return assets;
  }, []);

  const filtered = useMemo(() => {
    let list = allAssets;
    if (filterChannel !== "all") list = list.filter(r => r.asset.channel === filterChannel);
    return [...list].sort((a, b) => {
      if (sortKey === "name") return a.asset.name.localeCompare(b.asset.name);
      if (sortKey === "roas") return b.asset.roas - a.asset.roas;
      if (sortKey === "spend") return b.asset.spend - a.asset.spend;
      return b.asset.conversions - a.asset.conversions;
    });
  }, [allAssets, filterChannel, sortKey]);

  const channels: Channel[] = ["meta", "tiktok", "google", "linkedin", "amazon"];

  const thClass = "text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-left cursor-pointer hover:text-foreground transition-colors";
  const thClassR = "text-[9px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-4 py-2.5 text-right cursor-pointer hover:text-foreground transition-colors";

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-[232px]">
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <Box className="w-5 h-5 text-muted-foreground/40" strokeWidth={1.5} />
          <h1 className="text-lg font-semibold text-foreground">All Creative Assets</h1>
          <span className="text-[11px] text-muted-foreground font-mono ml-2">{filtered.length} assets</span>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setFilterChannel("all")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${filterChannel === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              All
            </button>
            {channels.map(ch => {
              const cfg = channelConfig[ch];
              if (!cfg) return null;
              const hasAssets = allAssets.some(r => r.asset.channel === ch);
              if (!hasAssets) return null;
              return (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(ch)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${filterChannel === ch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden shadow-[var(--shadow-card)]">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className={thClass} style={{ minWidth: 200 }} onClick={() => setSortKey("name")}>Asset</th>
                  <th className={thClass}>Campaign</th>
                  <th className={thClass}>Channel</th>
                  <th className={thClass}>Type</th>
                  <th className={thClassR} onClick={() => setSortKey("spend")}>Spend</th>
                  <th className={thClassR} onClick={() => setSortKey("roas")}>ROAS</th>
                  <th className={thClassR} onClick={() => setSortKey("conversions")}>Conv.</th>
                  <th className={thClassR}>CTR</th>
                  <th className={thClassR}>CPA</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ campaignName, asset }) => (
                  <tr
                    key={asset.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => navigate(`/?campaign=${asset.id}`)}
                  >
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
        </div>
      </main>
    </div>
  );
};

export default Creatives;
