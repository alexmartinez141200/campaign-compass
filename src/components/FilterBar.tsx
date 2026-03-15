import { useState } from "react";

type AssetFilter = "all" | "video" | "image" | "carousel";
type SortOption = "roas" | "spend" | "delta";

interface FilterBarProps {
  filter: AssetFilter;
  sort: SortOption;
  onFilterChange: (f: AssetFilter) => void;
  onSortChange: (s: SortOption) => void;
}

const filters: { value: AssetFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "carousel", label: "Carousel" },
];

const sorts: { value: SortOption; label: string }[] = [
  { value: "roas", label: "ROAS" },
  { value: "spend", label: "Spend" },
  { value: "delta", label: "Perf Delta" },
];

const FilterBar = ({ filter, sort, onFilterChange, onSortChange }: FilterBarProps) => {
  return (
    <div className="flex items-center justify-between">
      {/* Type filter */}
      <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
              filter === f.value
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
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
