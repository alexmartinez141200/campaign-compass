import type { Channel } from "@/data/mockData";

type SortOption = "roas" | "spend";

interface FilterBarProps {
  selectedChannels: Channel[];
  sort: SortOption;
  onChannelsChange: (channels: Channel[]) => void;
  onSortChange: (s: SortOption) => void;
}

const channelTabs: { value: Channel | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google Ads" },
];

const sorts: { value: SortOption; label: string }[] = [
  { value: "roas", label: "ROAS" },
  { value: "spend", label: "Spend" },
];

const FilterBar = ({ selectedChannels, sort, onChannelsChange, onSortChange }: FilterBarProps) => {
  const activeTab = selectedChannels.length === 0 ? "all" : selectedChannels.length === 1 ? selectedChannels[0] : "all";

  const handleTab = (value: Channel | "all") => {
    if (value === "all") {
      onChannelsChange([]);
    } else {
      onChannelsChange([value]);
    }
  };

  return (
    <div className="flex items-center justify-between">
      {/* Channel tabs */}
      <div className="flex gap-1 border-b border-border">
        {channelTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTab(tab.value)}
            className={`px-4 py-2 text-[12px] font-medium transition-colors duration-100 border-b-2 -mb-px ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Sort by
        </span>
        <div className="flex gap-1">
          {sorts.map((s) => (
            <button
              key={s.value}
              onClick={() => onSortChange(s.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
                sort === s.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
