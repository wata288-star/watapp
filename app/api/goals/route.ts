import { db } from "@/lib/db";
import type { Goal } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db
    .prepare("SELECT * FROM goals ORDER BY created_at ASC")
    .all() as unknown as Goal[];
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b?.name?.trim()) {
    return Response.json({ error: "目標名は必須です" }, { status: 400 });
  }
  const info = db
    .prepare(
      `INSERT INTO goals (name, kind, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      String(b.name).trim(),
      b.kind === "custom" ? "custom" : "net_worth",
      Math.round(Number(b.target_amount) || 0),
      Math.round(Number(b.current_amount) || 0),
      b.deadline || null,
    );
  const row = db
    .prepare("SELECT * FROM goals WHERE id = ?")
    .get(info.lastInsertRowid as number);
  return Response.json(row, { status: 201 });
}
