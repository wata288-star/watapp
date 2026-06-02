import { db } from "@/lib/db";
import type { Stock } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db
    .prepare("SELECT * FROM stocks ORDER BY created_at DESC")
    .all() as unknown as Stock[];
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b?.symbol?.trim()) {
    return Response.json({ error: "ティッカーは必須です" }, { status: 400 });
  }
  const market = b.market === "US" ? "US" : "JP";
  const currency = market === "US" ? "USD" : "JPY";
  const info = db
    .prepare(
      `INSERT INTO stocks (symbol, name, market, currency, quantity, avg_cost, current_price, note, price_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(
      String(b.symbol).trim().toUpperCase(),
      b.name?.trim() || String(b.symbol).trim().toUpperCase(),
      market,
      currency,
      Number(b.quantity) || 0,
      Number(b.avg_cost) || 0,
      Number(b.current_price) || 0,
      b.note?.trim() || null,
    );
  const row = db
    .prepare("SELECT * FROM stocks WHERE id = ?")
    .get(info.lastInsertRowid as number);
  return Response.json(row, { status: 201 });
}
