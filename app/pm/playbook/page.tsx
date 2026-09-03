"use client";

// トークスクリプト：営業台本・想定問答・競合バトルカード

import { useMemo, useState } from "react";
import {
  Card,
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
import { download, localId, today } from "../_lib/format";
import type { Battlecard, Objection, ScriptLine, TalkScript } from "@/lib/pm/types";

type Tab = "scripts" | "objections" | "battlecards";

export default function PlaybookPage() {
  const { state } = usePm();
  const [tab, setTab] = useState<Tab>("scripts");

  if (!state) return null;

  return (
    <>
      <div className="pm-grid cols-3">
        <Stat label="トーク台本" tone="gold" value={state.scripts.length} unit="本" sub="シーン別の話す順番" />
        <Stat label="想定問答" tone="cyan" value={state.objections.length} unit="件" sub="断り文句への切り返し" />
        <Stat label="競合バトルカード" value={state.battlecards.length} unit="枚" sub="比較されたときの武器" />
      </div>

      <div style={{ marginTop: 16 }}>
        <Tabs
          tabs={[
            { id: "scripts" as Tab, label: "トーク台本", count: state.scripts.length },
            { id: "objections" as Tab, label: "想定問答", count: state.objections.length },
            { id: "battlecards" as Tab, label: "競合バトルカード", count: state.battlecards.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "scripts" && <Scripts />}
      {tab === "objections" && <Objections />}
      {tab === "battlecards" && <Battlecards />}
    </>
  );
}

// ---------------------------------------------------------------- 台本

function Scripts() {
  const { state, create, update, remove } = usePm();
  const [activeId, setActiveId] = useState("");
  const [editing, setEditing] = useState<TalkScript | null>(null);

  const scripts = state?.scripts ?? [];
  const active = scripts.find((s) => s.id === activeId) ?? scripts[0];

  if (!state) return null;

  const exportScript = (s: TalkScript) => {
    const text = [
      `【${s.scene}】`,
      `対象：${s.target}`,
      `ゴール：${s.goal}`,
      `想定時間：${s.durationMin}分`,
      "",
      ...s.lines.flatMap((l) => [
        `${l.speaker === "self" ? "▶ 自分" : "◀ 相手"}：${l.text}`,
        l.tip ? `   （ポイント）${l.tip}` : "",
        "",
      ]),
    ].filter((x) => x !== undefined).join("\n");
    download(`トーク台本_${s.scene}_${today()}.txt`, text);
  };

  const updateLine = (script: TalkScript, lineId: string, patch: Partial<ScriptLine>) => {
    void update("scripts", script.id, {
      lines: script.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    });
  };

  const addLine = (script: TalkScript, speaker: "self" | "customer") => {
    void update("scripts", script.id, {
      lines: [...script.lines, { id: localId("l"), speaker, text: "", tip: "" }],
    });
  };

  return (
    <div className="pm-grid" style={{ gridTemplateColumns: "minmax(0,240px) minmax(0,1fr)", alignItems: "start" }}>
      <Card title="シーン一覧">
        {scripts.map((s) => (
          <button
            key={s.id}
            className={`pm-nav-item ${active?.id === s.id ? "active" : ""}`}
            style={{ width: "100%", border: "none", background: active?.id === s.id ? undefined : "transparent", textAlign: "left", cursor: "pointer" }}
            onClick={() => setActiveId(s.id)}
          >
            <span className="pm-nav-label">
              {s.scene}
              <div className="pm-muted" style={{ fontSize: 10 }}>{s.durationMin}分 ・ {s.lines.length}ステップ</div>
            </span>
          </button>
        ))}
        <button
          className="pm-btn primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
          onClick={() =>
            create("scripts", {
              scene: "新しいシーン",
              target: "",
              goal: "",
              durationMin: 15,
              lines: [{ id: localId("l"), speaker: "self", text: "", tip: "" }],
            })
          }
        >
          ＋ 台本を追加
        </button>
      </Card>

      {active && (
        <Card
          title={active.scene}
          desc={`対象：${active.target || "—"} ／ ゴール：${active.goal || "—"} ／ 想定 ${active.durationMin}分`}
          actions={
            <>
              <button className="pm-btn sm" onClick={() => exportScript(active)}>テキスト出力</button>
              <button className="pm-btn sm" onClick={() => setEditing(active)}>設定</button>
            </>
          }
        >
          {active.lines.map((l, i) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                gap: 10,
                padding: "12px 0",
                borderBottom: "1px solid var(--pm-line-soft)",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  background: l.speaker === "self" ? "rgba(217,178,106,0.16)" : "rgba(79,195,217,0.13)",
                  color: l.speaker === "self" ? "#f0d69c" : "#4fc3d9",
                }}
                title={l.speaker === "self" ? "自分が話す" : "相手の想定発言"}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <select
                    className="pm-select"
                    style={{ padding: "2px 20px 2px 6px", fontSize: 10.5, width: 96 }}
                    value={l.speaker}
                    onChange={(e) => updateLine(active, l.id, { speaker: e.target.value as "self" | "customer" })}
                  >
                    <option value="self">▶ 自分</option>
                    <option value="customer">◀ 相手</option>
                  </select>
                  <div className="pm-spacer" />
                  <button
                    className="pm-btn sm ghost"
                    onClick={() =>
                      update("scripts", active.id, {
                        lines: active.lines.filter((x) => x.id !== l.id),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
                <TextArea
                  value={l.text}
                  onChange={(e) => updateLine(active, l.id, { text: e.target.value })}
                  placeholder="ここに話す内容を書きます"
                  style={{ minHeight: 56, fontSize: 12.5 }}
                />
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 5 }}>
                  <span className="pm-gold-text" style={{ fontSize: 10.5, paddingTop: 6, flexShrink: 0 }}>
                    ポイント
                  </span>
                  <TextArea
                    value={l.tip}
                    onChange={(e) => updateLine(active, l.id, { tip: e.target.value })}
                    placeholder="なぜこう言うのか／気をつけること"
                    style={{ minHeight: 38, fontSize: 11.5, color: "var(--pm-muted)" }}
                  />
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="pm-btn" onClick={() => addLine(active, "self")}>＋ 自分の発言</button>
            <button className="pm-btn" onClick={() => addLine(active, "customer")}>＋ 相手の発言</button>
            <div className="pm-spacer" />
            <ConfirmButton
              className="pm-btn danger"
              label="この台本を削除"
              onConfirm={() => {
                void remove("scripts", active.id);
                setActiveId("");
              }}
            />
          </div>
        </Card>
      )}

      {editing && (
        <Modal
          title="台本の設定"
          onClose={() => setEditing(null)}
          footer={
            <>
              <div className="pm-spacer" />
              <button className="pm-btn primary" onClick={() => setEditing(null)}>閉じる</button>
            </>
          }
        >
          <Field label="シーン名">
            <TextInput
              value={editing.scene}
              onChange={(e) => {
                setEditing({ ...editing, scene: e.target.value });
                void update("scripts", editing.id, { scene: e.target.value });
              }}
            />
          </Field>
          <Field label="対象（誰に話すか）">
            <TextInput
              value={editing.target}
              onChange={(e) => {
                setEditing({ ...editing, target: e.target.value });
                void update("scripts", editing.id, { target: e.target.value });
              }}
            />
          </Field>
          <Field label="ゴール（この会話で何を得るか）">
            <TextInput
              value={editing.goal}
              onChange={(e) => {
                setEditing({ ...editing, goal: e.target.value });
                void update("scripts", editing.id, { goal: e.target.value });
              }}
            />
          </Field>
          <Field label="想定時間（分）">
            <TextInput
              type="number"
              value={editing.durationMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                setEditing({ ...editing, durationMin: v });
                void update("scripts", editing.id, { durationMin: v });
              }}
            />
          </Field>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 想定問答

function Objections() {
  const { state, create, update, remove } = usePm();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [draft, setDraft] = useState<Omit<Objection, "id"> | null>(null);

  const categories = useMemo(
    () => Array.from(new Set((state?.objections ?? []).map((o) => o.category))),
    [state],
  );

  if (!state) return null;

  const items = state.objections.filter((o) => {
    const q = query.trim().toLowerCase();
    return (
      (cat === "all" || o.category === cat) &&
      (!q || `${o.question} ${o.answer}`.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="pm-toolbar">
        <Select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: 160 }}>
          <option value="all">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <span className="pm-search-wrap">
          <TextInput
            className="pm-search"
            placeholder="断り文句で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </span>
        <div className="pm-spacer" />
        <button
          className="pm-btn primary"
          onClick={() => setDraft({ category: "価格", question: "", answer: "", evidence: "" })}
        >
          ＋ 想定問答を追加
        </button>
      </div>

      <div className="pm-grid cols-2">
        {items.map((o) => (
          <div key={o.id} className="pm-card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
              <span className="pm-badge" style={{ background: "rgba(232,115,90,0.16)", color: "#e8735a" }}>
                {o.category}
              </span>
              <div className="pm-spacer" />
              <ConfirmButton label="✕" onConfirm={() => remove("objections", o.id)} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="pm-red-text" style={{ fontWeight: 700, flexShrink: 0 }}>Q</span>
              <TextArea
                value={o.question}
                onChange={(e) => update("objections", o.id, { question: e.target.value })}
                style={{ minHeight: 44, fontWeight: 600 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <span className="pm-gold-text" style={{ fontWeight: 700, flexShrink: 0 }}>A</span>
              <TextArea
                value={o.answer}
                onChange={(e) => update("objections", o.id, { answer: e.target.value })}
                style={{ minHeight: 104, lineHeight: 1.85 }}
              />
            </div>

            {(o.evidence || true) && (
              <div style={{ display: "flex", gap: 8 }}>
                <span className="pm-muted" style={{ fontSize: 10.5, flexShrink: 0, paddingTop: 6 }}>
                  根拠
                </span>
                <TextArea
                  value={o.evidence}
                  onChange={(e) => update("objections", o.id, { evidence: e.target.value })}
                  placeholder="どの資料の何ページに書いてあるか"
                  style={{ minHeight: 38, fontSize: 11, color: "var(--pm-muted)" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {draft && (
        <Modal
          title="想定問答を追加"
          onClose={() => setDraft(null)}
          footer={
            <>
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => setDraft(null)}>キャンセル</button>
              <button
                className="pm-btn primary"
                onClick={async () => {
                  if (!draft.question.trim()) return;
                  await create("objections", { ...draft });
                  setDraft(null);
                }}
              >
                保存
              </button>
            </>
          }
        >
          <Field label="カテゴリ">
            <TextInput
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="価格 / セキュリティ / 導入負荷 など"
            />
          </Field>
          <Field label="お客様の言葉（Q）">
            <TextArea value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} autoFocus />
          </Field>
          <Field label="切り返し（A）" hint="否定から入らず、いったん受け止めてから質問で返すと効果的です。">
            <TextArea value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
          </Field>
          <Field label="根拠となる資料">
            <TextInput value={draft.evidence} onChange={(e) => setDraft({ ...draft, evidence: e.target.value })} />
          </Field>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------- バトルカード

function Battlecards() {
  const { state, create, update, remove } = usePm();
  const [draft, setDraft] = useState<Omit<Battlecard, "id"> | null>(null);

  if (!state) return null;

  return (
    <>
      <div className="pm-toolbar">
        <div className="pm-muted" style={{ fontSize: 11.5, flex: 1 }}>
          「他社と比べてどうなの？」と聞かれたときの武器。相手の強みも正直に書いておくと、
          商談での説得力が上がります。
        </div>
        <button
          className="pm-btn primary"
          onClick={() =>
            setDraft({
              competitor: "",
              category: "",
              theirStrength: "",
              theirWeakness: "",
              ourAngle: "",
              killerQuestion: "",
            })
          }
        >
          ＋ バトルカードを追加
        </button>
      </div>

      <div className="pm-grid cols-2">
        {state.battlecards.map((b) => (
          <div key={b.id} className="pm-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{b.competitor}</div>
                <div className="pm-muted" style={{ fontSize: 10.5 }}>{b.category}</div>
              </div>
              <div className="pm-spacer" />
              <ConfirmButton label="✕" onConfirm={() => remove("battlecards", b.id)} />
            </div>

            <BattleField
              label="相手の強み（正直に認める）"
              color="var(--pm-muted)"
              value={b.theirStrength}
              onChange={(v) => update("battlecards", b.id, { theirStrength: v })}
            />
            <BattleField
              label="相手の弱み"
              color="#e8735a"
              value={b.theirWeakness}
              onChange={(v) => update("battlecards", b.id, { theirWeakness: v })}
            />
            <BattleField
              label="こちらの切り口"
              color="#f0d69c"
              value={b.ourAngle}
              onChange={(v) => update("battlecards", b.id, { ourAngle: v })}
            />
            <div
              style={{
                marginTop: 10,
                padding: 11,
                borderRadius: 10,
                background: "rgba(79,195,217,0.08)",
                border: "1px solid rgba(79,195,217,0.22)",
              }}
            >
              <div className="pm-cyan-text" style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>
                ⚑ 決め手になる質問
              </div>
              <TextArea
                value={b.killerQuestion}
                onChange={(e) => update("battlecards", b.id, { killerQuestion: e.target.value })}
                style={{ minHeight: 46, background: "transparent", border: "none", padding: 0 }}
              />
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <Modal
          title="バトルカードを追加"
          onClose={() => setDraft(null)}
          footer={
            <>
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => setDraft(null)}>キャンセル</button>
              <button
                className="pm-btn primary"
                onClick={async () => {
                  if (!draft.competitor.trim()) return;
                  await create("battlecards", { ...draft });
                  setDraft(null);
                }}
              >
                保存
              </button>
            </>
          }
        >
          <div className="pm-grid cols-2">
            <Field label="競合名">
              <TextInput value={draft.competitor} onChange={(e) => setDraft({ ...draft, competitor: e.target.value })} autoFocus />
            </Field>
            <Field label="カテゴリ">
              <TextInput value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </Field>
          </div>
          <Field label="相手の強み">
            <TextArea value={draft.theirStrength} onChange={(e) => setDraft({ ...draft, theirStrength: e.target.value })} />
          </Field>
          <Field label="相手の弱み">
            <TextArea value={draft.theirWeakness} onChange={(e) => setDraft({ ...draft, theirWeakness: e.target.value })} />
          </Field>
          <Field label="こちらの切り口">
            <TextArea value={draft.ourAngle} onChange={(e) => setDraft({ ...draft, ourAngle: e.target.value })} />
          </Field>
          <Field label="決め手になる質問">
            <TextArea value={draft.killerQuestion} onChange={(e) => setDraft({ ...draft, killerQuestion: e.target.value })} />
          </Field>
        </Modal>
      )}
    </>
  );
}

function BattleField({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight: 52, fontSize: 11.5, lineHeight: 1.75 }}
      />
    </div>
  );
}
