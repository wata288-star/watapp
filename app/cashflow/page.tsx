"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Modal } from "@/components/Modal";
import { BarChart } from "@/components/Charts";
import { yen, pct, fmtDate } from "@/lib/format";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type Transaction,
} from "@/lib/types";

type Draft = {
  id?: number;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: string;
  memo: string;
};

function monthStr(d: Date) {
  return d.toISOString().slice(0, 10).slice(0, 7);
}
function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return monthStr(d);
}

export default function CashflowPage() {
  const [all, setAll] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(() => monthStr(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setAll(await fetch("/api/transactions").then((r) => r.json()));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const rows = all.filter((t) => t.date.slice(0, 7) === month);
  const income = rows
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = rows
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  const savingRate = income > 0 ? (net / income) * 100 : 0;

  // 直近6ヶ月の集計
  const chartData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) months.push(shiftMonth(month, -i));
    return months.map((m) => {
      const ms = all.filter((t) => t.date.slice(0, 7) === m);
      return {
        label: m.slice(5) + "月",
        income: ms
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: ms
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [all, month]);

  const newDraft = (type: "income" | "expense"): Draft => ({
    date: month + "-" + String(new Date().getDate()).padStart(2, "0"),
    type,
    category: type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    amount: "",
    memo: "",
  });

  const save = async () => {
    if (!draft || !Number(draft.amount)) return;
    setSaving(true);
    await fetch(
      draft.id ? `/api/transactions/${draft.id}` : "/api/transactions",
      {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: draft.date,
          type: draft.type,
          category: draft.category,
          amount: Number(draft.amount),
          memo: draft.memo,
        }),
      },
    );
    setSaving(false);
    setDraft(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const cats = draft?.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">収支・家計管理</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            月ごとの収入・支出とキャッシュフロー
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => setDraft(newDraft("income"))}
          >
            ＋ 収入
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setDraft(newDraft("expense"))}
          >
            ＋ 支出
          </button>
        </div>
      </header>

      {/* 月セレクタ */}
      <div className="flex items-center justify-center gap-4">
        <button
          className="btn btn-ghost !px-3"
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          ‹
        </button>
        <span className="font-bold text-[15px] w-28 text-center">
          {month.replace("-", "年")}月
        </span>
        <button
          className="btn btn-ghost !px-3"
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="収入" value={yen(income)} cls="pos" />
        <Stat label="支出" value={yen(expense)} cls="neg" />
        <Stat label="収支" value={yen(net)} cls={net >= 0 ? "pos" : "neg"} />
        <Stat label="貯蓄率" value={pct(savingRate)} cls={net >= 0 ? "pos" : "neg"} />
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-[15px] mb-3">直近6ヶ月の推移</h2>
        <BarChart data={chartData} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-[13px] text-[var(--muted)]">
          {month.replace("-", "年")}月の明細
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)] text-sm">
            この月の記録はありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>区分</th>
                  <th>カテゴリ</th>
                  <th>メモ</th>
                  <th className="text-right">金額</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap">{fmtDate(t.date)}</td>
                    <td>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ${
                          t.type === "income"
                            ? "bg-[#14321f] pos"
                            : "bg-[#321414] neg"
                        }`}
                      >
                        {t.type === "income" ? "収入" : "支出"}
                      </span>
                    </td>
                    <td className="text-[var(--muted)]">{t.category}</td>
                    <td className="text-[var(--muted)] text-[13px]">
                      {t.memo ?? ""}
                    </td>
                    <td
                      className={`text-right font-medium ${t.type === "income" ? "pos" : "neg"}`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {yen(t.amount)}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        className="text-[var(--muted)] hover:text-[var(--text)] px-2"
                        onClick={() =>
                          setDraft({
                            id: t.id,
                            date: t.date,
                            type: t.type,
                            category: t.category,
                            amount: String(t.amount),
                            memo: t.memo ?? "",
                          })
                        }
                      >
                        編集
                      </button>
                      <button
                        className="neg hover:opacity-70 px-2"
                        onClick={() => remove(t.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {draft && (
        <Modal
          title={
            (draft.id ? "編集" : "追加") +
            "（" +
            (draft.type === "income" ? "収入" : "支出") +
            "）"
          }
          onClose={() => setDraft(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                キャンセル
              </button>
              <button
                className="btn btn-primary disabled:opacity-50"
                onClick={save}
                disabled={saving || !Number(draft.amount)}
              >
                保存
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((tp) => (
                <button
                  key={tp}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      type: tp,
                      category:
                        tp === "income"
                          ? INCOME_CATEGORIES[0]
                          : EXPENSE_CATEGORIES[0],
                    })
                  }
                  className={`btn flex-1 ${draft.type === tp ? "btn-primary" : "btn-ghost"}`}
                >
                  {tp === "income" ? "収入" : "支出"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">日付</label>
                <input
                  className="input"
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">カテゴリ</label>
                <select
                  className="select"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                >
                  {cats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">金額（円）</label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="label">メモ</label>
              <input
                className="input"
                value={draft.memo}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
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
