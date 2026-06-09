"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { yen, fmtDate } from "@/lib/format";
import {
  ASSET_CATEGORY_LABELS,
  type Asset,
  type AssetCategory,
} from "@/lib/types";

const CATS = Object.entries(ASSET_CATEGORY_LABELS).filter(
  ([k]) => k !== "liability",
) as [AssetCategory, string][];

type Draft = {
  id?: number;
  name: string;
  category: AssetCategory;
  value: string;
  is_liability: boolean;
  note: string;
};

const EMPTY: Draft = {
  name: "",
  category: "cash",
  value: "",
  is_liability: false,
  note: "",
};

export default function AssetsPage() {
  const [rows, setRows] = useState<Asset[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setRows(await fetch("/api/assets").then((r) => r.json()));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    const body = {
      name: draft.name,
      category: draft.is_liability ? "liability" : draft.category,
      value: Number(draft.value) || 0,
      is_liability: draft.is_liability,
      note: draft.note,
    };
    await fetch(draft.id ? `/api/assets/${draft.id}` : "/api/assets", {
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
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    load();
  };

  const edit = (a: Asset) =>
    setDraft({
      id: a.id,
      name: a.name,
      category: a.category === "liability" ? "other" : a.category,
      value: String(a.value),
      is_liability: !!a.is_liability,
      note: a.note ?? "",
    });

  const assets = rows.filter((r) => !r.is_liability);
  const liabilities = rows.filter((r) => r.is_liability);
  const assetTotal = assets.reduce((s, r) => s + r.value, 0);
  const liabTotal = liabilities.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">資産管理</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            現金・預金・不動産・負債などを登録
          </p>
        </div>
        <button onClick={() => setDraft({ ...EMPTY })} className="btn btn-primary">
          ＋ 資産を追加
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="資産合計" value={yen(assetTotal)} />
        <Stat label="負債合計" value={yen(liabTotal)} cls="neg" />
        <Stat label="正味" value={yen(assetTotal - liabTotal)} />
      </div>

      <Section
        title="資産"
        rows={assets}
        onEdit={edit}
        onRemove={remove}
        empty="資産がまだありません"
      />
      {liabilities.length > 0 && (
        <Section
          title="負債"
          rows={liabilities}
          onEdit={edit}
          onRemove={remove}
          empty=""
        />
      )}

      {draft && (
        <Modal
          title={draft.id ? "資産を編集" : "資産を追加"}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                キャンセル
              </button>
              <button
                className="btn btn-primary disabled:opacity-50"
                onClick={save}
                disabled={saving || !draft.name.trim()}
              >
                保存
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="label">名称</label>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="例: 三菱UFJ銀行 普通預金"
                autoFocus
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={draft.is_liability}
                onChange={(e) =>
                  setDraft({ ...draft, is_liability: e.target.checked })
                }
              />
              これは負債（ローン等）として計上する
            </label>
            {!draft.is_liability && (
              <div>
                <label className="label">カテゴリ</label>
                <select
                  className="select"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      category: e.target.value as AssetCategory,
                    })
                  }
                >
                  {CATS.map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">
                {draft.is_liability ? "残債（円）" : "評価額（円）"}
              </label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                placeholder="0"
              />
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

function Section({
  title,
  rows,
  onEdit,
  onRemove,
  empty,
}: {
  title: string;
  rows: Asset[];
  onEdit: (a: Asset) => void;
  onRemove: (id: number) => void;
  empty: string;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-[13px] text-[var(--muted)]">
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center text-[var(--muted)] text-sm">{empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>カテゴリ</th>
                <th className="text-right">金額</th>
                <th>更新</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium">{a.name}</div>
                    {a.note && (
                      <div className="text-[12px] text-[var(--muted)]">
                        {a.note}
                      </div>
                    )}
                  </td>
                  <td className="text-[var(--muted)]">
                    {ASSET_CATEGORY_LABELS[a.category]}
                  </td>
                  <td className={`text-right font-medium ${a.is_liability ? "neg" : ""}`}>
                    {a.is_liability ? "−" : ""}
                    {yen(a.value)}
                  </td>
                  <td className="text-[var(--muted)] text-[12px]">
                    {fmtDate(a.updated_at)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <button
                      className="text-[var(--muted)] hover:text-[var(--text)] px-2"
                      onClick={() => onEdit(a)}
                    >
                      編集
                    </button>
                    <button
                      className="neg hover:opacity-70 px-2"
                      onClick={() => onRemove(a.id)}
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
