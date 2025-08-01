import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VotingButtons } from "@/components/VotingButtons";
import { InteractiveContent } from "@/components/InteractiveContent";

import { 
  MessageCircle, 
  Heart, 
  Eye, 
  Plus, 
  Filter, 
  TrendingUp,
  Clock,
  Users,
  Flag,
  Scale,
  FileText,
  Building,
  Map,
  Megaphone
} from "lucide-react";

interface ForumPost {
  id: number;
  title: string;
  content: string;
  authorId: string;
  categoryId: number;
  billId?: number;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isSticky: boolean;
  isLocked: boolean;
  replyCount: number;
  likeCount: number;
  author?: {
    firstName: string;
    email: string;
    profileImageUrl?: string;
  };
  category?: {
    name: string;
    color: string;
    icon: string;
  };
  bill?: {
    title: string;
    billNumber: string;
  };
}

interface ForumCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  postCount?: number;
  subcategories?: ForumSubcategory[];
}

interface ForumSubcategory {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  postCount?: number;
}

interface ForumReply {
  id: number;
  content: string;
  authorId: string;
  postId: number;
  parentReplyId?: number;
  createdAt: string;
  likeCount: number;
  author?: {
    firstName: string;
    email: string;
    profileImageUrl?: string;
  };
}

const categoryIcons = {
  MessageCircle,
  Heart,
  Eye,
  Plus,
  Filter,
  TrendingUp,
  Clock,
  Users,
  Flag,
  Scale,
  FileText,
  Building,
  Map,
  Megaphone
};

export default function CivicSocialDiscussions() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newReply, setNewReply] = useState("");
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    categoryId: "",
    billId: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ['/api/forum/categories'],
    queryFn: () => apiRequest('/api/forum/categories', 'GET'),
  });

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<ForumPost[]>({
    queryKey: ['/api/forum/posts'],
    queryFn: () => apiRequest('/api/forum/posts', 'GET'),
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/forum/posts', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setShowCreatePost(false);
      setNewPost({ title: "", content: "", categoryId: "", billId: "" });
      toast({
        title: "Success",
        description: "Discussion created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discussion",
        variant: "destructive"
      });
    }
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/forum/replies', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setNewReply("");
      setSelectedPost(null);
      toast({
        title: "Success",
        description: "Reply posted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive"
      });
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: (postId: number) => apiRequest(`/api/forum/posts/${postId}/like`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
    },
  });

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.categoryId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createPostMutation.mutate({
      title: newPost.title,
      content: newPost.content,
      categoryId: parseInt(newPost.categoryId),
      billId: newPost.billId ? parseInt(newPost.billId) : undefined
    });
  };

  const handleCreateReply = () => {
    if (!newReply.trim() || !selectedPost) {
      return;
    }

    createReplyMutation.mutate({
      content: newReply,
      postId: selectedPost.id
    });
  };

  const handleLikePost = (postId: number) => {
    likePostMutation.mutate(postId);
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = categoryIcons[iconName as keyof typeof categoryIcons] || MessageCircle;
    return IconComponent;
  };

  const filteredPosts = posts.filter(post => 
    selectedCategory === "all" || post.categoryId === parseInt(selectedCategory)
  );

  const displayCategories = categories.sort((a, b) => a.sortOrder - b.sortOrder);
  const displayPosts = posts.sort((a, b) => {
    if (a.isSticky && !b.isSticky) return -1;
    if (!a.isSticky && b.isSticky) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community Discussions</h1>
              <p className="text-gray-600">Engage in meaningful conversations about Canadian politics and civic issues</p>
            </div>
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Start a New Discussion</DialogTitle>
                  <DialogDescription>Share your thoughts and start a new civic discussion.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Enter discussion title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select
                      value={newPost.categoryId}
                      onValueChange={(value) => setNewPost({ ...newPost, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <Textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Share your thoughts..."
                      rows={6}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePost} disabled={createPostMutation.isPending}>
                    {createPostMutation.isPending ? "Creating..." : "Create Discussion"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Discussions
            </Button>
            {displayCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id.toString())}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {postsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading discussions...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No discussions yet</h3>
                <p className="text-gray-600 mb-4">Be the first to start a discussion about Canadian politics and civic issues!</p>
                <Button onClick={() => setShowCreatePost(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start First Discussion
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {post.author?.firstName?.[0] || post.author?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{post.title}</h3>
                          {post.isSticky && (
                            <Badge variant="secondary" className="text-xs">Pinned</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{post.author?.firstName || post.author?.email?.split('@')[0] || 'Anonymous'}</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          {post.category && (
                            <Badge variant="outline" style={{ backgroundColor: post.category.color + '20', color: post.category.color }}>
                              {post.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.replyCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likeCount}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikePost(post.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Like
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPost(post)}
                        className="text-gray-500 hover:text-blue-500"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                    {post.bill && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {post.bill.billNumber}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Reply Dialog */}
        {selectedPost && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Reply to: {selectedPost.title}</DialogTitle>
                <DialogDescription>
                  Share your thoughts and contribute to this civic discussion.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedPost.content}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Reply</label>
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedPost(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReply} disabled={createReplyMutation.isPending}>
                  {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 