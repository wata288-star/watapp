import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json();
  const exists = db.prepare("SELECT id FROM stocks WHERE id = ?").get(id);
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });

  const market = b.market === "US" ? "US" : "JP";
  const currency = market === "US" ? "USD" : "JPY";
  db.prepare(
    `UPDATE stocks SET symbol=?, name=?, market=?, currency=?, quantity=?, avg_cost=?, current_price=?, annual_dividend=?, note=?, updated_at=datetime('now') WHERE id=?`,
  ).run(
    String(b.symbol).trim().toUpperCase(),
    b.name?.trim() || String(b.symbol).trim().toUpperCase(),
    market,
    currency,
    Number(b.quantity) || 0,
    Number(b.avg_cost) || 0,
    Number(b.current_price) || 0,
    Number(b.annual_dividend) || 0,
    b.note?.trim() || null,
    id,
  );
  const row = db.prepare("SELECT * FROM stocks WHERE id = ?").get(id);
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.prepare("DELETE FROM stocks WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
