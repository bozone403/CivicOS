import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Vote, 
  Eye, 
  Shield 
} from "lucide-react";
import PoliticiansWidget from "@/components/widgets/PoliticiansWidget";
import BillsVotingWidget from "@/components/widgets/BillsVotingWidget";
import PetitionsWidget from "@/components/widgets/PetitionsWidget";
import { NewsAnalysisWidget } from "@/components/widgets/NewsAnalysisWidget";
import { LegalSystemWidget } from "@/components/widgets/LegalSystemWidget";
import ComprehensiveNewsWidget from "@/components/widgets/ComprehensiveNewsWidget";
import { PrimeMinisterIntelligence } from "@/components/widgets/PrimeMinisterIntelligence";

export default function DashboardDemo() {
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="flex items-center justify-center space-x-1 lg:space-x-2 text-xs lg:text-sm p-2 lg:p-3">
            <Activity className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm p-2 md:p-3">
            <Vote className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Engagement</span>
            <span className="sm:hidden">Vote</span>
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm p-2 md:p-3">
            <Eye className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Intelligence</span>
            <span className="sm:hidden">Intel</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm p-2 md:p-3">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Legal</span>
            <span className="sm:hidden">Law</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <PoliticiansWidget />
            <BillsVotingWidget />
            <PetitionsWidget />
            <NewsAnalysisWidget />
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <BillsVotingWidget />
            <PetitionsWidget />
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <PrimeMinisterIntelligence />
            <ComprehensiveNewsWidget />
          </div>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <LegalSystemWidget />
            <NewsAnalysisWidget />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 