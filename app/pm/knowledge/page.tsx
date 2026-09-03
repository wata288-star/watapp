"use client";

// ナレッジ / リスク：意思決定ログ・学び・議事録・リスク管理表

import { useMemo, useState } from "react";
import {
  ConfirmButton,
  Field,
  Modal,
  Select,
  Stat,
  Tabs,
  TextArea,
  TextInput,
} from "../_components/ui";
import { usePm } from "../_lib/store";
import { today } from "../_lib/format";
import { PRIORITIES, type KnowledgeNote, type Priority } from "@/lib/pm/types";

const TYPES: { id: KnowledgeNote["type"]; label: string; color: string; desc: string }[] = [
  { id: "decision", label: "意思決定", color: "#d9b26a", desc: "何を、なぜそう決めたか。後から見返せるようにする。" },
  { id: "insight", label: "学び", color: "#4fc3d9", desc: "商談や施策から得た気づき。次に活かす。" },
  { id: "meeting", label: "議事録", color: "#8b9df0", desc: "打ち合わせの記録と決まったこと。" },
  { id: "risk", label: "リスク", color: "#e8735a", desc: "先に潰しておくべき問題。影響度と発生可能性で管理。" },
  { id: "playbook", label: "手順書", color: "#5fcf9a", desc: "繰り返す作業のやり方をまとめたもの。" },
];

const EMPTY: Omit<KnowledgeNote, "id"> = {
  title: "",
  type: "decision",
  date: today(),
  owner: "ワタル",
  tags: [],
  body: "",
  impact: "mid",
  likelihood: "mid",
  mitigation: "",
  status: "open",
};

const PRIO_LABEL: Record<Priority, string> = { high: "大", mid: "中", low: "小" };

