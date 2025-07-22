import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./dialog";
import { Button } from "./button";
import { useCivicSocialPost } from "@/hooks/useCivicSocial";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ShareToCivicSocialDialogProps {
  trigger: React.ReactNode;
  itemType: "petition" | "bill" | "news" | string;
  itemId: number | string;
  title: string;
  summary?: string;
  onSuccess?: () => void;
}

export function ShareToCivicSocialDialog({ trigger, itemType, itemId, title, summary, onSuccess }: ShareToCivicSocialDialogProps) {
  const { user } = useAuth();
  const civicSocialPost = useCivicSocialPost();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share to CivicSocial</DialogTitle>
          <DialogDescription>
            Share this {itemType} with your CivicSocial followers. You can add a comment below.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={e => {
            e.preventDefault();
            if (!user) return;
            civicSocialPost.mutate({
              type: "share",
              originalItemId: itemId,
              originalItemType: itemType,
              comment,
              userId: user.id,
              displayName: user.firstName || user.email || "Anonymous",
              content: `Shared ${itemType}: ${title}${summary ? "\n" + summary : ""}`,
            }, {
              onSuccess: () => {
                setOpen(false);
                setComment("");
                toast({ title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} shared!`, description: `Your share was added to the CivicSocial feed.` });
                onSuccess?.();
              },
            });
          }}
        >
          <textarea
            className="border rounded px-3 py-2"
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            aria-label="Share comment"
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} aria-label="Cancel share">
              Cancel
            </Button>
            <Button type="submit" disabled={civicSocialPost.isPending} aria-label="Submit share">
              {civicSocialPost.isPending ? "Sharing..." : "Share"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 