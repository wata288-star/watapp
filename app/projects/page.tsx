"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { yen, yenShort, fmtDate } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  type Project,
  type ProjectStatus,
} from "@/lib/types";

const STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];

type Draft = {
  id?: number;
  name: string;
  client: string;
  status: ProjectStatus;
  amount: string;
  progress: string;
  start_date: string;
  due_date: string;
  note: string;
};

const EMPTY: Draft = {
  name: "",
  client: "",
  status: "lead",
  amount: "",
  progress: "0",
  start_date: "",
  due_date: "",
  note: "",
};

export default function ProjectsPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setRows(await fetch("/api/projects").then((r) => r.json()));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    const body = {
      name: draft.name,
      client: draft.client,
      status: draft.status,
      amount: Number(draft.amount) || 0,
      progress: Number(draft.progress) || 0,
      start_date: draft.start_date || null,
      due_date: draft.due_date || null,
      note: draft.note,
    };
    await fetch(draft.id ? `/api/projects/${draft.id}` : "/api/projects", {
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
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  };

  const edit = (p: Project) =>
    setDraft({
      id: p.id,
      name: p.name,
      client: p.client ?? "",
      status: p.status,
      amount: String(p.amount),
      progress: String(p.progress),
      start_date: p.start_date ?? "",
      due_date: p.due_date ?? "",
      note: p.note ?? "",
    });

  const open = rows
    .filter((p) => p.status !== "lost" && p.status !== "closed")
    .reduce((s, p) => s + p.amount, 0);
  const won = rows
    .filter((p) => p.status === "closed")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">案件管理</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            FLYHEIT の案件パイプライン
          </p>
        </div>
        <button onClick={() => setDraft({ ...EMPTY })} className="btn btn-primary">
          ＋ 案件を追加
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="進行中パイプライン" value={yen(open)} />
        <Stat label="成約済（入金）" value={yen(won)} cls="pos" />
        <Stat label="件数" value={`${rows.length}件`} />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUSES.map((st) => {
          const items = rows.filter((p) => p.status === st);
          const total = items.reduce((s, p) => s + p.amount, 0);
          return (
            <div key={st} className="w-[260px] shrink-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: PROJECT_STATUS_COLORS[st] }}
                />
                <span className="text-[13px] font-semibold">
                  {PROJECT_STATUS_LABELS[st]}
                </span>
                <span className="text-[11px] text-[var(--muted)] ml-auto">
                  {items.length}件 · {yenShort(total)}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => edit(p)}
                    className="card w-full text-left p-3 hover:border-[var(--accent)] transition"
                  >
                    <div className="font-medium text-[14px]">{p.name}</div>
                    {p.client && (
                      <div className="text-[12px] text-[var(--muted)]">
                        {p.client}
                      </div>
                    )}
                    <div className="text-[14px] font-bold mt-1.5">
                      {yen(p.amount)}
                    </div>
                    <div className="mt-2 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.progress}%`,
                          background: PROJECT_STATUS_COLORS[st],
                        }}
                      />
                    </div>
                    {p.due_date && (
                      <div className="text-[11px] text-[var(--muted)] mt-1.5">
                        納期 {fmtDate(p.due_date)}
                      </div>
                    )}
                  </button>
                ))}
                {items.length === 0 && (
                  <div className="text-[12px] text-[var(--muted)] px-1 py-3">
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {draft && (
        <Modal
          title={draft.id ? "案件を編集" : "案件を追加"}
          onClose={() => setDraft(null)}
          footer={
            <>
              {draft.id && (
                <button
                  className="btn btn-danger mr-auto"
                  onClick={() => {
                    remove(draft.id!);
                    setDraft(null);
                  }}
                >
                  削除
                </button>
              )}
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
              <label className="label">案件名</label>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">クライアント</label>
                <input
                  className="input"
                  value={draft.client}
                  onChange={(e) =>
                    setDraft({ ...draft, client: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">ステータス</label>
                <select
                  className="select"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      status: e.target.value as ProjectStatus,
                    })
                  }
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {PROJECT_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">金額（円）</label>
                <input
                  className="input"
                  type="number"
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">進捗（%）</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={draft.progress}
                  onChange={(e) =>
                    setDraft({ ...draft, progress: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">開始日</label>
                <input
                  className="input"
                  type="date"
                  value={draft.start_date}
                  onChange={(e) =>
                    setDraft({ ...draft, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">納期</label>
                <input
                  className="input"
                  type="date"
                  value={draft.due_date}
                  onChange={(e) =>
                    setDraft({ ...draft, due_date: e.target.value })
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
