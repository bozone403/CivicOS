import fs from 'fs';
import path from 'path';

// Minimal TS client SDK generator from openapi.yaml for core endpoints
// Note: This is a lightweight generator; for full coverage consider openapi-typescript-codegen

const base = process.env.API_BASE_URL || 'https://civicos.onrender.com';

const header = `// Auto-generated minimal SDK
export interface RequestOptions { token?: string }
function headers(token?: string): Record<string,string> {
  return token ? { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } : { 'Content-Type': 'application/json' };
}
async function req<T=any>(url: string, method: string, body?: any, token?: string): Promise<T> {
  const res = await fetch(url, { method, headers: headers(token), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(res.status + ':' + (await res.text()));
  return (await res.json()) as T;
}
`;

const body = `export const CivicOS = {
  auth: {
    me: (opts: RequestOptions = {}) => req(base + '/api/auth/user', 'GET', undefined, opts.token),
    login: (email: string, password: string) => req(base + '/api/auth/login', 'POST', { email, password }),
  },
  social: {
    feed: (limit=20, offset=0, opts: RequestOptions = {}) => req(base + '/api/social/feed?limit='+limit+'&offset='+offset, 'GET', undefined, opts.token),
    createPost: (content: string, opts: RequestOptions = {}) => req(base + '/api/social/posts', 'POST', { content }, opts.token),
    sendMessage: (recipientId: string, content: string, opts: RequestOptions = {}) => req(base + '/api/social/messages', 'POST', { recipientId, content }, opts.token),
    unfollow: (followingId: string, opts: RequestOptions = {}) => req(base + '/api/social/unfollow', 'DELETE', { followingId }, opts.token),
  },
  friends: {
    list: (opts: RequestOptions = {}) => req(base + '/api/friends', 'GET', undefined, opts.token),
    pending: (opts: RequestOptions = {}) => req(base + '/api/friends/requests', 'GET', undefined, opts.token),
    request: (toUserId: string, opts: RequestOptions = {}) => req(base + '/api/friends/request', 'POST', { toUserId }, opts.token),
    accept: (requestId: number, opts: RequestOptions = {}) => req(base + '/api/friends/accept', 'POST', { requestId }, opts.token),
  },
  notifications: {
    list: (opts: RequestOptions = {}) => req(base + '/api/notifications', 'GET', undefined, opts.token),
    unread: (opts: RequestOptions = {}) => req(base + '/api/notifications/unread-count', 'GET', undefined, opts.token),
    readAll: (opts: RequestOptions = {}) => req(base + '/api/notifications/read-all', 'PATCH', undefined, opts.token),
  },
  identity: {
    submit: (email: string, opts: RequestOptions = {}) => req(base + '/api/identity/submit', 'POST', { email, termsAgreed: true }, opts.token),
    adminList: (opts: RequestOptions = {}) => req(base + '/api/admin/identity-verifications', 'GET', undefined, opts.token),
  },
  news: {
    list: () => req(base + '/api/news', 'GET'),
    create: (title: string, content: string, source: string, opts: RequestOptions = {}) => req(base + '/api/news', 'POST', { title, content, source, isPublished: true }, opts.token),
  },
  voting: {
    cast: (billId: number, vote: 'yes'|'no'|'abstain', opts: RequestOptions = {}) => req(base + '/api/voting/vote', 'POST', { billId, vote }, opts.token),
  },
  moderation: {
    summary: (opts: RequestOptions = {}) => req(base + '/api/moderation/summary', 'GET', undefined, opts.token),
    recentComments: (opts: RequestOptions = {}) => req(base + '/api/moderation/comments/recent', 'GET', undefined, opts.token),
    removeComment: (id: number, opts: RequestOptions = {}) => req(base + '/api/moderation/comments/'+id, 'DELETE', undefined, opts.token),
  },
  admin: {
    summary: (opts: RequestOptions = {}) => req(base + '/api/admin/summary', 'GET', undefined, opts.token),
  }
}
`;

const out = header + body;
const target = path.join(process.cwd(), 'client', 'src', 'lib', 'civicos-sdk.ts');
fs.writeFileSync(target, out);
// console.log removed for production


