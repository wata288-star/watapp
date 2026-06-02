import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json();
  const exists = db.prepare("SELECT id FROM goals WHERE id = ?").get(id);
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });

  db.prepare(
    `UPDATE goals SET name=?, kind=?, target_amount=?, current_amount=?, deadline=? WHERE id=?`,
  ).run(
    String(b.name).trim(),
    b.kind === "custom" ? "custom" : "net_worth",
    Math.round(Number(b.target_amount) || 0),
    Math.round(Number(b.current_amount) || 0),
    b.deadline || null,
    id,
  );
  const row = db.prepare("SELECT * FROM goals WHERE id = ?").get(id);
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.prepare("DELETE FROM goals WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
