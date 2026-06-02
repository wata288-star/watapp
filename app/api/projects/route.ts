import { db } from "@/lib/db";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all() as unknown as Project[];
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b?.name?.trim()) {
    return Response.json({ error: "案件名は必須です" }, { status: 400 });
  }
  const info = db
    .prepare(
      `INSERT INTO projects (name, client, status, amount, progress, start_date, due_date, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      String(b.name).trim(),
      b.client?.trim() || null,
      b.status ?? "lead",
      Math.round(Number(b.amount) || 0),
      Math.max(0, Math.min(100, Math.round(Number(b.progress) || 0))),
      b.start_date || null,
      b.due_date || null,
      b.note?.trim() || null,
    );
  const row = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(info.lastInsertRowid as number);
  return Response.json(row, { status: 201 });
}
