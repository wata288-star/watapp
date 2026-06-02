import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json();
  const exists = db.prepare("SELECT id FROM assets WHERE id = ?").get(id);
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });

  db.prepare(
    `UPDATE assets SET name=?, category=?, value=?, is_liability=?, note=?, updated_at=datetime('now') WHERE id=?`,
  ).run(
    String(b.name).trim(),
    b.category ?? "other",
    Math.round(Number(b.value) || 0),
    b.is_liability ? 1 : 0,
    b.note?.trim() || null,
    id,
  );
  const row = db.prepare("SELECT * FROM assets WHERE id = ?").get(id);
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
