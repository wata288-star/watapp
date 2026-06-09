import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json();
  const exists = db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });

  db.prepare(
    `UPDATE projects SET name=?, client=?, status=?, amount=?, progress=?, start_date=?, due_date=?, note=?, updated_at=datetime('now') WHERE id=?`,
  ).run(
    String(b.name).trim(),
    b.client?.trim() || null,
    b.status ?? "lead",
    Math.round(Number(b.amount) || 0),
    Math.max(0, Math.min(100, Math.round(Number(b.progress) || 0))),
    b.start_date || null,
    b.due_date || null,
    b.note?.trim() || null,
    id,
  );
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
