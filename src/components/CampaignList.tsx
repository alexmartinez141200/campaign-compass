import { motion } from "framer-motion";
import type { Campaign } from "@/data/mockData";
import { ChevronRight } from "lucide-react";

interface CampaignListProps {
  campaigns: Campaign[];
  onSelect: (id: string) => void;
}

const CampaignList = ({ campaigns, onSelect }: CampaignListProps) => {
  if (campaigns.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        No campaigns found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign, i) => {
        // Use first asset thumbnail as campaign cover
        const coverImage = campaign.assets.length > 0 ? campaign.assets[0].thumbnail : null;

        return (
          <motion.button
            key={campaign.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            onClick={() => onSelect(campaign.id)}
            className="w-full flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors duration-100 text-left group"
          >
            {/* Campaign thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
              {coverImage && (
                <img src={coverImage} alt={campaign.name} className="object-cover w-full h-full" />
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-foreground">{campaign.name}</h3>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
};

export default CampaignList;
