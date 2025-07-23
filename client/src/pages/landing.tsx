import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CanadianCoatOfArms } from "@/components/CanadianCoatOfArms";
import { LanguageToggle } from "@/components/LanguageToggle";
import canadianCrest from "@/assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  Search
} from "lucide-react";

// Bilingual content
const content = {
  en: {
    hero: {
      title: "Empowering Canadian Democracy",
      subtitle: "Transparent Government Accountability Platform",
      description: "Access real-time government data, track legislation, monitor politicians, and participate in civic engagement. Your voice matters in Canadian democracy.",
      cta: "Get Started",
      login: "Login"
    },
    features: {
      title: "Platform Features",
      subtitle: "Everything you need for civic engagement",
      voting: {
        title: "Voting Records",
        description: "Track how your representatives vote on important legislation"
      },
      politicians: {
        title: "Politician Profiles",
        description: "Comprehensive profiles of Canadian politicians and their activities"
      },
      bills: {
        title: "Bill Tracking",
        description: "Monitor legislation from introduction to final vote"
      },
      news: {
        title: "Civic News",
        description: "Stay informed with curated political and government news"
      },
      petitions: {
        title: "Petitions",
        description: "Create and sign petitions for change"
      },
      ai: {
        title: "AI Assistant",
        description: "Get instant answers about government processes and policies"
      }
    },
    manifesto: {
      title: "CivicOS Manifesto",
      subtitle: "Our commitment to digital democracy and civic engagement",
      mission: {
        title: "Our Mission",
        content: "CivicOS is dedicated to empowering Canadian citizens through transparent, accessible, and authentic government accountability. We believe in the power of informed civic engagement to strengthen our democracy."
      },
      principles: {
        title: "Core Principles",
        transparency: "All government data and processes should be accessible to citizens",
        accountability: "Elected officials must be held responsible for their actions",
        authenticity: "Information must be verified and sourced from official channels",
        engagement: "Citizens have the right and responsibility to participate in democracy"
      },
      rights: {
        title: "Your Rights & Responsibilities",
        content: "As a user of CivicOS, you have the right to access government information, participate in civic discussions, and hold elected officials accountable. You also have the responsibility to engage respectfully and factually."
      },
      privacy: {
        title: "Privacy & Security",
        content: "Your personal information is protected. We use government-grade security measures and never share your data with third parties. Your identity verification is used solely for platform integrity."
      },
      agree: "I Agree",
      disagree: "I Disagree"
    },
    footer: {
      tagline: "Independent Canadian Government Accountability Platform",
      disclaimer: "Not affiliated with the Government of Canada"
    }
  },
  fr: {
    hero: {
      title: "Renforcer la Démocratie Canadienne",
      subtitle: "Plateforme de Responsabilité Gouvernementale Transparente",
      description: "Accédez aux données gouvernementales en temps réel, suivez la législation, surveillez les politiciens et participez à l'engagement civique. Votre voix compte dans la démocratie canadienne.",
      cta: "Commencer",
      login: "Connexion"
    },
    features: {
      title: "Fonctionnalités de la Plateforme",
      subtitle: "Tout ce dont vous avez besoin pour l'engagement civique",
      voting: {
        title: "Dossiers de Vote",
        description: "Suivez comment vos représentants votent sur les législations importantes"
      },
      politicians: {
        title: "Profils des Politiciens",
        description: "Profils complets des politiciens canadiens et de leurs activités"
      },
      bills: {
        title: "Suivi des Projets de Loi",
        description: "Surveillez la législation de l'introduction au vote final"
      },
      news: {
        title: "Actualités Civiques",
        description: "Restez informé avec des actualités politiques et gouvernementales sélectionnées"
      },
      petitions: {
        title: "Pétitions",
        description: "Créez et signez des pétitions pour le changement"
      },
      ai: {
        title: "Assistant IA",
        description: "Obtenez des réponses instantanées sur les processus et politiques gouvernementaux"
      }
    },
    manifesto: {
      title: "Manifeste CivicOS",
      subtitle: "Notre engagement envers la démocratie numérique et l'engagement civique",
      mission: {
        title: "Notre Mission",
        content: "CivicOS se consacre à autonomiser les citoyens canadiens grâce à une responsabilité gouvernementale transparente, accessible et authentique. Nous croyons au pouvoir de l'engagement civique informé pour renforcer notre démocratie."
      },
      principles: {
        title: "Principes Fondamentaux",
        transparency: "Toutes les données et processus gouvernementaux doivent être accessibles aux citoyens",
        accountability: "Les élus doivent être tenus responsables de leurs actions",
        authenticity: "L'information doit être vérifiée et provenir de sources officielles",
        engagement: "Les citoyens ont le droit et la responsabilité de participer à la démocratie"
      },
      rights: {
        title: "Vos Droits et Responsabilités",
        content: "En tant qu'utilisateur de CivicOS, vous avez le droit d'accéder aux informations gouvernementales, de participer aux discussions civiques et de tenir les élus responsables. Vous avez aussi la responsabilité de vous engager respectueusement et factuellement."
      },
      privacy: {
        title: "Confidentialité et Sécurité",
        content: "Vos informations personnelles sont protégées. Nous utilisons des mesures de sécurité de niveau gouvernemental et ne partageons jamais vos données avec des tiers. Votre vérification d'identité est utilisée uniquement pour l'intégrité de la plateforme."
      },
      agree: "J'Accepte",
      disagree: "Je Refuse"
    },
    footer: {
      tagline: "Plateforme Indépendante de Responsabilité Gouvernementale Canadienne",
      disclaimer: "Non affilié au gouvernement du Canada"
    }
  }
};

