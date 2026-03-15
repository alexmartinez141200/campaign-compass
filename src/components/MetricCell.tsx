interface MetricCellProps {
  label: string;
  value: string;
  delta?: string;
}

const MetricCell = ({ label, value, delta }: MetricCellProps) => {
  const isPositive = delta && !delta.startsWith("-");
  
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-mono font-medium text-foreground">{value}</span>
        {delta && (
          <span className={`text-[11px] font-mono font-medium ${isPositive ? "text-accent-teal" : "text-accent-rose"}`}>
            {isPositive ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCell;
