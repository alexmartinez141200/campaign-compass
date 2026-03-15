import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Channel } from "@/data/mockData";

type ChannelFilter = "all" | Channel;
type SortOption = "roas" | "spend";

interface FilterBarProps {
  channelFilter: ChannelFilter;
  sort: SortOption;
  onChannelFilterChange: (f: ChannelFilter) => void;
  onSortChange: (s: SortOption) => void;
}

const channels: { value: ChannelFilter; label: string }[] = [
  { value: "all", label: "All Channels" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google Ads" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "amazon", label: "Amazon Ads" },
];

const sorts: { value: SortOption; label: string }[] = [
  { value: "roas", label: "ROAS" },
  { value: "spend", label: "Spend" },
];

const FilterBar = ({ channelFilter, sort, onChannelFilterChange, onSortChange }: FilterBarProps) => {
  return (
    <div className="flex items-center justify-between">
      {/* Channel dropdown */}
      <Select value={channelFilter} onValueChange={(v) => onChannelFilterChange(v as ChannelFilter)}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="All Channels" />
        </SelectTrigger>
        <SelectContent>
          {channels.map((c) => (
            <SelectItem key={c.value} value={c.value} className="text-xs">
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
