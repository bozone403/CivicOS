import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VotingButtons } from "@/components/VotingButtons";
import { AlertTriangle, TrendingUp, Eye, ExternalLink, Shield, BarChart3, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCivicSocialPost } from "@/hooks/useCivicSocial";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { ShareToCivicSocialDialog } from "@/components/ui/ShareToCivicSocialDialog";

interface NewsArticle {
  id: number;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  bias: 'left' | 'center' | 'right';
  factualityScore: number;
  credibilityScore: number;
  emotionalTone: string;
  propagandaTechniques: string[];
  keyTopics: string[];
  politiciansInvolved: string[];
  claims: any[];
}

interface NewsComparison {
  id: number;
  topic: string;
  sources: string[];
  consensusLevel: number;
  majorDiscrepancies: string[];
  propagandaPatterns: string[];
  factualAccuracy: number;
  politicalBias: {
    left: number;
    center: number;
    right: number;
  };
  analysisDate: string;
  articleCount: number;
}

interface BiasAnalysis {
  source: string;
  avgBiasScore: number;
  avgFactuality: number;
  avgCredibility: number;
  articleCount: number;
}

export default function ComprehensiveNewsWidget() {
  const { data: articles = [], isLoading: articlesLoading } = useQuery<NewsArticle[]>({
    queryKey: ['/api/news/comprehensive']
  });

  const { data: comparisons = [], isLoading: comparisonsLoading } = useQuery<NewsComparison[]>({
    queryKey: ['/api/news/comparisons']
  });

  const { data: biasAnalysis = [], isLoading: biasLoading } = useQuery<BiasAnalysis[]>({
    queryKey: ['/api/news/bias-analysis']
  });

  // Use real data only - no fallbacks
  const displayArticles = articles;
  const displayComparisons = comparisons;
  const displayBiasAnalysis = biasAnalysis;

  const { user } = useAuth();
  const civicSocialPost = useCivicSocialPost();
  const { toast } = useToast();
  const [shareDialog, setShareDialog] = useState<{ open: boolean; article?: NewsArticle }>({ open: false });
  const [shareComment, setShareComment] = useState("");

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'left': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'right': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'center': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getFactualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConsensusColor = (level: number) => {
    if (level >= 80) return 'text-green-600 dark:text-green-400';
    if (level >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (articlesLoading || comparisonsLoading || biasLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Comprehensive News Analysis
          </CardTitle>
          <CardDescription>
            Cross-source analysis with bias detection and propaganda identification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Add error handling for all data sources
  if ((displayArticles.length === 0 && !articlesLoading) || (displayComparisons.length === 0 && !comparisonsLoading) || (displayBiasAnalysis.length === 0 && !biasLoading)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            News data unavailable
          </CardTitle>
          <CardDescription>
            We couldn't load news analysis data. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cross-Source Topic Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cross-Source Analysis
          </CardTitle>
          <CardDescription>
            Comparing coverage across major Canadian news sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayComparisons.slice(0, 3).map((comparison) => (
              <div key={comparison.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{comparison.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      {comparison.sources.length} sources • {comparison.articleCount} articles
                    </p>
                  </div>
                  <Badge variant="outline" className={getConsensusColor(comparison.consensusLevel)}>
                    {comparison.consensusLevel}% consensus
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Factual Accuracy</span>
                    <span className={getFactualityColor(comparison.factualAccuracy)}>
                      {comparison.factualAccuracy}%
                    </span>
                  </div>
                  <Progress 
                    value={comparison.factualAccuracy} 
                    className="h-2"
                  />
                </div>

                {comparison.propagandaPatterns.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{comparison.propagandaPatterns.length} propaganda patterns detected</span>
                  </div>
                )}

                {comparison.majorDiscrepancies.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Major Discrepancies:</p>
                    {comparison.majorDiscrepancies.slice(0, 2).map((discrepancy, idx) => (
                      <p key={idx} className="text-sm text-red-600 dark:text-red-400">
                        • {discrepancy}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {Object.entries(comparison.politicalBias).map(([bias, percentage]) => (
                    <Badge key={bias} variant="outline" className={getBiasColor(bias)}>
                      {bias}: {percentage}%
                    </Badge>
                  ))}
                </div>
                
                <VotingButtons 
                  targetType="news" 
                  targetId={comparison.id} 
                  size="sm"
                  showCounts={false}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source Credibility Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Source Credibility Rankings
          </CardTitle>
          <CardDescription>
            Weekly performance analysis of Canadian news sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayBiasAnalysis.slice(0, 5).map((source, index) => (
              <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{source.source}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.articleCount} articles analyzed
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Factuality:</span>
                    <span className={getFactualityColor(source.avgFactuality)}>
                      {typeof source.avgFactuality === 'number' ? source.avgFactuality.toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Credibility:</span>
                    <span className={getFactualityColor(source.avgCredibility)}>
                      {typeof source.avgCredibility === 'number' ? source.avgCredibility.toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent High-Quality Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            High-Quality Recent Coverage
          </CardTitle>
          <CardDescription>
            Canadian political news with highest factuality scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayArticles.slice(0, 5).map((article) => (
              <div key={article.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-2 mb-1">{article.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={getBiasColor(article.bias)}>
                      {article.bias}
                    </Badge>
                    <span className={`text-sm font-medium ${getFactualityColor(article.factualityScore)}`}>
                      {article.factualityScore}% factual
                    </span>
                  </div>
                </div>

                {article.propagandaTechniques.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Propaganda techniques: {article.propagandaTechniques.slice(0, 2).join(', ')}
                      {article.propagandaTechniques.length > 2 && ` +${article.propagandaTechniques.length - 2} more`}
                    </span>
                  </div>
                )}

                {article.politiciansInvolved.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.politiciansInvolved.slice(0, 3).map((politician) => (
                      <Badge key={politician} variant="secondary" className="text-xs">
                        {politician}
                      </Badge>
                    ))}
                    {article.politiciansInvolved.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.politiciansInvolved.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    {article.keyTopics.slice(0, 2).map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <ShareToCivicSocialDialog
                    trigger={
                      <Button variant="outline" size="sm" className="mt-2">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share to CivicSocial
                      </Button>
                    }
                    itemType="news"
                    itemId={article.id}
                    title={article.title}
                    summary={`${article.title} - ${article.source} • ${new Date(article.publishedAt).toLocaleDateString()}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}