export default function KnowledgePage() {
  const { state, create, update, remove } = usePm();
  const [tab, setTab] = useState<"notes" | "risks">("notes");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<KnowledgeNote["type"] | "all">("all");
  const [editing, setEditing] = useState<KnowledgeNote | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<KnowledgeNote, "id">>(EMPTY);
  const [tagInput, setTagInput] = useState("");

  const notes = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    return state.notes
      .filter((n) => (tab === "risks" ? n.type === "risk" : n.type !== "risk"))
      .filter((n) => tab === "risks" || typeFilter === "all" || n.type === typeFilter)
      .filter((n) => !q || `${n.title} ${n.body} ${n.tags.join(" ")}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state, query, typeFilter, tab]);

  if (!state) return null;

  const risks = state.notes.filter((n) => n.type === "risk");
  const openRisks = risks.filter((r) => r.status !== "closed");
  const criticalRisks = openRisks.filter((r) => r.impact === "high" && r.likelihood !== "low");

  const save = async () => {
    if (!draft.title.trim()) return;
    if (editing) await update("notes", editing.id, { ...draft });
    else await create("notes", { ...draft });
    setEditing(null);
    setCreating(false);
  };

  const openNew = (type: KnowledgeNote["type"]) => {
    setDraft({ ...EMPTY, type });
    setCreating(true);
    setTagInput("");
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat label="記録数" value={state.notes.length} unit="件" />
        <Stat
          label="意思決定ログ"
          tone="gold"
          value={state.notes.filter((n) => n.type === "decision").length}
          unit="件"
        />
        <Stat label="対応中のリスク" tone={openRisks.length ? "red" : ""} value={openRisks.length} unit="件" />
        <Stat
          label="要対応リスク"
          tone={criticalRisks.length ? "red" : ""}
          value={criticalRisks.length}
          unit="件"
          sub="影響大 かつ 発生可能性 中以上"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Tabs
          tabs={[
            { id: "notes" as const, label: "ナレッジ・意思決定", count: state.notes.length - risks.length },
            { id: "risks" as const, label: "リスク管理表", count: risks.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="pm-toolbar">
        {tab === "notes" && (
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as KnowledgeNote["type"] | "all")}
            style={{ width: 150 }}
          >
            <option value="all">すべての種類</option>
            {TYPES.filter((t) => t.id !== "risk").map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>
        )}
        <span className="pm-search-wrap">
          <TextInput
            className="pm-search"
            placeholder="タイトル・本文・タグで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </span>
        <div className="pm-spacer" />
        <button className="pm-btn primary" onClick={() => openNew(tab === "risks" ? "risk" : "decision")}>
          ＋ {tab === "risks" ? "リスクを追加" : "記録を追加"}
        </button>
      </div>

      {tab === "risks" ? (
        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>リスク</th>
                <th style={{ width: 70 }}>影響度</th>
                <th style={{ width: 90 }}>発生可能性</th>
                <th>対策</th>
                <th style={{ width: 100 }}>状態</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {notes.length === 0 && (
                <tr>
                  <td colSpan={6} className="pm-empty">リスクが登録されていません。</td>
                </tr>
              )}
              {notes.map((r) => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 300 }}>
                    <button
                      className="pm-btn ghost sm"
                      style={{ border: "none", padding: 0, fontWeight: 700, textAlign: "left" }}
                      onClick={() => { setEditing(r); setDraft({ ...r }); setTagInput(r.tags.join(", ")); }}
                    >
                      {r.title}
                    </button>
                    <div className="pm-muted pm-clamp2" style={{ fontSize: 10.5 }}>{r.body}</div>
                  </td>
                  <td>
                    <select
                      className="pm-select"
                      style={{ padding: "3px 20px 3px 6px", fontSize: 11 }}
                      value={r.impact}
                      onChange={(e) => update("notes", r.id, { impact: e.target.value })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.id} value={p.id}>{PRIO_LABEL[p.id]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="pm-select"
                      style={{ padding: "3px 20px 3px 6px", fontSize: 11 }}
                      value={r.likelihood}
                      onChange={(e) => update("notes", r.id, { likelihood: e.target.value })}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.id} value={p.id}>{p.id === "high" ? "高" : p.id === "mid" ? "中" : "低"}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ maxWidth: 380 }}>
                    <span className="pm-pre" style={{ fontSize: 11.5 }}>{r.mitigation || "—"}</span>
                  </td>
                  <td>
                    <select
                      className="pm-select"
                      style={{ padding: "3px 20px 3px 6px", fontSize: 11 }}
                      value={r.status}
                      onChange={(e) => update("notes", r.id, { status: e.target.value })}
                    >
                      <option value="open">対応中</option>
                      <option value="watching">監視中</option>
                      <option value="closed">クローズ</option>
                    </select>
                  </td>
                  <td>
                    <ConfirmButton label="✕" onConfirm={() => remove("notes", r.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pm-grid cols-2">
          {notes.map((n) => {
            const t = TYPES.find((x) => x.id === n.type)!;
            return (
              <div
                key={n.id}
                className="pm-card"
                style={{ cursor: "pointer" }}
                onClick={() => { setEditing(n); setDraft({ ...n }); setTagInput(n.tags.join(", ")); }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span className="pm-badge" style={{ background: `${t.color}22`, color: t.color }}>
                    {t.label}
                  </span>
                  <span className="pm-muted" style={{ fontSize: 10.5 }}>{n.date} ・ {n.owner}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{n.title}</div>
                <div
                  className="pm-pre pm-dim"
                  style={{ fontSize: 11.5, maxHeight: 190, overflow: "hidden" }}
                >
                  {n.body}
                </div>
                {n.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                    {n.tags.map((tag) => (
                      <span
                        key={tag}
                        className="pm-badge"
                        style={{ background: "rgba(255,255,255,0.05)", color: "var(--pm-muted)" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {notes.length === 0 && tab === "notes" && (
        <div className="pm-empty">記録がありません。決めたことは必ず残しておくと、後で必ず助かります。</div>
      )}

      {(editing || creating) && (
        <Modal
          wide
          title={editing ? "記録を編集" : "記録を追加"}
          onClose={() => { setEditing(null); setCreating(false); }}
          footer={
            <>
              {editing && (
                <ConfirmButton
                  className="pm-btn danger"
                  onConfirm={async () => {
                    await remove("notes", editing.id);
                    setEditing(null);
                  }}
                />
              )}
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => { setEditing(null); setCreating(false); }}>
                キャンセル
              </button>
              <button className="pm-btn primary" onClick={save}>保存</button>
            </>
          }
        >
          <Field label="タイトル">
            <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
          </Field>
          <div className="pm-grid cols-3">
            <Field label="種類" hint={TYPES.find((t) => t.id === draft.type)?.desc}>
              <Select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as KnowledgeNote["type"] })}
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="日付">
              <TextInput type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field label="記録者">
              <TextInput value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
            </Field>
          </div>

          <Field label="本文" hint="意思決定なら「何を決めたか」だけでなく「なぜそう決めたか」を必ず書く。">
            <TextArea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              style={{ minHeight: 190 }}
            />
          </Field>

          {draft.type === "risk" && (
            <>
              <div className="pm-grid cols-3">
                <Field label="影響度">
                  <Select
                    value={draft.impact}
                    onChange={(e) => setDraft({ ...draft, impact: e.target.value as Priority })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>{PRIO_LABEL[p.id]}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="発生可能性">
                  <Select
                    value={draft.likelihood}
                    onChange={(e) => setDraft({ ...draft, likelihood: e.target.value as Priority })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id === "high" ? "高" : p.id === "mid" ? "中" : "低"}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="状態">
                  <Select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as KnowledgeNote["status"] })}
                  >
                    <option value="open">対応中</option>
                    <option value="watching">監視中</option>
                    <option value="closed">クローズ</option>
                  </Select>
                </Field>
              </div>
              <Field label="対策" hint="「気をつける」ではなく、具体的な行動を書く。">
                <TextArea
                  value={draft.mitigation}
                  onChange={(e) => setDraft({ ...draft, mitigation: e.target.value })}
                />
              </Field>
            </>
          )}

          <Field label="タグ" hint="カンマ区切り。例）営業, 価格, 失注">
            <TextInput
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setDraft({
                  ...draft,
                  tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                });
              }}
            />
          </Field>
        </Modal>
      )}
    </>
  );
}
