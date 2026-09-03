"use client";

// 営業資料ライブラリ：どの資料をいつ使うかを一元管理

import { useMemo, useState } from "react";
import {
  Card,
  ConfirmButton,
  Field,
  Modal,
  Select,
  Stat,
  TextArea,
  TextInput,
} from "../_components/ui";
import { usePm } from "../_lib/store";
import { today } from "../_lib/format";
import { MATERIAL_TYPES, type Material, type MaterialType } from "@/lib/pm/types";

const STATUSES: { id: Material["status"]; label: string; color: string }[] = [
  { id: "draft", label: "作成中", color: "#6f8b9d" },
  { id: "review", label: "レビュー中", color: "#4fc3d9" },
  { id: "published", label: "公開中", color: "#5fcf9a" },
  { id: "outdated", label: "要更新", color: "#e8735a" },
];

const EMPTY: Omit<Material, "id"> = {
  title: "",
  type: "deck",
  audience: "",
  version: "v1.0",
  status: "draft",
  owner: "ワタル",
  updatedAt: today(),
  url: "",
  summary: "",
  useCase: "",
};

/** 商談ステージごとに、どの資料を出すかの標準フロー */
const STAGE_FLOW: { stage: string; when: string; types: MaterialType[] }[] = [
  { stage: "① 初回接触", when: "展示会・DM・電話の直後", types: ["pamphlet", "onepager"] },
  { stage: "② 初回商談", when: "課題ヒアリングをした場", types: ["deck", "demo", "roi"] },
  { stage: "③ 提案・見積", when: "価格の話が出たら", types: ["proposal", "roi"] },
  { stage: "④ 社内稟議", when: "決裁者・情シスの審査", types: ["faq", "proposal"] },
  { stage: "⑤ 契約", when: "条件が固まったら", types: ["contract"] },
];

