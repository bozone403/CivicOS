import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CivicSocialCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'interactive' | 'compact';
  onClick?: () => void;
  loading?: boolean;
  hover?: boolean;
}

export function CivicSocialCard({
  title,
  description,
  children,
  className,
  variant = 'default',
  onClick,
  loading = false,
  hover = true
}: CivicSocialCardProps) {
  const variants = {
    default: "social-card",
    elevated: "social-card-elevated",
    interactive: "social-card-interactive",
    compact: "social-card p-4"
  };

  const hoverClass = hover ? "social-hover-lift" : "";

  return (
    <Card 
      className={cn(
        variants[variant],
        hoverClass,
        loading && "animate-pulse",
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className="pb-3">
          {title && (
            <CardTitle className="social-heading-3 text-card-foreground">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="social-caption">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        "space-y-4",
        !title && !description && "pt-6"
      )}>
        {children}
      </CardContent>
    </Card>
  );
}

interface CivicSocialPostCardProps {
  post: {
    id: number;
    content: string;
    imageUrl?: string;
    createdAt: string;
    user?: {
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
      civicLevel?: string;
    };
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    isBookmarked: boolean;
  };
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onShare?: (postId: number) => void;
  onBookmark?: (postId: number) => void;
  onEdit?: (postId: number) => void;
  onDelete?: (postId: number) => void;
  className?: string;
}

export function CivicSocialPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onEdit,
  onDelete,
  className
}: CivicSocialPostCardProps) {
  const displayName = post.user ? 
    (post.user.firstName && post.user.lastName ? 
      `${post.user.firstName} ${post.user.lastName}` : 
      post.user.firstName || post.user.lastName || 'Anonymous') : 
    'Anonymous';

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <CivicSocialCard className={cn("social-fade-in", className)}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="social-avatar w-10 h-10">
            {post.user?.profileImageUrl ? (
              <img 
                src={post.user.profileImageUrl} 
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-social-primary flex items-center justify-center text-white font-medium">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-card-foreground">{displayName}</span>
            {post.user?.civicLevel && (
              <span className="social-badge-primary">
                {post.user.civicLevel}
              </span>
            )}
            <span className="social-caption">{formatTimeAgo(post.createdAt)}</span>
          </div>
          
          <div className="social-body text-card-foreground mb-4">
            {post.content}
          </div>
          
          {post.imageUrl && (
            <div className="mb-4">
              <img 
                src={post.imageUrl} 
                alt="Post content"
                className="w-full rounded-lg object-cover max-h-96"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onLike?.(post.id)}
                className={cn(
                  "flex items-center space-x-1 text-sm transition-colors",
                  post.isLiked ? "like-color" : "text-muted-foreground hover:like-color"
                )}
              >
                <Heart className={cn("w-4 h-4", post.isLiked && "fill-current")} />
                <span>{post.likesCount}</span>
              </button>
              
              <button
                onClick={() => onComment?.(post.id)}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:comment-color transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentsCount}</span>
              </button>
              
              <button
                onClick={() => onShare?.(post.id)}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:share-color transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>{post.sharesCount}</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => onBookmark?.(post.id)}
                className={cn(
                  "text-sm transition-colors",
                  post.isBookmarked ? "bookmark-color" : "text-muted-foreground hover:bookmark-color"
                )}
              >
                <Bookmark className={cn("w-4 h-4", post.isBookmarked && "fill-current")} />
              </button>
              {onEdit && (
                <button onClick={() => onEdit(post.id)} className="text-sm text-muted-foreground hover:text-blue-600">
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(post.id)} className="text-sm text-red-600 hover:text-red-700">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CivicSocialCard>
  );
}

interface CivicSocialProfileCardProps {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImageUrl?: string;
    civicLevel?: string;
    bio?: string;
    isOnline?: boolean;
  };
  stats?: {
    posts: number;
    friends: number;
    civicPoints: number;
  };
  onMessage?: (userId: string) => void;
  onFollow?: (userId: string) => void;
  className?: string;
}

export function CivicSocialProfileCard({
  user,
  stats,
  onMessage,
  onFollow,
  className
}: CivicSocialProfileCardProps) {
  const displayName = user.firstName && user.lastName ? 
    `${user.firstName} ${user.lastName}` : 
    user.firstName || user.lastName || user.email || 'Anonymous';

  return (
    <CivicSocialCard className={cn("social-scale-in", className)}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className={cn(
            "social-avatar w-20 h-20",
            user.isOnline ? "social-avatar-online" : "social-avatar-offline"
          )}>
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-social-primary flex items-center justify-center text-white font-bold text-xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-online rounded-full border-2 border-card"></div>
          )}
        </div>
        
        <div>
          <h3 className="social-heading-2 text-card-foreground">{displayName}</h3>
          {user.civicLevel && (
            <span className="social-badge-primary mt-1">
              {user.civicLevel}
            </span>
          )}
        </div>
        
        {user.bio && (
          <p className="social-body text-muted-foreground max-w-md">
            {user.bio}
          </p>
        )}
        
        {stats && (
          <div className="flex space-x-6 pt-2">
            <div className="text-center">
              <div className="social-heading-3 text-card-foreground">{stats.posts}</div>
              <div className="social-caption">Posts</div>
            </div>
            <div className="text-center">
              <div className="social-heading-3 text-card-foreground">{stats.friends}</div>
              <div className="social-caption">Friends</div>
            </div>
            <div className="text-center">
              <div className="social-heading-3 text-card-foreground">{stats.civicPoints}</div>
              <div className="social-caption">Points</div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-3 pt-2">
          {onMessage && (
            <button
              onClick={() => onMessage(user.id)}
              className="social-button-primary px-4 py-2 rounded-md"
            >
              Message
            </button>
          )}
          {onFollow && (
            <button
              onClick={() => onFollow(user.id)}
              className="social-button-secondary px-4 py-2 rounded-md"
            >
              Follow
            </button>
          )}
        </div>
      </div>
    </CivicSocialCard>
  );
}

// Import icons at the top
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react'; 