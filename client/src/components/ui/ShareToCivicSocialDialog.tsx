import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, MessageCircle, Users, FileText, Vote, User, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShareToCivicSocialDialogProps {
  trigger: React.ReactNode;
  itemType: "bill" | "petition" | "politician" | "news" | "electoral";
  itemId: number;
  title: string;
  summary: string;
  onSuccess?: () => void;
}

interface SharePreview {
  title: string;
  summary: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function ShareToCivicSocialDialog({ 
  trigger, 
  itemType, 
  itemId, 
  title, 
  summary, 
  onSuccess 
}: ShareToCivicSocialDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getSharePreview = (): SharePreview => {
    switch (itemType) {
      case "bill":
        return {
          title: `Bill: ${title}`,
          summary: summary,
          type: "Legislation",
          icon: FileText,
          color: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "petition":
        return {
          title: `Petition: ${title}`,
          summary: summary,
          type: "Civic Action",
          icon: Vote,
          color: "bg-green-100 text-green-800 border-green-200"
        };
      case "politician":
        return {
          title: `Politician: ${title}`,
          summary: summary,
          type: "Political Profile",
          icon: User,
          color: "bg-purple-100 text-purple-800 border-purple-200"
        };
      case "electoral":
        return {
          title: `Electoral Candidate: ${title}`,
          summary: summary,
          type: "Electoral Politics",
          icon: Crown,
          color: "bg-orange-100 text-orange-800 border-orange-200"
        };
      case "news":
        return {
          title: `News: ${title}`,
          summary: summary,
          type: "News Article",
          icon: MessageCircle,
          color: "bg-gray-100 text-gray-800 border-gray-200"
        };
      default:
        return {
          title: title,
          summary: summary,
          type: "Content",
          icon: Share2,
          color: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  const handleShare = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to share content.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    try {
      await apiRequest('/api/civicsocial/share', 'POST', {
        itemType,
        itemId,
        comment: comment.trim() || null,
        title,
        summary
      });

      toast({
        title: "Shared successfully!",
        description: "Your post has been shared to CivicSocial.",
      });

      setIsOpen(false);
      setComment("");
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Share failed",
        description: error.message || "Failed to share content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const preview = getSharePreview();
  const PreviewIcon = preview.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share to CivicSocial</span>
          </DialogTitle>
          <DialogDescription>
            Share this content with the CivicSocial community. Add a comment to provide context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Badge className={preview.color}>
                  <PreviewIcon className="w-3 h-3 mr-1" />
                  {preview.type}
                </Badge>
              </div>
              <CardTitle className="text-lg">{preview.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-3">
                {preview.summary}
              </p>
            </CardContent>
          </Card>

          {/* Comment Input */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Add a comment (optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts about this content..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Options</label>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(`${preview.title}\n\n${preview.summary}\n\nShared via CivicOS`);
                  toast({
                    title: "Link copied",
                    description: "Content link copied to clipboard.",
                  });
                }}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const url = `${window.location.origin}/${itemType}/${itemId}`;
                  navigator.clipboard.writeText(url);
                  toast({
                    title: "URL copied",
                    description: "Direct URL copied to clipboard.",
                  });
                }}
              >
                <FileText className="w-4 h-4 mr-1" />
                Copy URL
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center space-x-2"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share to CivicSocial</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 