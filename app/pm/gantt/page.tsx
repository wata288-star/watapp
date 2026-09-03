"use client";

// ガントチャート画面：部門横断のスケジュール管理

import { useMemo, useState } from "react";
import { Gantt, type GanttScale } from "../_components/Gantt";
import { Card, ConfirmButton, Field, Modal, Select, Stat, TextArea, TextInput } from "../_components/ui";
import { usePm } from "../_lib/store";
import { addDays, diffDays, shortDate, today } from "../_lib/format";
import {
  DEPTS,
  PRIORITIES,
  TASK_STATUSES,
  type Dept,
  type PmTask,
  type Priority,
  type TaskStatus,
} from "@/lib/pm/types";

const EMPTY: Omit<PmTask, "id"> = {
  title: "",
  dept: "sales",
  owner: "ワタル",
  status: "todo",
  priority: "mid",
  start: today(),
  end: addDays(today(), 7),
  progress: 0,
  deps: [],
  isMilestone: false,
  notes: "",
};

export default function GanttPage() {
  const { state, create, update, remove } = usePm();
  const [scale, setScale] = useState<GanttScale>("week");
  const [deptFilter, setDeptFilter] = useState<Dept | "all">("all");
  const [hideDone, setHideDone] = useState(false);
  const [editing, setEditing] = useState<PmTask | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<PmTask, "id">>(EMPTY);

  const tasks = useMemo(() => {
    if (!state) return [];
    return state.tasks.filter(
      (t) =>
        (deptFilter === "all" || t.dept === deptFilter) &&
        (!hideDone || t.status !== "done"),
    );
  }, [state, deptFilter, hideDone]);

  if (!state) return null;

  const milestones = state.tasks
    .filter((t) => t.isMilestone)
    .sort((a, b) => a.end.localeCompare(b.end));

  const critical = state.tasks.filter(
    (t) => t.status !== "done" && t.priority === "high" && diffDays(today(), t.end) <= 14,
  );

  const openEdit = (t: PmTask) => {
    setEditing(t);
    setDraft({ ...t });
  };

  const save = async () => {
    if (!draft.title.trim()) return;
    if (editing) {
      await update("tasks", editing.id, { ...draft });
    } else {
      await create("tasks", { ...draft });
    }
    setEditing(null);
    setCreating(false);
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat
          label="全タスク"
          value={state.tasks.length}
          unit="件"
          sub={`完了 ${state.tasks.filter((t) => t.status === "done").length}件`}
        />
        <Stat
          label="平均進捗"
          tone="cyan"
          value={Math.round(
            state.tasks.reduce((s, t) => s + t.progress, 0) / Math.max(1, state.tasks.length),
          )}
          unit="%"
        />
        <Stat
          label="14日以内の重要タスク"
          tone="gold"
          value={critical.length}
          unit="件"
          sub="優先度・高で期限が近いもの"
        />
        <Stat
          label="マイルストーン"
          value={milestones.length}
          unit="件"
          sub={
            milestones.find((m) => diffDays(today(), m.end) >= 0)
              ? `次: ${shortDate(milestones.find((m) => diffDays(today(), m.end) >= 0)!.end)}`
              : "—"
          }
        />
      </div>

      <div className="pm-toolbar" style={{ marginTop: 16 }}>
        <Select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value as Dept | "all")}
          style={{ width: 170 }}
        >
          <option value="all">すべての部門</option>
          {DEPTS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </Select>

        <div style={{ display: "flex", gap: 2 }}>
          {(["day", "week", "month"] as GanttScale[]).map((s) => (
            <button
              key={s}
              className={`pm-btn sm ${scale === s ? "primary" : ""}`}
              onClick={() => setScale(s)}
            >
              {s === "day" ? "日" : s === "week" ? "週" : "月"}
            </button>
          ))}
        </div>

        <label className="pm-btn sm" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          完了を隠す
        </label>

        <div className="pm-spacer" />
        <button
          className="pm-btn primary"
          onClick={() => {
            setDraft({ ...EMPTY, dept: deptFilter === "all" ? "sales" : deptFilter });
            setCreating(true);
          }}
        >
          ＋ タスクを追加
        </button>
      </div>

      <Gantt tasks={tasks} scale={scale} onSelect={openEdit} />

      <div className="pm-grid cols-2" style={{ marginTop: 16 }}>
        <Card title="◆ マイルストーン" desc="事業の節目。ここが遅れると全体が遅れます。">
          {milestones.length === 0 && <div className="pm-empty">マイルストーンがありません。</div>}
          {milestones.map((m) => {
            const dept = DEPTS.find((d) => d.id === m.dept)!;
            const remain = diffDays(today(), m.end);
            return (
              <div
                key={m.id}
                onClick={() => openEdit(m)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: "1px solid var(--pm-line-soft)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    background: dept.color,
                    transform: "rotate(45deg)",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div className="pm-muted" style={{ fontSize: 10.5 }}>
                    {dept.label} ・ {shortDate(m.end)}
                  </div>
                </div>
                <span
                  className={`pm-nowrap ${remain < 0 ? "pm-red-text" : remain < 30 ? "pm-gold-text" : "pm-muted"}`}
                  style={{ fontSize: 11 }}
                >
                  {m.status === "done" ? "達成" : remain < 0 ? `${-remain}日超過` : `あと${remain}日`}
                </span>
              </div>
            );
          })}
        </Card>

        <Card title="⚑ 要注意タスク" desc="優先度が高く、期限が14日以内に迫っているもの。">
          {critical.length === 0 && <div className="pm-empty">直近で危ないタスクはありません。</div>}
          {critical.map((t) => {
            const dept = DEPTS.find((d) => d.id === t.dept)!;
            const remain = diffDays(today(), t.end);
            return (
              <div
                key={t.id}
                onClick={() => openEdit(t)}
                style={{
                  padding: "9px 0",
                  borderBottom: "1px solid var(--pm-line-soft)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="pm-dot" style={{ background: dept.color }} />
                  <span style={{ flex: 1 }} className="pm-clamp2">{t.title}</span>
                  <span className={remain < 0 ? "pm-red-text" : "pm-gold-text"} style={{ fontSize: 11 }}>
                    {remain < 0 ? `${-remain}日超過` : `あと${remain}日`}
                  </span>
                </div>
                <div className="pm-muted" style={{ fontSize: 10.5, paddingLeft: 14 }}>
                  {dept.label} ・ {t.owner} ・ 進捗 {t.progress}%
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {(editing || creating) && (
        <TaskModal
          draft={draft}
          setDraft={setDraft}
          allTasks={state.tasks}
          editingId={editing?.id}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
          onDelete={
            editing
              ? async () => {
                  await remove("tasks", editing.id);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

export function TaskModal({
  draft,
  setDraft,
  allTasks,
  editingId,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Omit<PmTask, "id">;
  setDraft: (d: Omit<PmTask, "id">) => void;
  allTasks: PmTask[];
  editingId?: string;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const set = <K extends keyof Omit<PmTask, "id">>(k: K, v: Omit<PmTask, "id">[K]) =>
    setDraft({ ...draft, [k]: v });

  return (
    <Modal
      title={editingId ? "タスクを編集" : "タスクを追加"}
      onClose={onClose}
      footer={
        <>
          {onDelete && <ConfirmButton className="pm-btn danger" onConfirm={onDelete} />}
          <div className="pm-spacer" />
          <button className="pm-btn" onClick={onClose}>キャンセル</button>
          <button className="pm-btn primary" onClick={onSave}>保存</button>
        </>
      }
    >
      <Field label="タスク名">
        <TextInput
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="例）提案書テンプレートの標準化"
          autoFocus
        />
      </Field>

      <div className="pm-grid cols-2">
        <Field label="部門">
          <Select value={draft.dept} onChange={(e) => set("dept", e.target.value as Dept)}>
            {DEPTS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="担当者">
          <TextInput value={draft.owner} onChange={(e) => set("owner", e.target.value)} />
        </Field>
      </div>

      <div className="pm-grid cols-3">
        <Field label="ステータス">
          <Select value={draft.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
            {TASK_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="優先度">
          <Select value={draft.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={`進捗 ${draft.progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={draft.progress}
            onChange={(e) => set("progress", Number(e.target.value))}
            style={{ width: "100%", accentColor: "#d9b26a" }}
          />
        </Field>
      </div>

      <div className="pm-grid cols-2">
        <Field label="開始日">
          <TextInput type="date" value={draft.start} onChange={(e) => set("start", e.target.value)} />
        </Field>
        <Field label="終了日">
          <TextInput type="date" value={draft.end} onChange={(e) => set("end", e.target.value)} />
        </Field>
      </div>

      <Field label="種別">
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={draft.isMilestone}
            onChange={(e) => set("isMilestone", e.target.checked)}
          />
          <span>マイルストーン（事業の節目として扱う）</span>
        </label>
      </Field>

      <Field label="先行タスク（これが終わってから着手）" hint="複数選択できます（Ctrl / ⌘ + クリック）">
        <select
          multiple
          className="pm-select"
          style={{ height: 96, backgroundImage: "none" }}
          value={draft.deps}
          onChange={(e) =>
            set("deps", Array.from(e.target.selectedOptions).map((o) => o.value))
          }
        >
          {allTasks
            .filter((t) => t.id !== editingId)
            .map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
        </select>
      </Field>

      <Field label="メモ">
        <TextArea value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Modal>
  );
}