export default function MaterialsPage() {
  const { state, create, update, remove } = usePm();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MaterialType | "all">("all");
  const [editing, setEditing] = useState<Material | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Material, "id">>(EMPTY);

  const items = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    return state.materials.filter(
      (m) =>
        (typeFilter === "all" || m.type === typeFilter) &&
        (!q || `${m.title} ${m.summary} ${m.useCase}`.toLowerCase().includes(q)),
    );
  }, [state, query, typeFilter]);

  if (!state) return null;

  const save = async () => {
    if (!draft.title.trim()) return;
    const payload = { ...draft, updatedAt: today() };
    if (editing) await update("materials", editing.id, payload);
    else await create("materials", payload);
    setEditing(null);
    setCreating(false);
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat label="登録資料" value={state.materials.length} unit="点" />
        <Stat
          label="公開中"
          tone="green"
          value={state.materials.filter((m) => m.status === "published").length}
          unit="点"
        />
        <Stat
          label="作成・レビュー中"
          tone="cyan"
          value={state.materials.filter((m) => m.status === "draft" || m.status === "review").length}
          unit="点"
        />
        <Stat
          label="要更新"
          tone={state.materials.some((m) => m.status === "outdated") ? "red" : ""}
          value={state.materials.filter((m) => m.status === "outdated").length}
          unit="点"
          sub="内容が古くなった資料"
        />
      </div>

      <Card
        title="◔ 商談ステージ別・資料の出し方"
        desc="どのタイミングで何を出すかを決めておくと、商談のブレがなくなります。"
        className=""
      >
        <div className="pm-grid cols-5">
          {STAGE_FLOW.map((f) => (
            <div key={f.stage}>
              <div className="pm-gold-text" style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
                {f.stage}
              </div>
              <div className="pm-muted" style={{ fontSize: 10.5, marginBottom: 8 }}>{f.when}</div>
              {state.materials
                .filter((m) => f.types.includes(m.type) && m.status !== "outdated")
                .slice(0, 3)
                .map((m) => (
                  <div
                    key={m.id}
                    onClick={() => { setEditing(m); setDraft({ ...m }); }}
                    style={{
                      fontSize: 11,
                      padding: "5px 8px",
                      borderRadius: 7,
                      background: "var(--pm-bg-deep)",
                      border: "1px solid var(--pm-line-soft)",
                      marginBottom: 5,
                      cursor: "pointer",
                    }}
                  >
                    <span className="pm-clamp2">{m.title}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </Card>

      <div className="pm-toolbar" style={{ marginTop: 16 }}>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MaterialType | "all")}
          style={{ width: 160 }}
        >
          <option value="all">すべての種類</option>
          {MATERIAL_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </Select>
        <span className="pm-search-wrap">
          <TextInput
            className="pm-search"
            placeholder="資料名・内容で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </span>
        <div className="pm-spacer" />
        <button
          className="pm-btn primary"
          onClick={() => { setDraft({ ...EMPTY }); setCreating(true); }}
        >
          ＋ 資料を追加
        </button>
      </div>

      <div className="pm-grid cols-2">
        {items.map((m) => {
          const st = STATUSES.find((s) => s.id === m.status)!;
          const type = MATERIAL_TYPES.find((t) => t.id === m.type)!;
          return (
            <div
              key={m.id}
              className="pm-card"
              style={{ cursor: "pointer" }}
              onClick={() => { setEditing(m); setDraft({ ...m }); }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.5 }}>{m.title}</div>
                  <div className="pm-muted" style={{ fontSize: 10.5, marginTop: 2 }}>
                    {type.label} ・ {m.version} ・ 更新 {m.updatedAt}
                  </div>
                </div>
                <span className="pm-badge" style={{ background: `${st.color}22`, color: st.color }}>
                  {st.label}
                </span>
              </div>

              {m.summary && (
                <div className="pm-dim" style={{ fontSize: 11.5, lineHeight: 1.8, marginBottom: 10 }}>
                  {m.summary}
                </div>
              )}

              {m.useCase && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 9,
                    background: "rgba(217,178,106,0.07)",
                    border: "1px solid rgba(217,178,106,0.2)",
                  }}
                >
                  <div className="pm-gold-text" style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 3 }}>
                    ⚑ 使いどころ
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.75 }}>{m.useCase}</div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <span className="pm-muted" style={{ fontSize: 10.5 }}>
                  対象：{m.audience || "—"}
                </span>
                <div className="pm-spacer" />
                {m.url && (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pm-btn sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    開く
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(editing || creating) && (
        <Modal
          wide
          title={editing ? "資料を編集" : "資料を追加"}
          onClose={() => { setEditing(null); setCreating(false); }}
          footer={
            <>
              {editing && (
                <ConfirmButton
                  className="pm-btn danger"
                  onConfirm={async () => {
                    await remove("materials", editing.id);
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
          <Field label="資料名">
            <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
          </Field>
          <div className="pm-grid cols-4">
            <Field label="種類">
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as MaterialType })}>
                {MATERIAL_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="ステータス">
              <Select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Material["status"] })}
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="バージョン">
              <TextInput value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
            </Field>
            <Field label="担当">
              <TextInput value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
            </Field>
          </div>
          <div className="pm-grid cols-2">
            <Field label="対象読者">
              <TextInput
                value={draft.audience}
                onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
                placeholder="例）経営層・決裁者"
              />
            </Field>
            <Field label="ファイルのリンク" hint="Google Drive や Dropbox の共有URLを貼っておくと便利です。">
              <TextInput value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
            </Field>
          </div>
          <Field label="資料の要約">
            <TextArea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
          </Field>
          <Field label="使いどころ" hint="どんな場面で、どんな相手に、何を狙って出すか。">
            <TextArea value={draft.useCase} onChange={(e) => setDraft({ ...draft, useCase: e.target.value })} />
          </Field>
        </Modal>
      )}
    </>
  );
}
