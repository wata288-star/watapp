import { db } from "@/lib/db";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const month = new URL(req.url).searchParams.get("month"); // YYYY-MM
  const rows = (
    month
      ? db
          .prepare(
            "SELECT * FROM transactions WHERE substr(date,1,7) = ? ORDER BY date DESC, id DESC",
          )
          .all(month)
      : db
          .prepare("SELECT * FROM transactions ORDER BY date DESC, id DESC")
          .all()
  ) as unknown as Transaction[];
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  const amount = Math.round(Number(b.amount) || 0);
  if (!amount) {
    return Response.json({ error: "金額は必須です" }, { status: 400 });
  }
  const info = db
    .prepare(
      `INSERT INTO transactions (date, type, category, amount, memo) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      b.date || new Date().toISOString().slice(0, 10),
      b.type === "income" ? "income" : "expense",
      b.category?.trim() || "その他",
      amount,
      b.memo?.trim() || null,
    );
  const row = db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .get(info.lastInsertRowid as number);
  return Response.json(row, { status: 201 });
}
