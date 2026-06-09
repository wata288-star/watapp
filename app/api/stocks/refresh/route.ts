import { db, setSetting } from "@/lib/db";
import type { Stock } from "@/lib/types";

// Stooq の無料CSVクォート（APIキー不要）で現在値を取得する。
// JP銘柄: 7203 -> 7203.jp / US銘柄: AAPL -> aapl.us

function stooqSymbol(s: Stock): string {
  const base = s.symbol.replace(/\.(JP|US|T)$/i, "").toLowerCase();
  return s.market === "US" ? `${base}.us` : `${base}.jp`;
}

async function fetchClose(symbol: string): Promise<number | null> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return null;
    const cols = lines[1].split(",");
    const close = Number(cols[6]);
    return Number.isFinite(close) && close > 0 ? close : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request) {
  let ids: number[] | null = null;
  try {
    const b = await req.json();
    if (Array.isArray(b?.ids)) ids = b.ids.map(Number);
  } catch {
    // body 無しは全件更新
  }

  const stocks = (
    ids && ids.length
      ? db
          .prepare(
            `SELECT * FROM stocks WHERE id IN (${ids.map(() => "?").join(",")})`,
          )
          .all(...ids)
      : db.prepare("SELECT * FROM stocks").all()
  ) as unknown as Stock[];

  const updated: { id: number; symbol: string; price: number }[] = [];
  const failed: { id: number; symbol: string }[] = [];

  for (const s of stocks) {
    const close = await fetchClose(stooqSymbol(s));
    if (close == null) {
      failed.push({ id: s.id, symbol: s.symbol });
      continue;
    }
    db.prepare(
      "UPDATE stocks SET current_price=?, price_updated_at=datetime('now'), updated_at=datetime('now') WHERE id=?",
    ).run(close, s.id);
    updated.push({ id: s.id, symbol: s.symbol, price: close });
  }

  // 為替(USDJPY)も更新を試みる
  let fx: number | null = null;
  const fxClose = await fetchClose("usdjpy");
  if (fxClose != null) {
    fx = fxClose;
    setSetting("usdjpy", String(fxClose));
  }

  return Response.json({
    updated,
    failed,
    usdjpy: fx,
    note:
      failed.length && !updated.length
        ? "外部APIに接続できませんでした。ネットワーク制限環境では手動で現在値を入力してください。"
        : undefined,
  });
}
