import type { Channel } from "@/data/mockData";

const channelConfig: Record<Channel, { label: string; color: string; bgClass: string }> = {
  meta: { label: "Meta", color: "hsl(217, 91%, 60%)", bgClass: "bg-primary/10 text-primary" },
  tiktok: { label: "TikTok", color: "hsl(174, 100%, 33%)", bgClass: "bg-accent/10 text-accent-teal" },
  google: { label: "Google", color: "hsl(45, 93%, 47%)", bgClass: "bg-yellow-100 text-yellow-700" },
  linkedin: { label: "LinkedIn", color: "hsl(210, 80%, 45%)", bgClass: "bg-blue-100 text-blue-700" },
  amazon: { label: "Amazon", color: "hsl(30, 100%, 50%)", bgClass: "bg-orange-100 text-orange-700" },
};

interface ChannelIconProps {
  channel: Channel;
  size?: "sm" | "md";
}

const ChannelIcon = ({ channel, size = "sm" }: ChannelIconProps) => {
  const config = channelConfig[channel];
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  
  return (
    <span className={`inline-flex items-center rounded font-bold uppercase tracking-wider ${sizeClass} ${config.bgClass}`}>
      {config.label}
    </span>
  );
};

export default ChannelIcon;
export { channelConfig };
