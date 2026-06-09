import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json();
  const exists = db.prepare("SELECT id FROM transactions WHERE id = ?").get(id);
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });

  db.prepare(
    `UPDATE transactions SET date=?, type=?, category=?, amount=?, memo=? WHERE id=?`,
  ).run(
    b.date || new Date().toISOString().slice(0, 10),
    b.type === "income" ? "income" : "expense",
    b.category?.trim() || "その他",
    Math.round(Number(b.amount) || 0),
    b.memo?.trim() || null,
    id,
  );
  const row = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
