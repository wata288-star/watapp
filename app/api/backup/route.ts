import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const TABLES: Record<string, string[]> = {
  assets: ["id", "name", "category", "value", "is_liability", "note", "created_at", "updated_at"],
  stocks: ["id", "symbol", "name", "market", "currency", "quantity", "avg_cost", "current_price", "annual_dividend", "note", "price_updated_at", "created_at", "updated_at"],
  projects: ["id", "name", "client", "status", "amount", "progress", "start_date", "due_date", "note", "created_at", "updated_at"],
  transactions: ["id", "date", "type", "category", "amount", "memo", "created_at"],
  goals: ["id", "name", "kind", "target_amount", "current_amount", "deadline", "created_at"],
  tasks: ["id", "title", "done", "priority", "due_date", "project_id", "note", "created_at", "done_at"],
  snapshots: ["id", "date", "total", "assets_total", "stocks_total", "liabilities_total", "breakdown", "note", "created_at"],
  settings: ["key", "value"],
};

export async function GET() {
  const data: Record<string, unknown[]> = {};
  for (const t of Object.keys(TABLES)) {
    data[t] = db.prepare(`SELECT * FROM ${t}`).all() as unknown[];
  }
  const body = JSON.stringify(
    { app: "flyheit", version: 1, exported_at: new Date().toISOString(), data },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="flyheit-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const data = payload?.data;
  if (!data || typeof data !== "object") {
    return Response.json({ error: "不正なバックアップファイルです" }, { status: 400 });
  }

  try {
    db.exec("BEGIN");
    for (const [table, cols] of Object.entries(TABLES)) {
      const rows = data[table];
      if (!Array.isArray(rows)) continue;
      db.exec(`DELETE FROM ${table}`);
      const placeholders = cols.map(() => "?").join(",");
      const stmt = db.prepare(
        `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`,
      );
      for (const row of rows) {
        const vals = cols.map((c) => {
          const v = (row as Record<string, unknown>)[c];
          return (v ?? null) as string | number | bigint | null;
        });
        stmt.run(...vals);
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    return Response.json(
      { error: "インポートに失敗しました: " + (e as Error).message },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
