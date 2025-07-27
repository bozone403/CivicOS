import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Pin, 
  Eye, 
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Shield,
  Crown
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorMembershipType: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'citizens' | 'press' | 'government';
  isPinned: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface CreateAnnouncementData {
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'citizens' | 'press' | 'government';
  status: 'draft' | 'published';
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const PRIORITY_ICONS = {
  low: Clock,
  normal: Megaphone,
  high: AlertTriangle,
  urgent: AlertTriangle
};

const AUDIENCE_ICONS = {
  all: Globe,
  citizens: Users,
  press: Shield,
  government: Crown
};

export default function Announcements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filters, setFilters] = useState({
    status: 'published',
    priority: '',
    targetAudience: ''
  });

  // Fetch announcements
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.targetAudience) params.append('targetAudience', filters.targetAudience);
      
      const response = await apiRequest(`/api/announcements?${params.toString()}`, 'GET');
      return response;
    }
  });

  // Fetch user's permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiRequest('/api/permissions/me', 'GET');
      return response;
    },
    enabled: !!user
  });

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      return await apiRequest('/api/announcements', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowCreateDialog(false);
      toast({ title: "Announcement created!", description: "Your announcement has been published." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating announcement", 
        description: error.message || "Failed to create announcement.", 
        variant: "destructive" 
      });
    }
  });

  // Update announcement mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateAnnouncementData> }) => {
      return await apiRequest(`/api/announcements/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setEditingAnnouncement(null);
      toast({ title: "Announcement updated!", description: "Your announcement has been updated." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating announcement", 
        description: error.message || "Failed to update announcement.", 
        variant: "destructive" 
      });
    }
  });

  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/announcements/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: "Announcement deleted!", description: "The announcement has been removed." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting announcement", 
        description: error.message || "Failed to delete announcement.", 
        variant: "destructive" 
      });
    }
  });

  const announcements = announcementsData?.announcements || [];
  const userPermissions = permissionsData?.permissions?.permissions || [];

  const canCreateAnnouncements = userPermissions.includes('create_announcements');
  const canEditAnnouncements = userPermissions.includes('edit_announcements');
  const canDeleteAnnouncements = userPermissions.includes('delete_announcements');
  const canPinAnnouncements = userPermissions.includes('pin_announcements');

  const handleCreateAnnouncement = (data: CreateAnnouncementData) => {
    createMutation.mutate(data);
  };

  const handleUpdateAnnouncement = (id: number, data: Partial<CreateAnnouncementData>) => {
    updateMutation.mutate({ id, data });
  };

  const handleDeleteAnnouncement = (id: number) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityIcon = (priority: string) => {
    const Icon = PRIORITY_ICONS[priority as keyof typeof PRIORITY_ICONS] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getAudienceIcon = (audience: string) => {
    const Icon = AUDIENCE_ICONS[audience as keyof typeof AUDIENCE_ICONS] || Globe;
    return <Icon className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">
            Official announcements and updates from CivicOS
          </p>
        </div>
        
        {canCreateAnnouncements && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
              </DialogHeader>
              <CreateAnnouncementForm 
                onSubmit={handleCreateAnnouncement}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">Status:</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="priority-filter">Priority:</Label>
              <Select 
                value={filters.priority} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="audience-filter">Audience:</Label>
              <Select 
                value={filters.targetAudience} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, targetAudience: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="citizens">Citizens</SelectItem>
                  <SelectItem value="press">Press</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-600">
                {filters.status === 'published' 
                  ? "No published announcements at this time."
                  : "No announcements match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement: Announcement) => (
            <Card key={announcement.id} className={`${announcement.isPinned ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {announcement.authorName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(announcement.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {announcement.viewsCount} views
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={PRIORITY_COLORS[announcement.priority as keyof typeof PRIORITY_COLORS]}>
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(announcement.priority)}
                        {announcement.priority}
                      </div>
                    </Badge>
                    
                    <Badge variant="outline">
                      <div className="flex items-center gap-1">
                        {getAudienceIcon(announcement.targetAudience)}
                        {announcement.targetAudience}
                      </div>
                    </Badge>

                    {announcement.status === 'published' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Published
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge variant="outline">
                      {announcement.authorMembershipType}
                    </Badge>
                    {announcement.publishedAt && (
                      <span>Published {formatDate(announcement.publishedAt)}</span>
                    )}
                  </div>

                  {(canEditAnnouncements || canDeleteAnnouncements) && (
                    <div className="flex items-center gap-2">
                      {canEditAnnouncements && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAnnouncement(announcement)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      
                      {canDeleteAnnouncements && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingAnnouncement && (
        <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
            </DialogHeader>
            <EditAnnouncementForm 
              announcement={editingAnnouncement}
              onSubmit={(data) => handleUpdateAnnouncement(editingAnnouncement.id, data)}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Create Announcement Form Component
function CreateAnnouncementForm({ onSubmit, isLoading }: { 
  onSubmit: (data: CreateAnnouncementData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all',
    status: 'published'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter announcement title"
          required
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Enter announcement content"
          rows={6}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="audience">Target Audience</Label>
          <Select 
            value={formData.targetAudience} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="citizens">Citizens</SelectItem>
              <SelectItem value="press">Press</SelectItem>
              <SelectItem value="government">Government</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Announcement"}
        </Button>
      </div>
    </form>
  );
}

// Edit Announcement Form Component
function EditAnnouncementForm({ announcement, onSubmit, isLoading }: { 
  announcement: Announcement;
  onSubmit: (data: Partial<CreateAnnouncementData>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    targetAudience: announcement.targetAudience,
    status: announcement.status === 'archived' ? 'draft' : announcement.status
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter announcement title"
          required
        />
      </div>

      <div>
        <Label htmlFor="edit-content">Content</Label>
        <Textarea
          id="edit-content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Enter announcement content"
          rows={6}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="edit-priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="edit-audience">Target Audience</Label>
          <Select 
            value={formData.targetAudience} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="citizens">Citizens</SelectItem>
              <SelectItem value="press">Press</SelectItem>
              <SelectItem value="government">Government</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="edit-status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Announcement"}
        </Button>
      </div>
    </form>
  );
} 