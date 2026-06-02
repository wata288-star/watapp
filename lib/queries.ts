import "server-only";
import { db, usdjpy } from "./db";
import type { Asset, Stock, Project, Snapshot } from "./types";
import { todayISO } from "./format";

export function stockMarketValueJPY(s: Stock): number {
  const v = s.quantity * s.current_price;
  return s.currency === "USD" ? v * usdjpy() : v;
}

export function stockCostJPY(s: Stock): number {
  const c = s.quantity * s.avg_cost;
  return s.currency === "USD" ? c * usdjpy() : c;
}

export interface Summary {
  netWorth: number;
  assetsTotal: number; // 現物資産（非負債、株式除く）
  stocksTotal: number; // 株式評価額(JPY)
  stocksCost: number;
  stocksPL: number;
  liabilitiesTotal: number;
  breakdown: { key: string; label: string; value: number }[];
  usdjpy: number;
  counts: { assets: number; stocks: number; projects: number };
  pipeline: { open: number; won: number };
  cashflow: { month: string; income: number; expense: number; net: number };
  tasks: { open: number; done: number; dueSoon: number };
  goals: {
    id: number;
    name: string;
    kind: string;
    target: number;
    current: number;
    progress: number;
    deadline: string | null;
  }[];
}

const CAT_LABELS: Record<string, string> = {
  cash: "現金",
  deposit: "預貯金",
  real_estate: "不動産",
  vehicle: "車両",
  crypto: "暗号資産",
  securities: "有価証券",
  insurance: "保険",
  receivable: "売掛・貸付",
  other: "その他",
  stocks: "株式",
};

export function computeSummary(): Summary {
  const assets = db
    .prepare("SELECT * FROM assets")
    .all() as unknown as Asset[];
  const stocks = db
    .prepare("SELECT * FROM stocks")
    .all() as unknown as Stock[];

  let assetsTotal = 0;
  let liabilitiesTotal = 0;
  const catMap = new Map<string, number>();
  for (const a of assets) {
    if (a.is_liability) {
      liabilitiesTotal += a.value;
    } else {
      assetsTotal += a.value;
      catMap.set(a.category, (catMap.get(a.category) ?? 0) + a.value);
    }
  }

  let stocksTotal = 0;
  let stocksCost = 0;
  for (const s of stocks) {
    stocksTotal += stockMarketValueJPY(s);
    stocksCost += stockCostJPY(s);
  }
  if (stocksTotal > 0) catMap.set("stocks", stocksTotal);

  const breakdown = [...catMap.entries()]
    .map(([key, value]) => ({ key, label: CAT_LABELS[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);

  const netWorth = assetsTotal + stocksTotal - liabilitiesTotal;

  const projects = db
    .prepare("SELECT status, amount FROM projects")
    .all() as unknown as { status: string; amount: number }[];
  let open = 0;
  let won = 0;
  for (const p of projects) {
    if (p.status === "closed") won += p.amount;
    else if (p.status !== "lost") open += p.amount;
  }

  // 今月の収支
  const month = todayISO().slice(0, 7);
  const cf = db
    .prepare(
      `SELECT type, COALESCE(SUM(amount),0) AS total FROM transactions
       WHERE substr(date,1,7) = ? GROUP BY type`,
    )
    .all(month) as unknown as { type: string; total: number }[];
  let income = 0;
  let expense = 0;
  for (const r of cf) {
    if (r.type === "income") income = r.total;
    else expense = r.total;
  }

  // タスク
  const tRows = db
    .prepare("SELECT done, due_date FROM tasks")
    .all() as unknown as { done: number; due_date: string | null }[];
  const today = todayISO();
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  let tOpen = 0;
  let tDone = 0;
  let dueSoon = 0;
  for (const t of tRows) {
    if (t.done) tDone++;
    else {
      tOpen++;
      if (t.due_date && t.due_date <= soon && t.due_date >= today) dueSoon++;
      else if (t.due_date && t.due_date < today) dueSoon++;
    }
  }

  // 目標
  const goalRows = db
    .prepare("SELECT * FROM goals ORDER BY created_at ASC")
    .all() as unknown as {
    id: number;
    name: string;
    kind: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
  }[];
  const goals = goalRows.map((g) => {
    const current = g.kind === "net_worth" ? netWorth : g.current_amount;
    const progress =
      g.target_amount > 0 ? (current / g.target_amount) * 100 : 0;
    return {
      id: g.id,
      name: g.name,
      kind: g.kind,
      target: g.target_amount,
      current,
      progress,
      deadline: g.deadline,
    };
  });

  return {
    netWorth,
    assetsTotal,
    stocksTotal,
    stocksCost,
    stocksPL: stocksTotal - stocksCost,
    liabilitiesTotal,
    breakdown,
    usdjpy: usdjpy(),
    counts: {
      assets: assets.length,
      stocks: stocks.length,
      projects: projects.length,
    },
    pipeline: { open, won },
    cashflow: { month, income, expense, net: income - expense },
    tasks: { open: tOpen, done: tDone, dueSoon },
    goals,
  };
}

// 今日のスナップショットを記録（同日があれば上書き）
export function recordSnapshot(note?: string): Snapshot {
  const s = computeSummary();
  const date = todayISO();
  const breakdown = JSON.stringify(
    Object.fromEntries(s.breakdown.map((b) => [b.key, b.value])),
  );
  const existing = db
    .prepare("SELECT id FROM snapshots WHERE date = ?")
    .get(date) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE snapshots SET total=?, assets_total=?, stocks_total=?, liabilities_total=?, breakdown=?, note=? WHERE id=?`,
    ).run(
      s.netWorth,
      s.assetsTotal,
      s.stocksTotal,
      s.liabilitiesTotal,
      breakdown,
      note ?? null,
      existing.id,
    );
    return db
      .prepare("SELECT * FROM snapshots WHERE id = ?")
      .get(existing.id) as unknown as Snapshot;
  }

  const info = db
    .prepare(
      `INSERT INTO snapshots (date, total, assets_total, stocks_total, liabilities_total, breakdown, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      date,
      s.netWorth,
      s.assetsTotal,
      s.stocksTotal,
      s.liabilitiesTotal,
      breakdown,
      note ?? null,
    );
  return db
    .prepare("SELECT * FROM snapshots WHERE id = ?")
    .get(info.lastInsertRowid as number) as unknown as Snapshot;
}

export function listSnapshots(): Snapshot[] {
  return db
    .prepare("SELECT * FROM snapshots ORDER BY date ASC")
    .all() as unknown as Snapshot[];
}
