import fs from "node:fs";
import path from "node:path";
import type { Database } from "./types";
import { buildSeed } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "karte.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

type GlobalWithDb = typeof globalThis & { __karteDb?: Database };

function loadOrSeed(): Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Database;
    } catch {
      // 破損時は初期データで再構築
    }
  }
  const seeded = buildSeed();
  fs.writeFileSync(DB_PATH, JSON.stringify(seeded));
  return seeded;
}

export function getDb(): Database {
  const g = globalThis as GlobalWithDb;
  if (!g.__karteDb) {
    g.__karteDb = loadOrSeed();
  }
  return g.__karteDb;
}

export function saveDb(): void {
  const g = globalThis as GlobalWithDb;
  if (!g.__karteDb) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(g.__karteDb));
  fs.renameSync(tmp, DB_PATH);
}

export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function machineCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const db = getDb();
  let code: string;
  do {
    let s = "";
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    code = `${s.slice(0, 4)}-${s.slice(4)}`;
  } while (db.machines.some((m) => m.code === code));
  return code;
}
