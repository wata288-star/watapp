import { db } from "@/lib/db";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  // 未完了→優先度高い順→期日近い順、完了は末尾
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       ORDER BY done ASC,
         CASE priority WHEN 'high' THEN 0 WHEN 'mid' THEN 1 ELSE 2 END ASC,
         (due_date IS NULL) ASC, due_date ASC, id DESC`,
    )
    .all() as unknown as Task[];
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b?.title?.trim()) {
    return Response.json({ error: "タイトルは必須です" }, { status: 400 });
  }
  const info = db
    .prepare(
      `INSERT INTO tasks (title, priority, due_date, project_id, note) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      String(b.title).trim(),
      ["low", "mid", "high"].includes(b.priority) ? b.priority : "mid",
      b.due_date || null,
      b.project_id ? Number(b.project_id) : null,
      b.note?.trim() || null,
    );
  const row = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(info.lastInsertRowid as number);
  return Response.json(row, { status: 201 });
}
