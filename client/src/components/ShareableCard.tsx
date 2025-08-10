import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Copy,
  ExternalLink,
  FileText,
  Users,
  Vote,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ShareableCardProps {
  type: 'bill' | 'petition' | 'politician';
  data: any;
  showSocialActions?: boolean;
  showShareButtons?: boolean;
}

export function ShareableCard({ 
  type, 
  data, 
  showSocialActions = true, 
  showShareButtons = true 
}: ShareableCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getCardContent = () => {
    switch (type) {
      case 'bill':
        return {
          title: data.title || data.billNumber,
          subtitle: `Bill ${data.billNumber}`,
          description: data.description || data.summary,
          icon: FileText,
          status: data.status,
          category: data.category,
          sponsor: data.sponsor,
          jurisdiction: data.jurisdiction,
          url: `/voting?bill=${data.id}`,
          shareText: `Check out Bill ${data.billNumber}: ${data.title} on CivicOS`,
        };
      case 'petition':
        return {
          title: data.title,
          subtitle: `Petition by ${data.creator}`,
          description: data.description,
          icon: Users,
          status: data.status,
          category: data.category,
          signatures: data.currentSignatures,
          targetSignatures: data.targetSignatures,
          daysLeft: data.daysLeft,
          url: `/petitions?id=${data.id}`,
          shareText: `Sign this petition: ${data.title} on CivicOS`,
        };
      case 'politician':
        return {
          title: data.name,
          subtitle: `${data.position} - ${data.party}`,
          description: data.bio || data.description,
          icon: Vote,
          status: data.status,
          jurisdiction: data.jurisdiction,
          trustScore: data.trustScore,
          url: `/politicians?id=${data.id}`,
          shareText: `Check out ${data.name}'s profile on CivicOS`,
        };
      default:
        return {
          title: 'Unknown',
          subtitle: '',
          description: '',
          icon: FileText,
          status: '',
          category: '',
          url: '',
          shareText: '',
        };
    }
  };

  const content = getCardContent();

  const handleShare = async (platform: string) => {
    const shareUrl = `${window.location.origin}${content.url}`;
    const shareText = content.shareText;
    
    try {
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
          break;
        case 'copy':
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          toast({
            title: "Link copied!",
            description: "The link has been copied to your clipboard.",
          });
          break;
        default:
          if (navigator.share) {
            await navigator.share({
              title: content.title,
              text: shareText,
              url: shareUrl,
            });
          } else {
            await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            toast({
              title: "Link copied!",
              description: "The link has been copied to your clipboard.",
            });
          }
      }
    } catch (error) {
      // console.error removed for production
      toast({
        title: "Share failed",
        description: "Failed to share. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareToSocialMutation = useMutation({
    mutationFn: async (comment?: string) => {
      return apiRequest('/api/social/posts', 'POST', {
        content: comment || content.shareText,
        type: 'share',
        originalItemId: data.id,
        originalItemType: type,
        visibility: 'public',
        tags: [type, content.category].filter(Boolean),
      });
    },
    onSuccess: () => {
      toast({
        title: "Shared to social!",
        description: "Your post has been added to the CivicSocial feed.",
      });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Share failed",
        description: error.message || "Failed to share to social feed.",
        variant: "destructive",
      });
    },
  });

  const handleSocialShare = (comment?: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to share to your social feed.",
        variant: "destructive",
      });
      return;
    }
    shareToSocialMutation.mutate(comment);
  };

  return (
    <Card className="w-full max-w-md mx-auto hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            {content.icon && <content.icon className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{content.title}</CardTitle>
            <p className="text-sm text-gray-600">{content.subtitle}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-700 text-sm line-clamp-3">
          {content.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {content.status && (
            <Badge variant="secondary">{content.status}</Badge>
          )}
          {content.category && (
            <Badge variant="outline">{content.category}</Badge>
          )}
          {content.jurisdiction && (
            <Badge variant="outline">{content.jurisdiction}</Badge>
          )}
        </div>

        {type === 'petition' && content.signatures && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Signatures</span>
            <span className="font-semibold">
              {content.signatures.toLocaleString()} / {content.targetSignatures.toLocaleString()}
            </span>
          </div>
        )}

        {type === 'politician' && content.trustScore && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Trust Score</span>
            <span className="font-semibold">{content.trustScore}%</span>
          </div>
        )}

        {showShareButtons && (
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-1"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-1"
              >
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('copy')}
                className="flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(content.url, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              View
            </Button>
          </div>
        )}

        {showSocialActions && (
          <div className="pt-3 border-t">
            <Button
              onClick={() => handleSocialShare()}
              disabled={shareToSocialMutation.isPending}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {shareToSocialMutation.isPending ? 'Sharing...' : 'Share to CivicSocial'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 