export default function Landing() {
  const [showManifesto, setShowManifesto] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [location, setLocation] = useLocation();

  const t = content[language];

  useEffect(() => {
    // Check if user has already agreed to manifesto
    const hasAgreed = localStorage.getItem('civicos-manifesto-agreed');
    if (!hasAgreed) {
      // Show manifesto after a short delay
      const timer = setTimeout(() => {
        setShowManifesto(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAgreeToManifesto = () => {
    localStorage.setItem('civicos-manifesto-agreed', 'true');
    setShowManifesto(false);
  };

  const handleLoginClick = () => {
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Language Toggle */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CivicOS</h1>
                <p className="text-xs text-gray-600">{t.footer.tagline}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleLoginClick}>
                {t.hero.login}
              </Button>
              <LanguageToggle 
                currentLanguage={language}
                onLanguageChange={setLanguage}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Manifesto Dialog */}
      <Dialog open={showManifesto} onOpenChange={setShowManifesto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">{t.manifesto.title}</DialogTitle>
            <DialogDescription className="text-center">
              {t.manifesto.subtitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">{t.manifesto.mission.title}</h3>
              <p className="text-sm leading-relaxed">
                {t.manifesto.mission.content}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">{t.manifesto.principles.title}</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Transparency:</strong> {t.manifesto.principles.transparency}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Accountability:</strong> {t.manifesto.principles.accountability}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Authenticity:</strong> {t.manifesto.principles.authenticity}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Engagement:</strong> {t.manifesto.principles.engagement}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">{t.manifesto.rights.title}</h3>
              <p className="text-sm leading-relaxed">
                {t.manifesto.rights.content}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-blue-900">{t.manifesto.privacy.title}</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                {t.manifesto.privacy.content}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 pt-4">
            <Button onClick={handleAgreeToManifesto} className="bg-red-600 hover:bg-red-700">
              {t.manifesto.agree}
            </Button>
            <Button variant="outline" onClick={() => setShowManifesto(false)}>
              {t.manifesto.disagree}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Coat of Arms */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <img
            src={canadianCrest}
            alt="Background emblem"
            className="w-96 h-96 object-contain"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center px-6 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold">
                <Shield className="w-5 h-5 mr-3" />
                {t.footer.tagline}
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              {t.hero.title}
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-red-600 mb-8">
              {t.hero.subtitle}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              {t.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                onClick={() => setLocation('/auth')}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {t.hero.cta}
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CanadianCoatOfArms size="sm" />
                <span>Independent • Transparent • Authentic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Voting Records */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Vote className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold">{t.features.voting.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t.features.voting.description}</p>
              </CardContent>
            </Card>

            {/* Politician Profiles */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold">{t.features.politicians.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t.features.politicians.description}</p>
              </CardContent>
            </Card>

            {/* Bill Tracking */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold">{t.features.bills.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t.features.bills.description}</p>
              </CardContent>
            </Card>

            {/* Civic News */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl font-semibold">{t.features.news.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t.features.news.description}</p>
              </CardContent>
            </Card>

            {/* Petitions */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl font-semibold">{t.features.petitions.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t.features.petitions.description}</p>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl font-semibold">{t.features.ai.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t.features.ai.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Government Services Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Government Services and Information
            </h2>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">
              Services Gouvernementaux et Information
            </h3>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              Comprehensive access to Canadian government data, parliamentary proceedings,
              and democratic engagement tools across federal, provincial, and municipal levels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Parliament & Legislature</CardTitle>
                <CardDescription className="text-sm">
                  Parlement et Assemblées Législatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Federal MPs and Senators</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Provincial MLAs</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Voting records & proceedings</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Bills & Legislation</CardTitle>
                <CardDescription className="text-sm">
                  Projets de Loi et Législation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Federal & provincial bills</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Legislative progress tracking</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Public consultation access</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Legal Information</CardTitle>
                <CardDescription className="text-sm">
                  Information Juridique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Canadian legal database</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Court decisions & rulings</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Constitutional resources</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Elections & Voting</CardTitle>
                <CardDescription className="text-sm">
                  Élections et Vote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Election schedules & results</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Voter information</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Electoral district data</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Regional Services</CardTitle>
                <CardDescription className="text-sm">
                  Services Régionaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Provincial government data</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Municipal information</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Local representative contacts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Secure Access</CardTitle>
                <CardDescription className="text-sm">
                  Accès Sécurisé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Government-grade security</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Privacy protection</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-red-600 mr-2" />Verified identity system</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Official CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Access Your Government Information
          </h2>
          <h3 className="text-2xl font-semibold text-red-100 mb-6">
            Accédez à Vos Informations Gouvernementales
          </h3>
          <p className="text-lg text-red-100 mb-8">
            Connect with your democracy through independent government accountability tracking, representative monitoring,
            and parliamentary oversight. All data sourced from public Canadian government sources for transparency.
          </p>
          <div className="bg-red-800 bg-opacity-50 p-4 rounded-md mb-4">
            <p className="text-sm text-red-100 font-medium">
              ⚠️ DISCLAIMER: CivicOS is an independent platform, NOT affiliated with the Government of Canada
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => window.location.href = '/login'}
            className="bg-white text-red-600 hover:bg-red-50 px-8 py-3 text-lg font-semibold"
          >
            {t.hero.cta} / Accéder à la Plateforme
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="bg-gray-100 border-t-4 border-red-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <CanadianCoatOfArms size="sm" />
                <span className="font-bold text-lg text-gray-900">CivicOS</span>
              </div>
              <p className="text-gray-600 text-sm">
                {t.footer.tagline}
              </p>
              <p className="text-yellow-600 text-xs font-medium mt-2">
                * {t.footer.disclaimer}
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
  );
}