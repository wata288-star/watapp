"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { yen, num, pct, fmtDate } from "@/lib/format";
import type { Stock } from "@/lib/types";

type Draft = {
  id?: number;
  symbol: string;
  name: string;
  market: "JP" | "US";
  quantity: string;
  avg_cost: string;
  current_price: string;
  note: string;
};

const EMPTY: Draft = {
  symbol: "",
  name: "",
  market: "JP",
  quantity: "",
  avg_cost: "",
  current_price: "",
  note: "",
};

export default function StocksPage() {
  const [rows, setRows] = useState<Stock[]>([]);
  const [rate, setRate] = useState(150);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, st] = await Promise.all([
      fetch("/api/stocks").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setRows(s);
    setRate(Number(st.usdjpy) || 150);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const mvJPY = (s: Stock) => {
    const v = s.quantity * s.current_price;
    return s.currency === "USD" ? v * rate : v;
  };
  const costJPY = (s: Stock) => {
    const c = s.quantity * s.avg_cost;
    return s.currency === "USD" ? c * rate : c;
  };

  const totalMV = rows.reduce((a, s) => a + mvJPY(s), 0);
  const totalCost = rows.reduce((a, s) => a + costJPY(s), 0);
  const totalPL = totalMV - totalCost;
  const totalPLpct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const save = async () => {
    if (!draft || !draft.symbol.trim()) return;
    setSaving(true);
    const body = {
      symbol: draft.symbol,
      name: draft.name,
      market: draft.market,
      quantity: Number(draft.quantity) || 0,
      avg_cost: Number(draft.avg_cost) || 0,
      current_price: Number(draft.current_price) || 0,
      note: draft.note,
    };
    await fetch(draft.id ? `/api/stocks/${draft.id}` : "/api/stocks", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setDraft(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/stocks/${id}`, { method: "DELETE" });
    load();
  };

  const refresh = async () => {
    setRefreshing(true);
    setMsg(null);
    const res = await fetch("/api/stocks/refresh", { method: "POST" }).then(
      (r) => r.json(),
    );
    setRefreshing(false);
    if (res.note) setMsg(res.note);
    else
      setMsg(
        `${res.updated.length}銘柄の現在値を更新${res.usdjpy ? ` / USDJPY=${res.usdjpy}` : ""}${res.failed.length ? ` (${res.failed.length}件取得失敗)` : ""}`,
      );
    load();
  };

  const edit = (s: Stock) =>
    setDraft({
      id: s.id,
      symbol: s.symbol,
      name: s.name,
      market: s.market,
      quantity: String(s.quantity),
      avg_cost: String(s.avg_cost),
      current_price: String(s.current_price),
      note: s.note ?? "",
    });

  const saveRate = async (v: number) => {
    setRate(v);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdjpy: v }),
    });
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">株式管理</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            保有銘柄・取得単価・損益（API連携で現在値を自動取得）
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={refreshing || rows.length === 0}
            className="btn btn-ghost disabled:opacity-50"
          >
            {refreshing ? "取得中..." : "↻ 現在値を更新"}
          </button>
          <button onClick={() => setDraft({ ...EMPTY })} className="btn btn-primary">
            ＋ 銘柄を追加
          </button>
        </div>
      </header>

      {msg && (
        <div className="card px-4 py-2.5 text-[13px] text-[var(--muted)]">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="評価額合計" value={yen(totalMV)} />
        <Stat label="取得原価" value={yen(totalCost)} />
        <Stat
          label="評価損益"
          value={yen(totalPL)}
          cls={totalPL >= 0 ? "pos" : "neg"}
        />
        <Stat
          label="損益率"
          value={pct(totalPLpct)}
          cls={totalPL >= 0 ? "pos" : "neg"}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
          <span className="text-[13px] text-[var(--muted)] font-semibold">
            保有銘柄
          </span>
          <label className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
            USD/JPY
            <input
              className="input !w-24 !py-1.5 !text-[13px]"
              type="number"
              value={rate}
              onChange={(e) => saveRate(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)] text-sm">
            銘柄がまだありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>銘柄</th>
                  <th className="text-right">数量</th>
                  <th className="text-right">取得単価</th>
                  <th className="text-right">現在値</th>
                  <th className="text-right">評価額(円)</th>
                  <th className="text-right">損益</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const pl = mvJPY(s) - costJPY(s);
                  const plp =
                    costJPY(s) > 0 ? (pl / costJPY(s)) * 100 : 0;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="font-medium">
                          {s.symbol}{" "}
                          <span className="text-[10px] text-[var(--muted)] border border-[var(--border)] rounded px-1 py-0.5 ml-1">
                            {s.market}
                          </span>
                        </div>
                        <div className="text-[12px] text-[var(--muted)]">
                          {s.name}
                          {s.price_updated_at &&
                            ` · ${fmtDate(s.price_updated_at)}`}
                        </div>
                      </td>
                      <td className="text-right">{num(s.quantity)}</td>
                      <td className="text-right">
                        {s.currency === "USD" ? "$" : "¥"}
                        {num(s.avg_cost, s.currency === "USD" ? 2 : 0)}
                      </td>
                      <td className="text-right">
                        {s.currency === "USD" ? "$" : "¥"}
                        {num(s.current_price, s.currency === "USD" ? 2 : 0)}
                      </td>
                      <td className="text-right font-medium">{yen(mvJPY(s))}</td>
                      <td
                        className={`text-right font-medium ${pl >= 0 ? "pos" : "neg"}`}
                      >
                        {yen(pl)}
                        <div className="text-[11px]">{pct(plp)}</div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <button
                          className="text-[var(--muted)] hover:text-[var(--text)] px-2"
                          onClick={() => edit(s)}
                        >
                          編集
                        </button>
                        <button
                          className="neg hover:opacity-70 px-2"
                          onClick={() => remove(s.id)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[var(--muted)]">
        ティッカー例: 日本株 = 7203（トヨタ）、米国株 = AAPL。「現在値を更新」は
        Stooq の無料データを使用します（ネットワーク制限環境では手動入力）。
      </p>

      {draft && (
        <Modal
          title={draft.id ? "銘柄を編集" : "銘柄を追加"}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                キャンセル
              </button>
              <button
                className="btn btn-primary disabled:opacity-50"
                onClick={save}
                disabled={saving || !draft.symbol.trim()}
              >
                保存
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ティッカー</label>
                <input
                  className="input uppercase"
                  value={draft.symbol}
                  onChange={(e) =>
                    setDraft({ ...draft, symbol: e.target.value })
                  }
                  placeholder="7203 / AAPL"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">市場</label>
                <select
                  className="select"
                  value={draft.market}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      market: e.target.value as "JP" | "US",
                    })
                  }
                >
                  <option value="JP">日本株 (JPY)</option>
                  <option value="US">米国株 (USD)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">銘柄名</label>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="トヨタ自動車"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">数量</label>
                <input
                  className="input"
                  type="number"
                  value={draft.quantity}
                  onChange={(e) =>
                    setDraft({ ...draft, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">取得単価</label>
                <input
                  className="input"
                  type="number"
                  value={draft.avg_cost}
                  onChange={(e) =>
                    setDraft({ ...draft, avg_cost: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">現在値</label>
                <input
                  className="input"
                  type="number"
                  value={draft.current_price}
                  onChange={(e) =>
                    setDraft({ ...draft, current_price: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="label">メモ</label>
              <textarea
                className="textarea"
                rows={2}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  cls = "",
}: {
  label: string;
  value: string;
  cls?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-[12px] text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-bold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
