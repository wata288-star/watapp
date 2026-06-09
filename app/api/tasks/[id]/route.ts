import { db } from "@/lib/db";
import type { Task } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json();
  const cur = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
    | Task
    | undefined;
  if (!cur) return Response.json({ error: "not found" }, { status: 404 });

  const done = b.done != null ? (b.done ? 1 : 0) : cur.done;
  const doneAt =
    done && !cur.done
      ? new Date().toISOString()
      : !done
        ? null
        : cur.done_at;

  db.prepare(
    `UPDATE tasks SET title=?, priority=?, due_date=?, project_id=?, note=?, done=?, done_at=? WHERE id=?`,
  ).run(
    b.title != null ? String(b.title).trim() : cur.title,
    b.priority != null ? b.priority : cur.priority,
    b.due_date !== undefined ? b.due_date || null : cur.due_date,
    b.project_id !== undefined
      ? b.project_id
        ? Number(b.project_id)
        : null
      : cur.project_id,
    b.note !== undefined ? b.note?.trim() || null : cur.note,
    done,
    doneAt,
    id,
  );
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
