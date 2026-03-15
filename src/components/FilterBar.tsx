import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Channel } from "@/data/mockData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type SortOption = "roas" | "spend";

interface FilterBarProps {
  selectedChannels: Channel[];
  sort: SortOption;
  onChannelsChange: (channels: Channel[]) => void;
  onSortChange: (s: SortOption) => void;
}

const channelOptions: { value: Channel; label: string }[] = [
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

const FilterBar = ({ selectedChannels, sort, onChannelsChange, onSortChange }: FilterBarProps) => {
  const allSelected = selectedChannels.length === 0;

  const toggleChannel = (ch: Channel) => {
    if (selectedChannels.includes(ch)) {
      onChannelsChange(selectedChannels.filter((c) => c !== ch));
    } else {
      onChannelsChange([...selectedChannels, ch]);
    }
  };

  const selectAll = () => onChannelsChange([]);

  const label = allSelected
    ? "All Channels"
    : selectedChannels.length === 1
      ? channelOptions.find((c) => c.value === selectedChannels[0])!.label
      : `${selectedChannels.length} Channels`;

  return (
    <div className="flex items-center justify-between">
      {/* Channel multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium border border-border rounded-md bg-surface hover:bg-muted/40 transition-colors">
            {label}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-1.5" align="start">
          {/* All option */}
          <button
            onClick={selectAll}
            className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md transition-colors ${
              allSelected ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {allSelected && <Check className="w-3 h-3" />}
            <span className={allSelected ? "" : "ml-5"}>All Channels</span>
          </button>

          <div className="h-px bg-border my-1" />

          {channelOptions.map((ch) => {
            const checked = selectedChannels.includes(ch.value);
            return (
              <button
                key={ch.value}
                onClick={() => toggleChannel(ch.value)}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-foreground hover:bg-muted/50 transition-colors"
              >
                <Checkbox checked={checked} className="h-3.5 w-3.5 pointer-events-none" />
                {ch.label}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

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
