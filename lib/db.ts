import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// node:sqlite を使った組み込みSQLite。追加依存なしで永続化できる。
// 接続は「最初のクエリ時」に遅延生成する。これにより next build の
// page-data 収集で複数ワーカーが同時に import してもDBを開かず、
// ロック競合（database is locked）を避けられる。

const DB_PATH = join(process.cwd(), "data", "flyheit.db");

function createDb(): DatabaseSync {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const d = new DatabaseSync(DB_PATH);
  d.exec("PRAGMA journal_mode = WAL;");
  d.exec("PRAGMA busy_timeout = 5000;");
  d.exec("PRAGMA foreign_keys = ON;");
  migrate(d);
  return d;
}

function ensureColumn(
  d: DatabaseSync,
  table: string,
  col: string,
  def: string,
) {
  const cols = d
    .prepare(`PRAGMA table_info(${table})`)
    .all() as unknown as { name: string }[];
  if (!cols.some((c) => c.name === col)) {
    d.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  }
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      value INTEGER NOT NULL DEFAULT 0,
      is_liability INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      market TEXT NOT NULL DEFAULT 'JP',
      currency TEXT NOT NULL DEFAULT 'JPY',
      quantity REAL NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,
      current_price REAL NOT NULL DEFAULT 0,
      annual_dividend REAL NOT NULL DEFAULT 0,
      note TEXT,
      price_updated_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client TEXT,
      status TEXT NOT NULL DEFAULT 'lead',
      amount INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      due_date TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total INTEGER NOT NULL DEFAULT 0,
      assets_total INTEGER NOT NULL DEFAULT 0,
      stocks_total INTEGER NOT NULL DEFAULT 0,
      liabilities_total INTEGER NOT NULL DEFAULT 0,
      breakdown TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      category TEXT NOT NULL DEFAULT 'other',
      amount INTEGER NOT NULL DEFAULT 0,
      memo TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'net_worth',
      target_amount INTEGER NOT NULL DEFAULT 0,
      current_amount INTEGER NOT NULL DEFAULT 0,
      deadline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'mid',
      due_date TEXT,
      project_id INTEGER,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      done_at TEXT
    );
  `);

  // 既存DBへの後付けカラム（idempotent）
  ensureColumn(d, "stocks", "annual_dividend", "REAL NOT NULL DEFAULT 0");

  const hasRate = d
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("usdjpy") as { value: string } | undefined;
  if (!hasRate) {
    d.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "usdjpy",
      "150",
    );
  }
}

const g = globalThis as unknown as { __flyheitDb?: DatabaseSync };

function instance(): DatabaseSync {
  return (g.__flyheitDb ??= createDb());
}

// 最初のプロパティアクセス時に初めて接続を生成する遅延プロキシ。
// 既存の `db.prepare(...)` 等の呼び出しはそのまま使える。
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_t, prop) {
    const real = instance() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

// 設定ヘルパー
export function getSetting(key: string, fallback = ""): string {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(key, value);
}

export function usdjpy(): number {
  const n = Number(getSetting("usdjpy", "150"));
  return Number.isFinite(n) && n > 0 ? n : 150;
}
