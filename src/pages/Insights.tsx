import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { CreativeAsset } from "@/data/mockData";

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = (location.state?.assets || []) as CreativeAsset[];

  return (
    <div className="min-h-screen bg-background p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[13px] font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaign
      </button>

      <h1 className="text-lg font-semibold text-foreground mb-4">Creative Insights</h1>

      {assets.length === 0 ? (
        <p className="text-muted-foreground text-sm">No assets selected for comparison.</p>
      ) : (
        <div className="text-sm text-muted-foreground">
          <p>Comparing {assets.length} creative assets:</p>
          <ul className="mt-2 space-y-1">
            {assets.map((a) => (
              <li key={a.id} className="font-mono text-foreground">{a.name} ({a.id})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Insights;
