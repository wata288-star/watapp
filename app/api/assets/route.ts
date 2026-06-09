import { db } from "@/lib/db";
import type { Asset } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db
    .prepare("SELECT * FROM assets ORDER BY is_liability ASC, value DESC")
    .all() as unknown as Asset[];
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (!b?.name?.trim()) {
    return Response.json({ error: "名称は必須です" }, { status: 400 });
  }
  const info = db
    .prepare(
      `INSERT INTO assets (name, category, value, is_liability, note) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      String(b.name).trim(),
      b.category ?? "other",
      Math.round(Number(b.value) || 0),
      b.is_liability ? 1 : 0,
      b.note?.trim() || null,
    );
  const row = db
    .prepare("SELECT * FROM assets WHERE id = ?")
    .get(info.lastInsertRowid as number);
  return Response.json(row, { status: 201 });
}
