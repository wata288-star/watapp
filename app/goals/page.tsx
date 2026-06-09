"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { yen, yenShort, fmtDate } from "@/lib/format";
import type { Summary } from "@/lib/queries";

type GoalView = Summary["goals"][number];

type Draft = {
  id?: number;
  name: string;
  kind: "net_worth" | "custom";
  target_amount: string;
  current_amount: string;
  deadline: string;
};

const EMPTY: Draft = {
  name: "",
  kind: "net_worth",
  target_amount: "",
  current_amount: "",
  deadline: "",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalView[]>([]);
  const [netWorth, setNetWorth] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const s: Summary = await fetch("/api/summary").then((r) => r.json());
    setGoals(s.goals);
    setNetWorth(s.netWorth);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    await fetch(draft.id ? `/api/goals/${draft.id}` : "/api/goals", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        kind: draft.kind,
        target_amount: Number(draft.target_amount) || 0,
        current_amount: Number(draft.current_amount) || 0,
        deadline: draft.deadline || null,
      }),
    });
    setSaving(false);
    setDraft(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">目標・資産ゴール</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            現在の純資産 {yen(netWorth)}
          </p>
        </div>
        <button onClick={() => setDraft({ ...EMPTY })} className="btn btn-primary">
          ＋ 目標を追加
        </button>
      </header>

      {goals.length === 0 ? (
        <div className="card p-10 text-center text-[var(--muted)] text-sm">
          まだ目標がありません。「1億円達成」などの資産ゴールを設定しよう。
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const p = Math.max(0, Math.min(100, g.progress));
            const done = g.progress >= 100;
            const remain = g.target - g.current;
            return (
              <div key={g.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-[15px]">{g.name}</div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">
                      {g.kind === "net_worth" ? "純資産連動" : "手動管理"}
                      {g.deadline && ` · 期限 ${fmtDate(g.deadline)}`}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="text-[var(--muted)] hover:text-[var(--text)] text-[12px] px-1"
                      onClick={() =>
                        setDraft({
                          id: g.id,
                          name: g.name,
                          kind: g.kind as "net_worth" | "custom",
                          target_amount: String(g.target),
                          current_amount: String(g.current),
                          deadline: g.deadline ?? "",
                        })
                      }
                    >
                      編集
                    </button>
                    <button
                      className="neg hover:opacity-70 text-[12px] px-1"
                      onClick={() => remove(g.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-4 mb-1.5">
                  <span className="text-2xl font-black">
                    {g.progress.toFixed(1)}%
                  </span>
                  <span className="text-[12px] text-[var(--muted)]">
                    {yenShort(g.current)} / {yenShort(g.target)}
                  </span>
                </div>
                <div className="h-2.5 bg-[var(--bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p}%`,
                      background: done ? "#22c55e" : "#5b8cff",
                    }}
                  />
                </div>
                <div className="text-[12px] text-[var(--muted)] mt-2">
                  {done ? (
                    <span className="pos font-medium">🎉 達成！</span>
                  ) : (
                    `あと ${yen(remain)}`
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {draft && (
        <Modal
          title={draft.id ? "目標を編集" : "目標を追加"}
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
              <label className="label">目標名</label>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="例: 純資産1億円"
                autoFocus
              />
            </div>
            <div>
              <label className="label">種類</label>
              <select
                className="select"
                value={draft.kind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kind: e.target.value as "net_worth" | "custom",
                  })
                }
              >
                <option value="net_worth">純資産連動（自動で進捗計算）</option>
                <option value="custom">手動管理（現在値を自分で入力）</option>
              </select>
            </div>
            <div>
              <label className="label">目標額（円）</label>
              <input
                className="input"
                type="number"
                value={draft.target_amount}
                onChange={(e) =>
                  setDraft({ ...draft, target_amount: e.target.value })
                }
                placeholder="100000000"
              />
            </div>
            {draft.kind === "custom" && (
              <div>
                <label className="label">現在値（円）</label>
                <input
                  className="input"
                  type="number"
                  value={draft.current_amount}
                  onChange={(e) =>
                    setDraft({ ...draft, current_amount: e.target.value })
                  }
                />
              </div>
            )}
            <div>
              <label className="label">期限（任意）</label>
              <input
                className="input"
                type="date"
                value={draft.deadline}
                onChange={(e) =>
                  setDraft({ ...draft, deadline: e.target.value })
                }
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
