"use client";

// タスクボード：カンバンでステータスを動かす

import { useMemo, useState } from "react";
import { Kanban } from "../_components/Kanban";
import { Select, Stat } from "../_components/ui";
import { TaskModal } from "../gantt/page";
import { usePm } from "../_lib/store";
import { addDays, diffDays, shortDate, today } from "../_lib/format";
import {
  DEPTS,
  PRIORITIES,
  TASK_STATUSES,
  type Dept,
  type PmTask,
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

export default function TasksPage() {
  const { state, create, update, remove } = usePm();
  const [deptFilter, setDeptFilter] = useState<Dept | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [editing, setEditing] = useState<PmTask | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<PmTask, "id">>(EMPTY);

  const owners = useMemo(
    () => Array.from(new Set((state?.tasks ?? []).map((t) => t.owner).filter(Boolean))),
    [state],
  );

  const tasks = useMemo(() => {
    if (!state) return [];
    return state.tasks.filter(
      (t) =>
        (deptFilter === "all" || t.dept === deptFilter) &&
        (ownerFilter === "all" || t.owner === ownerFilter),
    );
  }, [state, deptFilter, ownerFilter]);

  if (!state) return null;

  const overdue = tasks.filter((t) => t.status !== "done" && diffDays(today(), t.end) < 0);
  const blocked = tasks.filter((t) => t.status === "blocked");

  const save = async () => {
    if (!draft.title.trim()) return;
    if (editing) await update("tasks", editing.id, { ...draft });
    else await create("tasks", { ...draft });
    setEditing(null);
    setCreating(false);
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat label="表示中のタスク" value={tasks.length} unit="件" />
        <Stat label="進行中" tone="cyan" value={tasks.filter((t) => t.status === "doing").length} unit="件" />
        <Stat label="ブロック中" tone={blocked.length ? "red" : ""} value={blocked.length} unit="件" sub="先に詰まりを解消する" />
        <Stat label="期限超過" tone={overdue.length ? "red" : ""} value={overdue.length} unit="件" />
      </div>

      <div className="pm-toolbar" style={{ marginTop: 16 }}>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value as Dept | "all")} style={{ width: 170 }}>
          <option value="all">すべての部門</option>
          {DEPTS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </Select>
        <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={{ width: 150 }}>
          <option value="all">すべての担当者</option>
          {owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
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

      <Kanban
        columns={TASK_STATUSES.map((s) => ({ id: s.id, label: s.label, color: s.color }))}
        items={tasks}
        columnOf={(t) => t.status}
        onMove={(t, col) =>
          update("tasks", t.id, {
            status: col as TaskStatus,
            progress: col === "done" ? 100 : t.progress,
          })
        }
        onAdd={(col) => {
          setDraft({ ...EMPTY, status: col as TaskStatus, dept: deptFilter === "all" ? "sales" : deptFilter });
          setCreating(true);
        }}
        renderCard={(t) => {
          const dept = DEPTS.find((d) => d.id === t.dept)!;
          const prio = PRIORITIES.find((p) => p.id === t.priority)!;
          const late = t.status !== "done" && diffDays(today(), t.end) < 0;
          return (
            <div onClick={() => { setEditing(t); setDraft({ ...t }); }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
                <span className="pm-badge" style={{ background: `${dept.color}22`, color: dept.color }}>
                  {dept.label}
                </span>
                {t.priority === "high" && (
                  <span className="pm-badge" style={{ background: `${prio.color}22`, color: prio.color }}>
                    優先
                  </span>
                )}
                {t.isMilestone && <span className="pm-gold-text" style={{ fontSize: 11 }}>◆</span>}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 7 }}>{t.title}</div>
              <div className="pm-progress" style={{ marginBottom: 6 }}>
                <span style={{ width: `${t.progress}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
                <span className="pm-muted">{t.owner}</span>
                <span className={late ? "pm-red-text" : "pm-muted"}>
                  {late && "⚠ "}
                  {shortDate(t.end)}
                </span>
              </div>
            </div>
          );
        }}
      />

      {(editing || creating) && (
        <TaskModal
          draft={draft}
          setDraft={setDraft}
          allTasks={state.tasks}
          editingId={editing?.id}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={save}
          onDelete={editing ? async () => { await remove("tasks", editing.id); setEditing(null); } : undefined}
        />
      )}
    </>
  );
}
