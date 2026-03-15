import type { Channel } from "@/data/mockData";

type SortOption = "roas" | "spend";

interface FilterBarProps {
  selectedChannels: Channel[];
  sort: SortOption;
  selectedCount: number;
  showInsights: boolean;
  onChannelsChange: (channels: Channel[]) => void;
  onSortChange: (s: SortOption) => void;
  onGetInsights?: () => void;
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

const FilterBar = ({ selectedChannels, sort, selectedCount, showInsights, onChannelsChange, onSortChange }: FilterBarProps) => {
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

      {/* Get Insights */}
      {showInsights && (
        <button
          disabled={selectedCount < 2}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            selectedCount >= 2
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Get Insights
        </button>
      )}
    </div>
  );
};

export default FilterBar;
