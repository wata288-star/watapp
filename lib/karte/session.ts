import { cookies } from "next/headers";
import { cache } from "react";
import { getDb, saveDb, uid } from "./db";
import type { Company, User } from "./types";

const COOKIE_NAME = "mk_session";

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const id = uid("sess");
  db.sessions.push({ id, userId, createdAt: new Date().toISOString() });
  saveDb();
  const jar = await cookies();
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (sid) {
    const db = getDb();
    db.sessions = db.sessions.filter((s) => s.id !== sid);
    saveDb();
  }
  jar.delete(COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<(User & { company: Company }) | null> => {
  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (!sid) return null;
  const db = getDb();
  const session = db.sessions.find((s) => s.id === sid);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;
  const company = db.companies.find((c) => c.id === user.companyId);
  if (!company) return null;
  return { ...user, company };
});
