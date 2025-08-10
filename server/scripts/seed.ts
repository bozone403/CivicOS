import 'dotenv/config';
import { db } from '../../server/db.js';
import { users, userPermissions, newsArticles, bills, permissions } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

async function ensureUser(id: string, email: string, username?: string) {
  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (existing.length > 0) return existing[0];
  const [row] = await db.insert(users).values({ id, email, username: username || email.split('@')[0] }).returning();
  return row;
}

async function grantPermission(userId: string, permissionName: string) {
  const [perm] = await db.select().from(permissions).where(eq(permissions.name, permissionName)).limit(1);
  const permissionId = perm ? (perm as any).id as number : (await db.insert(permissions).values({ name: permissionName, description: permissionName, isActive: true }).returning())[0].id as number;
  await db.insert(userPermissions).values({ userId, permissionId, permissionName, isGranted: true }).returning().catch(() => undefined);
}

async function ensureBill(title: string) {
  const existing = await db.select().from(bills).limit(1);
  if (existing.length > 0) return existing[0];
  const [row] = await db.insert(bills).values({ title, status: 'active' }).returning();
  return row;
}

async function ensureNewsArticle(title: string) {
  const existing = await db.select().from(newsArticles).limit(1);
  if (existing.length > 0) return existing[0];
  const [row] = await db.insert(newsArticles).values({ title, content: 'Seed content', source: 'Seed', category: 'politics', publishedAt: new Date() }).returning();
  return row;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@civicos.ca';
  const admin = await ensureUser('admin-1', adminEmail, 'admin');
  await grantPermission((admin as any).id, 'admin.identity.review');
  await grantPermission((admin as any).id, 'admin.news.manage');

  await ensureUser('user-1', 'user1@example.com', 'user1');
  await ensureUser('user-2', 'user2@example.com', 'user2');
  await ensureBill('Seed Test Bill');
  await ensureNewsArticle('Seed News Article');

  // console.log removed for production
}

main()
  .then(() => process.exit(0))
  .catch((_e) => {
    process.exit(1);
  });

