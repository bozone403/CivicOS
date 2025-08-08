import { db } from '../../server/db.js';
import { users, bills, notifications } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function ensureUser(userId: string, email: string, username?: string) {
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  const [inserted] = await db.insert(users).values({
    id: userId,
    email,
    username: username || email.split('@')[0],
  }).returning();
  return inserted;
}

export async function ensureBill(title: string): Promise<number> {
  const found = await db.select().from(bills).limit(1);
  if (found.length > 0) return (found[0] as any).id as number;
  const [inserted] = await db.insert(bills).values({ title, status: 'active' }).returning();
  return (inserted as any).id as number;
}

export async function createNotification(userId: string, title: string, message: string, type: string = 'test') {
  const [row] = await db.insert(notifications).values({ userId, title, message, type }).returning();
  return row;
}


