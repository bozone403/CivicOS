import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Image as ImageIcon,
  MapPin,
  Tag,
  Smile,
  Send,
  Globe,
  Lock,
  Users,
  Share2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UnifiedSocialPostProps {
  onPostCreated?: () => void;
  placeholder?: string;
  showLocation?: boolean;
  showMood?: boolean;
  showTags?: boolean;
  showVisibility?: boolean;
  showImageUpload?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function UnifiedSocialPost({
  onPostCreated,
  placeholder = "What's on your mind?",
  showLocation = true,
  showMood = true,
  showTags = true,
  showVisibility = true,
  showImageUpload = true,
  className = "",
  autoFocus = false
}: UnifiedSocialPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest('/api/social/posts', 'POST', postData);
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: "Your post has been shared to your profile and the feed.",
      });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      resetForm();
      onPostCreated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Post failed",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setContent('');
    setVisibility('public');
    setLocation('');
    setMood('');
    setTags([]);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !imageFile) {
      toast({
        title: "Content required",
        description: "Please enter some content or upload an image.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to create posts.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if present
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const uploadResponse = await apiRequest('/api/upload/image', 'POST', formData);
        
        imageUrl = uploadResponse.imageUrl;
      }

      // Create post
      const postData = {
        content: content.trim(),
        type: 'post',
        visibility,
        imageUrl,
        location: location.trim() || undefined,
        mood: mood.trim() || undefined,
        tags: tags.filter(tag => tag.trim()),
      };

      createPostMutation.mutate(postData);
    } catch (error) {
      // console.error removed for production
      toast({
        title: "Post failed",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !tags.includes(value)) {
        setTags([...tags, value]);
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'friends': return <Users className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <Card className={`p-4 ${className}`}>
        <CardContent className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Login to Post</h3>
          <p className="text-gray-600 mb-4">
            Join the conversation by logging in to your CivicOS account.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Login to Post
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User info and post input */}
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="bg-blue-600">
                {user.firstName?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder={placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-0 focus:ring-0 p-0 text-base"
                autoFocus={autoFocus}
                maxLength={1000}
              />
              
              {/* Image preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-xs max-h-48 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Additional options */}
          <div className="space-y-3">
            {/* Tags */}
            {showTags && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Add tags (press Enter or comma)"
                    onKeyDown={handleTagInput}
                    className="flex-1 text-sm border-0 focus:ring-0 p-0 bg-transparent"
                  />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Location and Mood */}
            <div className="flex gap-4">
              {showLocation && (
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 text-sm border-0 focus:ring-0 p-0 bg-transparent"
                  />
                </div>
              )}
              
              {showMood && (
                <div className="flex items-center gap-2 flex-1">
                  <Smile className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="How are you feeling?"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="flex-1 text-sm border-0 focus:ring-0 p-0 bg-transparent"
                  />
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                {showImageUpload && (
                  <label className="cursor-pointer">
                    <ImageIcon className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                
                {showVisibility && (
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="text-sm border-0 focus:ring-0 p-0 bg-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends</option>
                    <option value="private">Private</option>
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {content.length}/1000
                </span>
                <Button
                  type="submit"
                  disabled={(!content.trim() && !imageFile) || isSubmitting}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 