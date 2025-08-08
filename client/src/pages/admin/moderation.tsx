import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCivicOsClient } from '@/lib/civicos-sdk-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function AdminModerationPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const client = createCivicOsClient();
  const { user } = useAuth();
  const [limit, setLimit] = useState(25);
  const [query, setQuery] = useState('');

  const { data: dashboard, isLoading, isError, error } = useQuery({
    queryKey: ['admin','moderation-dashboard', limit],
    queryFn: async () => {
      const res = await client.request({ method: 'GET', url: `/api/admin/moderation-dashboard?limit=${limit}` });
      return res as any;
    },
    enabled: !!user?.isAdmin,
  });

  const removeComment = useMutation({
    mutationFn: async (id: number) => {
      await client.request({ method: 'DELETE', url: `/api/moderation/comments/${id}` });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin','moderation-dashboard'] });
      toast({ title: 'Comment removed' });
    },
    onError: () => toast({ title: 'Failed to remove comment', variant: 'destructive' })
  });

  if (!user?.isAdmin) {
    return <div className="p-6">Access denied.</div>;
  }

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError) return <div className="p-6">Failed to load dashboard.</div>;

  const filteredPosts = useMemo(() => {
    const txt = query.trim().toLowerCase();
    if (!txt) return dashboard?.recent?.posts || [];
    return (dashboard?.recent?.posts || []).filter((p: any) => (p.content || '').toLowerCase().includes(txt));
  }, [dashboard, query]);

  const filteredComments = useMemo(() => {
    const txt = query.trim().toLowerCase();
    if (!txt) return dashboard?.recent?.comments || [];
    return (dashboard?.recent?.comments || []).filter((c: any) => (c.content || '').toLowerCase().includes(txt));
  }, [dashboard, query]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter posts/comments…"
          className="w-full max-w-md border rounded px-3 py-2"
        />
        <Button variant="secondary" onClick={() => setLimit((l) => Math.min(200, l + 25))}>Load more</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat title="Users" value={dashboard?.summary?.users} />
        <Stat title="Posts" value={dashboard?.summary?.posts} />
        <Stat title="Comments" value={dashboard?.summary?.comments} />
        <Stat title="Notifications" value={dashboard?.summary?.notifications} />
        <Stat title="News" value={dashboard?.summary?.news} />
        <Stat title="Votes" value={dashboard?.summary?.votes} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {filteredPosts.map((p: any) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.content?.slice(0,120) || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.createdAt || p.created_at).toLocaleString()}</div>
                </div>
                {/* Placeholder remove post if needed later */}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {filteredComments.map((c: any) => (
              <li key={c.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.content?.slice(0,160) || '—'}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.createdAt || c.created_at).toLocaleString()}</div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeComment.mutate(c.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="text-2xl font-semibold">{value ?? 0}</div>
      </CardContent>
    </Card>
  );
}


