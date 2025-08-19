import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { VotingButtons } from "@/components/VotingButtons";
import { CommentSystem } from "@/components/CommentSystem";
import { Share2, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface InteractiveContentProps {
  targetType: 'politician' | 'bill' | 'post' | 'comment' | 'petition' | 'news' | 'finance';
  targetId: number;
  title: string;
  description: string;
  showVoting?: boolean;
  showComments?: boolean;
  showSharing?: boolean;
}

export function InteractiveContent({ 
  targetType, 
  targetId, 
  title,
  description,
  showVoting = true,
  showComments = true,
  showSharing = true
}: InteractiveContentProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      await navigator.share({
        title: title,
        text: description,
        url: window.location.href
      });
    } catch (err) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard."
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Interaction Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          {showVoting && (
            <VotingButtons 
              targetType={targetType as any} 
              targetId={Number(targetId)} 
              size="md" 
            />
          )}
          
          {showSharing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MessageCircle className="w-4 h-4" />
          <span>Discussion</span>
        </div>
      </div>

      {/* Comments Section - Now fully functional */}
      {showComments && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <MessageCircle className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Comments</span>
          </div>
          
          <CommentSystem 
            targetType={targetType}
            targetId={targetId}
            allowReplies={true}
            allowEditing={true}
            allowDeleting={true}
            showUserAvatars={true}
            maxDepth={3}
          />
        </div>
      )}
    </div>
  );
}