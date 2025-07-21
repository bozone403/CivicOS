import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CanadianCoatOfArms, CanadianMapleLeaf } from "@/components/CanadianCoatOfArms";
import civicOSLogo from "@assets/ChatGPT Image Jun 20, 2025, 05_42_18 PM_1750462997583.png";
import canadianCrest from "@/assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";
import { 
  Shield, 
  Vote, 
  Users, 
  FileText, 
  Globe,
  CheckCircle,
  ArrowRight,
  Flag,
  Scale,
  MapPin,
  Building,
  Search,
  Heart
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DonationPopup from "@/components/DonationPopup";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PlatformNotice from "@/components/PlatformNotice";
import { LuxuryCard } from "@/components/ui/luxury-card";

export default function Landing() {
  const { toast } = useToast();
  const [showNotice, setShowNotice] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!sessionStorage.getItem('civicos-platform-notice-shown')) {
      setShowNotice(true);
      sessionStorage.setItem('civicos-platform-notice-shown', 'true');
    }
  }, []);

  const handleSupportClick = () => {
    setShowNotice(false);
    setShowDonation(true);
  };

  return (
    <>
      {showNotice && <PlatformNotice onClose={() => setShowNotice(false)} onSupport={handleSupportClick} />}
      {showDonation && <DonationPopup isOpen={showDonation} onClose={() => setShowDonation(false)} onSuccess={() => {}} />}
      <div className="min-h-screen bg-gradient-to-br from-civic-blue/10 via-civic-gold/10 to-civic-purple/10 dark:from-slate-900 dark:via-civic-blue/10 dark:to-slate-900 fade-in-up">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <section className="text-center mb-16 fade-in-up">
            <h1 className="text-5xl sm:text-6xl font-black text-civic-blue dark:text-civic-gold mb-6 tracking-tight text-luxury drop-shadow-lg">Empowering Transparent Democracy</h1>
            <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 max-w-3xl mx-auto mb-8">CivicOS is your sovereign intelligence interface for government accountability, legislative transparency, and citizen empowerment.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button className="bg-civic-gold text-white hover:bg-civic-blue font-bold px-8 py-4 rounded-xl shadow-lg text-lg transition-all duration-200">Join the Movement</Button>
              <Button variant="outline" className="border-civic-gold text-civic-gold hover:bg-civic-gold/10 font-bold px-8 py-4 rounded-xl shadow-lg text-lg transition-all duration-200">Explore Features</Button>
            </div>
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in-up">
            {/* Example luxury cards for features */}
            <LuxuryCard title="Real-Time Legislative Tracking" description="Monitor bills, votes, and government actions as they happen." variant="pulse" interactive>
              <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-green mr-2" />Live bill updates</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-green mr-2" />Voting records</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-green mr-2" />Transparency analytics</li>
              </ul>
            </LuxuryCard>
            <LuxuryCard title="CivicSocial Feed" description="Engage with a vibrant civic community, share insights, and drive change." variant="gold" interactive>
              <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-gold mr-2" />Post, comment, react</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-gold mr-2" />Verified identity</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-gold mr-2" />Modern, accessible UI</li>
              </ul>
            </LuxuryCard>
            <LuxuryCard title="Media & Data Transparency" description="Analyze news, track funding, and expose bias with premium tools." variant="default" interactive>
              <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-blue mr-2" />Credibility analysis</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-blue mr-2" />Outlet comparison</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-civic-blue mr-2" />Data-driven insights</li>
              </ul>
            </LuxuryCard>
          </section>
        </main>
        {/* Official Footer */}
        <footer className="bg-gray-100 border-t-4 border-red-600 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <CanadianCoatOfArms size="sm" />
                  <span className="font-bold text-lg text-gray-900">CivicOS</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Independent Canadian Government Accountability Platform<br />
                  Plateforme Indépendante de Responsabilité Gouvernementale Canadienne
                </p>
                <p className="text-yellow-600 text-xs font-medium mt-2">
                  * Not affiliated with the Government of Canada<br />
                  * Non affilié au gouvernement du Canada
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">Government Levels</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Federal Parliament</li>
                  <li>Provincial Legislatures</li>
                  <li>Municipal Councils</li>
                  <li>Electoral Information</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">Resources</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="/contact" className="hover:text-red-600 transition-colors cursor-pointer">Contact Information</a></li>
                  <li><a href="/privacy" className="hover:text-red-600 transition-colors cursor-pointer">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-red-600 transition-colors cursor-pointer">Terms of Service</a></li>
                  <li><a href="/accessibility" className="hover:text-red-600 transition-colors cursor-pointer">Accessibility</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">Contact</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>CivicOS Platform</p>
                  <p>Digital Government Services</p>
                  <p>Built by Jordan Kenneth Boisclair</p>
                  <p>© 2025 All rights reserved</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-8 bg-gray-300" />
            
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-red-600" />
                  <span>Government of Canada</span>
                </span>
                <span>|</span>
                <span className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-red-600" />
                  <span>Gouvernement du Canada</span>
                </span>
              </div>
              <div className="text-xs">
                © 2025 CivicOS. Built by Jordan Kenneth Boisclair. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}