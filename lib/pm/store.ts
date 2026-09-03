// サーバーサイドの永続化レイヤー
// data/pm-state.json に JSON で保存する。DB を用意しなくても
// チーム全員が同じデータを見られるようにするための最小構成。
//
// 注意: このモジュールは Node ランタイム（Route Handler）専用。

import fs from "node:fs";
import path from "node:path";
import type { Collection, PmState } from "./types";
import { buildSeed } from "./seed";

// 保存先は <プロジェクトルート>/data/pm-state.json。
// PM_DATA_DIR を設定すれば別の場所（永続ボリュームなど）に逃がせる。
// バンドラのファイル追跡を広げないよう、パスの解決は実行時まで遅延させている。
function dataDir(): string {
  return process.env.PM_DATA_DIR || path.join(process.cwd(), "data");
}

function dataFile(): string {
  return path.join(dataDir(), "pm-state.json");
}

let cache: PmState | null = null;
/** 書き込みを直列化するためのキュー */
let writeChain: Promise<void> = Promise.resolve();

function ensureDir() {
  const dir = dataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** シードに新しく増えたキーを既存データへ補完する（マイグレーション代わり） */
function withDefaults(loaded: Partial<PmState>): PmState {
  const seed = buildSeed();
  const merged = { ...seed, ...loaded } as PmState;
  merged.newsMeta = { ...seed.newsMeta, ...(loaded.newsMeta || {}) };
  return merged;
}

export function readState(): PmState {
  if (cache) return cache;
  ensureDir();
  const file = dataFile();
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      cache = withDefaults(JSON.parse(raw));
      return cache;
    } catch {
      // 壊れていたら退避してシードから作り直す
      try {
        fs.renameSync(file, `${file}.broken-${Date.now()}`);
      } catch {
        /* noop */
      }
    }
  }
  cache = buildSeed();
  persist(cache);
  return cache;
}

function persist(state: PmState) {
  ensureDir();
  const file = dataFile();
  const tmp = `${file}.tmp`;
  writeChain = writeChain.then(async () => {
    await fs.promises.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
    await fs.promises.rename(tmp, file);
  });
}

export function writeState(state: PmState): PmState {
  cache = state;
  persist(state);
  return state;
}

export function mutate(fn: (state: PmState) => void): PmState {
  const state = readState();
  fn(state);
  return writeState(state);
}

export function resetState(): PmState {
  return writeState(buildSeed());
}

/** コレクションの要素は必ず id を持つ */
type WithId = { id: string };

export function listItems(collection: Collection): WithId[] {
  return (readState()[collection] as unknown as WithId[]) ?? [];
}

export function createItem(collection: Collection, item: Record<string, unknown>): WithId {
  const record = { ...item, id: (item.id as string) || newId(collection) } as WithId;
  mutate((state) => {
    const list = state[collection] as unknown as WithId[];
    list.unshift(record);
  });
  return record;
}

export function updateItem(
  collection: Collection,
  id: string,
  patch: Record<string, unknown>,
): WithId | null {
  let result: WithId | null = null;
  mutate((state) => {
    const list = state[collection] as unknown as WithId[];
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], ...patch, id };
    result = list[idx];
  });
  return result;
}

export function deleteItem(collection: Collection, id: string): boolean {
  let ok = false;
  mutate((state) => {
    const list = state[collection] as unknown as WithId[];
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return;
    list.splice(idx, 1);
    ok = true;
  });
  return ok;
}

let counter = 0;
export function newId(prefix = "x"): string {
  counter = (counter + 1) % 100000;
  return `${prefix.slice(0, 3)}-${Date.now().toString(36)}-${counter.toString(36)}`;
}
