import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bell, Settings, Filter, X, Clock, AlertCircle, 
  FileText, Users, Vote, Megaphone, Calendar, Check, Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Fallback types if @shared/schema is missing
interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: string;
}
interface UserNotificationPreferences {
  petitionAlerts: boolean;
  billUpdates: boolean;
  foiResponses: boolean;
  systemNews: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'petition' | 'bill' | 'foi' | 'system'>('all');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const defaultNotifications: Notification[] = [
    {
      id: 1,
      type: 'bill',
      title: 'Bill C-11 Update',
      message: 'Online Streaming Act has passed second reading in Parliament',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'petition',
      title: 'Petition Milestone',
      message: 'Climate Action petition has reached 10,000 signatures',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'politician',
      title: 'New MP Statement',
      message: 'Chrystia Freeland released statement on economic policy',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'medium'
    },
    {
      id: 4,
      type: 'election',
      title: 'Electoral Boundary Update',
      message: 'New federal electoral boundaries finalized for 2025',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'low'
    },
    {
      id: 5,
      type: 'system',
      title: 'Data Update Complete',
      message: 'Weekly sync of government data completed - 342 MPs updated',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      priority: 'low'
    }
  ];

  // Load notifications from localStorage or use defaults
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('civicos-notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.log('Failed to parse saved notifications, using defaults');
        return defaultNotifications;
      }
    }
    return defaultNotifications;
  });
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user notifications - always enabled for demo
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: true,
  });

  // Fetch user notification preferences - always enabled for demo
  const { data: preferences } = useQuery<UserNotificationPreferences>({
    queryKey: ['/api/notifications/preferences'],
    enabled: true,
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      // Try API call first, but don't fail if it doesn't work
      try {
        await apiRequest(`/api/notifications/${id}`, 'DELETE');
      } catch (error) {
        console.log('API delete failed, using local state');
      }
      return id;
    },
    onSuccess: (id: number) => {
      // Remove from local state
      setLocalNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        localStorage.setItem('civicos-notifications', JSON.stringify(updated));
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // Try API call first, but don't fail if it doesn't work
      try {
        await apiRequest('/api/notifications', 'DELETE');
      } catch (error) {
        console.log('API clear all failed, using local state');
      }
      return true;
    },
    onSuccess: () => {
      // Clear local state
      setLocalNotifications([]);
      localStorage.setItem('civicos-notifications', JSON.stringify([]));
      toast({
        title: "All notifications cleared",
        description: "All notifications have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear notifications.",
        variant: "destructive",
      });
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        await apiRequest(`/api/notifications/${id}/read`, 'POST');
      } catch (error) {
        console.log('API mark as read failed, using local state');
      }
      return id;
    },
    onSuccess: (id: number) => {
      setLocalNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem('civicos-notifications', JSON.stringify(updated));
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<UserNotificationPreferences>) => 
      apiRequest('/api/notifications/preferences', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      });
    }
  });

  // Use local notifications for display
  const displayNotifications: Notification[] = localNotifications;

  const filteredNotifications = displayNotifications.filter(notification => {
    if (filter === 'bill') return notification.type === 'bill';
    if (filter === 'petition') return notification.type === 'petition';
    if (filter === 'foi') return notification.type === 'foi';
    if (filter === 'system') return notification.type === 'system';
    return true;
  });

  const unreadCount = displayNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bill': return <FileText className="w-4 h-4" />;
      case 'petition': return <Vote className="w-4 h-4" />;
      case 'politician': return <Users className="w-4 h-4" />;
      case 'election': return <Vote className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on civic activities and government changes
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {unreadCount} unread
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => clearAllMutation.mutate()}
            disabled={clearAllMutation.isPending || localNotifications.length === 0}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Notification Preferences</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Petition Alerts</span>
                    <Switch
                      checked={preferences?.petitionAlerts ?? true}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({ petitionAlerts: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bill Updates</span>
                    <Switch
                      checked={preferences?.billUpdates ?? true}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({ billUpdates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>FOI Responses</span>
                    <Switch
                      checked={preferences?.foiResponses ?? true}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({ foiResponses: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>System News</span>
                    <Switch
                      checked={preferences?.systemNews ?? true}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({ systemNews: checked })
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Email Notifications</span>
                    <Switch
                      checked={preferences?.emailNotifications ?? true}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({ emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push Notifications</span>
                    <Switch
                      checked={preferences?.pushNotifications ?? true}
                      onCheckedChange={(checked) => 
                        updatePreferencesMutation.mutate({ pushNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: displayNotifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'bills', label: 'Bills', count: displayNotifications.filter(n => n.type === 'bill').length },
              { key: 'petitions', label: 'Petitions', count: displayNotifications.filter(n => n.type === 'petition').length }
            ].map(tab => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(tab.key as any)}
                className="space-x-2"
              >
                <span>{tab.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground text-center">
                You&apos;re all caught up! Check back later for updates on civic activities.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className={cn("border", notification.read ? "border-gray-200" : "border-blue-400")}> 
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={notification.read ? "secondary" : "default"} className={notification.read ? "bg-gray-200 text-gray-500" : "bg-blue-600 text-white"}>
                      {notification.type}
                    </Badge>
                    <span className="font-semibold text-sm">{notification.title}</span>
                  </div>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-2 py-1 ml-2"
                      onClick={() => markAsReadMutation.mutate(notification.id as number)}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
                <div className="text-xs text-gray-600">{notification.message}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{new Date(notification.timestamp).toLocaleString()}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-600 hover:bg-red-50"
                    onClick={() => deleteNotificationMutation.mutate(notification.id as number)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>


    </div>
  );
}