import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFeed, useCivicSocialPost, useCivicSocialLike, useCivicSocialComment, useCivicSocialFriends } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { useRef } from "react";
import { useToast } from "../hooks/use-toast";

export default function CivicSocialProfile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const token = localStorage.getItem("token") || "";
  const { data: feed, isLoading, error } = useCivicSocialFeed(token);
  const { data: friendsData } = useCivicSocialFriends(token);
  const [, navigate] = useLocation();
  const postMutation = useCivicSocialPost(token);
  const likeMutation = useCivicSocialLike(token);
  const commentMutation = useCivicSocialComment(token);
  const [content, setContent] = useState("");
  const [openComment, setOpenComment] = useState<{ [postId: number]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
  const [editOpen, setEditOpen] = useState(false);
  const displayName = user ? (user.firstName || "") + (user.lastName ? " " + user.lastName : "") || user.email || "Anonymous" : "Anonymous";
  const [editName, setEditName] = useState(displayName);
  const [editBio, setEditBio] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target?.result as string);
        toast({ title: "Avatar updated!", description: "Your profile picture has been changed." });
      };
      reader.readAsDataURL(file);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!user) return <div className="text-center text-muted-foreground">Login to view your profile.</div>;

  const userPosts = feed ? feed.filter((post: any) => post.userId === user.id) : [];
  const userComments = feed
    ? feed.flatMap((post: any) =>
        (post.comments || []).filter((c: any) => c.userId === user.id).map((c: any) => ({ ...c, post }))
      )
    : [];
  const userShares = feed ? feed.filter((post: any) => post.userId === user.id && post.type === "share") : [];
  const friends = friendsData?.friends || [];

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    postMutation.mutate({ content, userId: user.id, displayName });
    setContent("");
  };

  const handleLike = (postId: number) => {
    likeMutation.mutate(postId);
  };

  const handleComment = (postId: number) => {
    if (!commentText[postId]?.trim()) return;
    commentMutation.mutate({ postId, content: commentText[postId], userId: user.id, displayName });
    setCommentText({ ...commentText, [postId]: "" });
    setOpenComment({ ...openComment, [postId]: false });
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Profile Header */}
      <Card className="p-4 mb-4 flex flex-col items-center md:flex-row md:items-center md:gap-6">
        <div className="relative w-20 h-20 mb-2 md:mb-0 md:mr-6 shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl font-bold">
              {editName ? editName[0] : "?"}
            </div>
          )}
          <button
            className="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change avatar"
            type="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            aria-label="Upload avatar"
          />
        </div>
        <div className="flex-1 flex flex-col items-center md:items-start">
          <div className="font-bold text-lg mb-1">{editName}</div>
          <div className="text-muted-foreground mb-2">@{user.email?.split("@")[0]}</div>
          {bio && <div className="text-sm text-gray-700 mb-2 text-center md:text-left max-w-xs">{bio}</div>}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => navigate("/civicsocial/friends")}>View Friends</Button>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">Edit Profile</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form
                  className="flex flex-col gap-4"
                  onSubmit={e => {
                    e.preventDefault();
                    // Simulate backend update
                    setEditOpen(false);
                    setBio(editBio);
                    toast({ title: "Profile updated!", description: "Your changes have been saved." });
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="edit-name">Display Name</label>
                    <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="edit-bio">Bio</label>
                    <Textarea id="edit-bio" value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
      {/* Friends Section */}
      <Card className="p-4 mb-4">
        <div className="font-semibold mb-2">Your Friends</div>
        <div className="flex flex-wrap gap-3">
          {friends.length === 0 && <div className="text-muted-foreground">No friends yet.</div>}
          {friends.slice(0, 8).map((friend: any) => (
            <div key={friend.id} className="flex flex-col items-center w-16">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg mb-1">
                {(friend.displayName || friend.firstName || friend.email || "?")[0]}
              </div>
              <div className="text-xs text-center truncate max-w-[56px]">
                {friend.displayName || friend.firstName || friend.email || `User ${friend.friendId}`}
              </div>
            </div>
          ))}
        </div>
        {friends.length > 8 && (
          <Button size="sm" variant="link" onClick={() => navigate("/civicsocial/friends")}>See all friends</Button>
        )}
      </Card>
      {/* Post Composer */}
      <Card className="p-4 mb-4">
        <form className="flex gap-2 items-center" onSubmit={handlePost}>
          <input
            className="flex-1 border rounded px-3 py-2 mr-2 bg-background"
            placeholder={isAuthenticated ? "What's on your mind?" : "Login to post"}
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={postMutation.isPending || !isAuthenticated}
          />
          <Button type="submit" disabled={!content.trim() || postMutation.isPending || !isAuthenticated}>
            {postMutation.isPending ? "Posting..." : "Post"}
          </Button>
        </form>
        {postMutation.error && (
          <div className="text-xs text-red-500 mt-2">Error posting. Try again.</div>
        )}
      </Card>
      {/* Recent Activity Section */}
      <Card className="p-4 mb-4">
        <div className="font-semibold mb-2">Your Recent Activity</div>
        <div className="flex flex-col gap-4">
          {userPosts.length === 0 && userComments.length === 0 && userShares.length === 0 && (
            <div className="text-muted-foreground">You haven't posted, commented, or shared anything yet.</div>
          )}
          {/* Posts */}
          {userPosts.map((post: any) => (
            <Card key={"post-" + post.id} className="p-4">
              <div className="flex items-center gap-2">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                    {post.displayName ? post.displayName[0] : "?"}
                  </div>
                )}
                <div className="font-semibold">{post.displayName || `User ${post.userId}`}</div>
                <Badge variant="secondary" className="ml-2">Post</Badge>
              </div>
              <div className="text-sm mt-1">{post.content || <span className="italic text-muted-foreground">(no content)</span>}</div>
              <div className="flex gap-4 mt-3 items-center">
                <Button size="sm" variant="ghost" onClick={() => handleLike(post.id)} disabled={likeMutation.isPending}>
                  👍 {post.likesCount || 0}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpenComment({ ...openComment, [post.id]: !openComment[post.id] })}>
                  💬 {post.commentsCount || 0}
                </Button>
              </div>
              {openComment[post.id] && (
                <div className="mt-2 flex gap-2 items-center">
                  <input
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Write a comment..."
                    value={commentText[post.id] || ""}
                    onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                    disabled={commentMutation.isPending}
                  />
                  <Button size="sm" onClick={() => handleComment(post.id)} disabled={!commentText[post.id]?.trim() || commentMutation.isPending}>
                    {commentMutation.isPending ? "Posting..." : "Comment"}
                  </Button>
                </div>
              )}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  {post.comments.map((c: any) => (
                    <div key={c.id} className="text-xs mb-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                        {c.displayName ? c.displayName[0] : "?"}
                      </div>
                      <span className="font-semibold">{c.displayName || `User ${c.userId}`}:</span> {c.content}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">{new Date(post.createdAt).toLocaleString()}</div>
            </Card>
          ))}
          {/* Comments */}
          {userComments.map((c: any) => (
            <Card key={"comment-" + c.id} className="p-4 bg-blue-50">
              <div className="flex items-center gap-2">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                    {editName[0]}
                  </div>
                )}
                <div className="font-semibold">{editName}</div>
                <Badge variant="outline" className="ml-2">Comment</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-1">On post: <span className="font-semibold">{c.post.content?.slice(0, 40) || "(no content)"}</span></div>
              <div className="text-sm mt-1">{c.content}</div>
              <div className="text-xs text-muted-foreground mt-2">{new Date(c.createdAt).toLocaleString()}</div>
            </Card>
          ))}
          {/* Shares */}
          {userShares.map((post: any) => (
            <Card key={"share-" + post.id} className="p-4 bg-green-50">
              <div className="flex items-center gap-2">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                    {editName[0]}
                  </div>
                )}
                <div className="font-semibold">{editName}</div>
                <Badge variant="outline" className="ml-2">Share</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-1">Shared post #{post.originalItemId}</div>
              <div className="text-sm mt-1">{post.comment || <span className="italic text-muted-foreground">(no comment)</span>}</div>
              <div className="text-xs text-muted-foreground mt-2">{new Date(post.createdAt).toLocaleString()}</div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
} 