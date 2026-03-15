import { motion } from "framer-motion";

interface PerformanceBarProps {
  percentage: number; // 0-100
  variant: "teal" | "rose" | "blue";
}

const variantClasses: Record<string, string> = {
  teal: "bg-accent-teal",
  rose: "bg-accent-rose",
  blue: "bg-primary",
};

const PerformanceBar = ({ percentage, variant }: PerformanceBarProps) => {
  return (
    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-1.5">
      <motion.div
        className={`h-full rounded-full ${variantClasses[variant]}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </div>
  );
};

export default PerformanceBar;
