"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { fmtDate, todayISO } from "@/lib/format";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  type Task,
  type TaskPriority,
  type Project,
} from "@/lib/types";

type Filter = "open" | "done" | "all";

type Draft = {
  id?: number;
  title: string;
  priority: TaskPriority;
  due_date: string;
  project_id: string;
  note: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<Filter>("open");
  const [quick, setQuick] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]);
    setTasks(t);
    setProjects(p);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const projName = (id: number | null) =>
    id ? projects.find((p) => p.id === id)?.name : undefined;

  const addQuick = async () => {
    if (!quick.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: quick.trim(), priority: "mid" }),
    });
    setQuick("");
    load();
  };

  const toggle = async (t: Task) => {
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    load();
  };

  const saveDraft = async () => {
    if (!draft || !draft.title.trim()) return;
    await fetch(draft.id ? `/api/tasks/${draft.id}` : "/api/tasks", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        priority: draft.priority,
        due_date: draft.due_date || null,
        project_id: draft.project_id || null,
        note: draft.note,
      }),
    });
    setDraft(null);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  const today = todayISO();
  const shown = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done,
  );
  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">タスク・TODO</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            未完了 {openCount}件
          </p>
        </div>
      </header>

      {/* クイック追加 */}
      <div className="card p-2 flex gap-2">
        <input
          className="input !bg-transparent !border-0"
          placeholder="タスクを入力して Enter で追加..."
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addQuick()}
        />
        <button className="btn btn-primary shrink-0" onClick={addQuick}>
          追加
        </button>
      </div>

      {/* フィルタ */}
      <div className="flex gap-2">
        {(
          [
            ["open", "未完了"],
            ["done", "完了"],
            ["all", "すべて"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {shown.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)] text-sm">
            タスクはありません
          </div>
        ) : (
          <ul>
            {shown.map((t) => {
              const overdue = !t.done && t.due_date && t.due_date < today;
              const pj = projName(t.project_id);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--panel-2)]"
                >
                  <button
                    onClick={() => toggle(t)}
                    className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center ${
                      t.done
                        ? "bg-[var(--green)] border-[var(--green)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {t.done && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: TASK_PRIORITY_COLORS[t.priority] }}
                    title={`優先度 ${TASK_PRIORITY_LABELS[t.priority]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[14px] ${t.done ? "line-through text-[var(--muted)]" : ""}`}
                    >
                      {t.title}
                    </div>
                    {(t.due_date || pj) && (
                      <div className="text-[11px] mt-0.5 flex gap-2">
                        {t.due_date && (
                          <span className={overdue ? "neg" : "text-[var(--muted)]"}>
                            {overdue ? "⚠ " : ""}
                            {fmtDate(t.due_date)}
                          </span>
                        )}
                        {pj && (
                          <span className="text-[var(--accent)]">#{pj}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    className="text-[var(--muted)] hover:text-[var(--text)] text-[12px] px-2"
                    onClick={() =>
                      setDraft({
                        id: t.id,
                        title: t.title,
                        priority: t.priority,
                        due_date: t.due_date ?? "",
                        project_id: t.project_id ? String(t.project_id) : "",
                        note: t.note ?? "",
                      })
                    }
                  >
                    編集
                  </button>
                  <button
                    className="neg hover:opacity-70 text-[12px] px-2"
                    onClick={() => remove(t.id)}
                  >
                    削除
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {draft && (
        <Modal
          title={draft.id ? "タスクを編集" : "タスクを追加"}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                キャンセル
              </button>
              <button
                className="btn btn-primary disabled:opacity-50"
                onClick={saveDraft}
                disabled={!draft.title.trim()}
              >
                保存
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="label">タイトル</label>
              <input
                className="input"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">優先度</label>
                <select
                  className="select"
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      priority: e.target.value as TaskPriority,
                    })
                  }
                >
                  <option value="high">高</option>
                  <option value="mid">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="label">期日</label>
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
              <label className="label">関連案件（任意）</label>
              <select
                className="select"
                value={draft.project_id}
                onChange={(e) =>
                  setDraft({ ...draft, project_id: e.target.value })
                }
              >
                <option value="">なし</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
