"use client";

// 資金調達：投資家パイプライン・必要書類・ラウンド管理

import { useState } from "react";
import { Kanban } from "../_components/Kanban";
import {
  Card,
  ConfirmButton,
  Field,
  Modal,
  Progress,
  Select,
  Stat,
  Tabs,
  TextArea,
  TextInput,
} from "../_components/ui";
import { usePm } from "../_lib/store";
import { dueLabel, manYen, shortDate, today } from "../_lib/format";
import {
  INVESTOR_STATUSES,
  type FundingDoc,
  type Investor,
  type InvestorStatus,
} from "@/lib/pm/types";

const TYPES: { id: Investor["type"]; label: string }[] = [
  { id: "vc", label: "VC（ベンチャーキャピタル）" },
  { id: "cvc", label: "CVC（事業会社系）" },
  { id: "angel", label: "エンジェル投資家" },
  { id: "bank", label: "金融機関・融資" },
  { id: "grant", label: "補助金・助成金" },
  { id: "jgrants", label: "公的支援制度" },
];

const EMPTY_INVESTOR: Omit<Investor, "id"> = {
  name: "",
  type: "vc",
  personName: "",
  status: "longlist",
  ticketMin: 10_000_000,
  ticketMax: 50_000_000,
  thesis: "",
  intro: "",
  nextAction: "",
  nextActionDate: today(),
  memo: "",
};

export default function FundingPage() {
  const { state, create, update, remove } = usePm();
  const [tab, setTab] = useState<"pipeline" | "docs">("pipeline");
  const [editing, setEditing] = useState<Investor | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Investor, "id">>(EMPTY_INVESTOR);
  const [newDoc, setNewDoc] = useState("");

  if (!state) return null;

  const round = state.fundingRounds[0];
  const active = state.investors.filter((i) => !["passed"].includes(i.status));
  const closed = state.investors.filter((i) => i.status === "closed");
  const committed = closed.reduce((s, i) => s + i.ticketMin, 0);
  const docsDone = state.fundingDocs.filter((d) => d.status === "done").length;

  const save = async () => {
    if (!draft.name.trim()) return;
    if (editing) await update("investors", editing.id, { ...draft });
    else await create("investors", { ...draft });
    setEditing(null);
    setCreating(false);
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat
          label="調達目標"
          tone="gold"
          value={round ? manYen(round.targetAmount) : "—"}
          sub={round ? `${round.name} ・ 目標クローズ ${shortDate(round.targetClose)}` : "ラウンド未設定"}
        />
        <Stat
          label="コミット済"
          tone="green"
          value={manYen(round ? Math.max(round.committedAmount, committed) : committed)}
          sub={round ? `達成率 ${Math.round((Math.max(round.committedAmount, committed) / Math.max(1, round.targetAmount)) * 100)}%` : ""}
        />
        <Stat label="投資家パイプライン" tone="cyan" value={active.length} unit="件" sub={`見送り ${state.investors.length - active.length}件`} />
        <Stat
          label="必要書類の準備"
          value={`${docsDone}/${state.fundingDocs.length}`}
          sub={`未着手 ${state.fundingDocs.filter((d) => d.status === "todo").length}件`}
        />
      </div>

      {round && (
        <Card
          title={`◭ ${round.name}`}
          desc={`プレマネー評価額 ${manYen(round.preMoney)} ／ ステータス：${round.status}`}
          className=""
        >
          <Progress
            value={(Math.max(round.committedAmount, committed) / Math.max(1, round.targetAmount)) * 100}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5 }}>
            <span className="pm-muted">
              {manYen(Math.max(round.committedAmount, committed))} / {manYen(round.targetAmount)}
            </span>
            <span className="pm-muted">残り {dueLabel(round.targetClose).text}</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="pm-muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", marginBottom: 4 }}>
              資金使途
            </div>
            <TextArea
              value={round.useOfFunds}
              onChange={(e) => update("fundingRounds", round.id, { useOfFunds: e.target.value })}
              style={{ minHeight: 56 }}
            />
          </div>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <Tabs
          tabs={[
            { id: "pipeline" as const, label: "投資家パイプライン", count: state.investors.length },
            { id: "docs" as const, label: "必要書類チェックリスト", count: state.fundingDocs.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "pipeline" && (
        <>
          <div className="pm-toolbar">
            <div className="pm-muted" style={{ fontSize: 11.5, flex: 1 }}>
              カードをドラッグしてステータスを動かせます。
              エクイティより先に、希薄化しない融資・補助金を検討するのも有効です。
            </div>
            <button
              className="pm-btn primary"
              onClick={() => { setDraft({ ...EMPTY_INVESTOR }); setCreating(true); }}
            >
              ＋ 投資家を追加
            </button>
          </div>

          <Kanban
            columns={INVESTOR_STATUSES.map((s) => ({ id: s.id, label: s.label, color: s.color }))}
            items={state.investors}
            columnOf={(i) => i.status}
            onMove={(i, col) => update("investors", i.id, { status: col as InvestorStatus })}
            onAdd={(col) => {
              setDraft({ ...EMPTY_INVESTOR, status: col as InvestorStatus });
              setCreating(true);
            }}
            renderCard={(i) => {
              const due = dueLabel(i.nextActionDate);
              return (
                <div onClick={() => { setEditing(i); setDraft({ ...i }); }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 3 }}>{i.name}</div>
                  <div className="pm-muted" style={{ fontSize: 10.5, marginBottom: 7 }}>
                    {TYPES.find((t) => t.id === i.type)?.label}
                  </div>
                  <div className="pm-gold-text pm-mono" style={{ fontSize: 11.5, marginBottom: 6 }}>
                    {manYen(i.ticketMin)} 〜 {manYen(i.ticketMax)}
                  </div>
                  {i.nextAction && (
                    <div className="pm-clamp2 pm-dim" style={{ fontSize: 11, marginBottom: 5 }}>
                      → {i.nextAction}
                    </div>
                  )}
                  {i.nextActionDate && (
                    <div
                      style={{ fontSize: 10.5, textAlign: "right" }}
                      className={due.tone === "over" ? "pm-red-text" : due.tone === "soon" ? "pm-gold-text" : "pm-muted"}
                    >
                      {due.text}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </>
      )}

      {tab === "docs" && (
        <Card
          title="必要書類の準備状況"
          desc="投資家からデューデリで必ず求められる書類です。面談が決まってから作ると間に合いません。"
        >
          {["必須", "重要", "推奨"].map((cat) => {
            const docs = state.fundingDocs.filter((d) => d.category === cat);
            if (docs.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div
                  className="pm-muted"
                  style={{ fontSize: 10.5, letterSpacing: "0.12em", marginBottom: 6 }}
                >
                  {cat}（{docs.filter((d) => d.status === "done").length}/{docs.length}）
                </div>
                {docs.map((d) => (
                  <DocRow key={d.id} doc={d} onChange={(p) => update("fundingDocs", d.id, p)} onRemove={() => remove("fundingDocs", d.id)} />
                ))}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <TextInput
              placeholder="書類を追加（例：主要顧客との契約書ひな形）"
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDoc.trim()) {
                  void create("fundingDocs", {
                    name: newDoc.trim(),
                    category: "推奨",
                    status: "todo",
                    owner: "ワタル",
                    due: today(),
                    memo: "",
                  });
                  setNewDoc("");
                }
              }}
            />
            <button
              className="pm-btn primary"
              onClick={() => {
                if (!newDoc.trim()) return;
                void create("fundingDocs", {
                  name: newDoc.trim(),
                  category: "推奨",
                  status: "todo",
                  owner: "ワタル",
                  due: today(),
                  memo: "",
                });
                setNewDoc("");
              }}
            >
              追加
            </button>
          </div>
        </Card>
      )}

      {(editing || creating) && (
        <Modal
          wide
          title={editing ? `投資家：${draft.name}` : "投資家を追加"}
          onClose={() => { setEditing(null); setCreating(false); }}
          footer={
            <>
              {editing && (
                <ConfirmButton
                  className="pm-btn danger"
                  onConfirm={async () => {
                    await remove("investors", editing.id);
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
          <div className="pm-grid cols-2">
            <Field label="投資家名・機関名">
              <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
            </Field>
            <Field label="種別">
              <Select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as Investor["type"] })}
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="pm-grid cols-3">
            <Field label="担当者名">
              <TextInput value={draft.personName} onChange={(e) => setDraft({ ...draft, personName: e.target.value })} />
            </Field>
            <Field label="想定投資額 下限(円)">
              <TextInput
                type="number"
                step={1_000_000}
                value={draft.ticketMin}
                onChange={(e) => setDraft({ ...draft, ticketMin: Number(e.target.value) })}
              />
            </Field>
            <Field label="想定投資額 上限(円)">
              <TextInput
                type="number"
                step={1_000_000}
                value={draft.ticketMax}
                onChange={(e) => setDraft({ ...draft, ticketMax: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="投資テーマ" hint="どんな領域に投資しているか。ここが自社と合わないと時間の無駄になります。">
            <TextInput value={draft.thesis} onChange={(e) => setDraft({ ...draft, thesis: e.target.value })} />
          </Field>
          <Field label="紹介ルート" hint="コールドメールより紹介の方が成功率が圧倒的に高いです。">
            <TextInput value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} />
          </Field>
          <div className="pm-grid cols-2">
            <Field label="次のアクション">
              <TextInput value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} />
            </Field>
            <Field label="期日">
              <TextInput
                type="date"
                value={draft.nextActionDate}
                onChange={(e) => setDraft({ ...draft, nextActionDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="メモ">
            <TextArea value={draft.memo} onChange={(e) => setDraft({ ...draft, memo: e.target.value })} />
          </Field>
        </Modal>
      )}
    </>
  );
}

function DocRow({
  doc,
  onChange,
  onRemove,
}: {
  doc: FundingDoc;
  onChange: (patch: Partial<FundingDoc>) => void;
  onRemove: () => void;
}) {
  const due = dueLabel(doc.due);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 0",
        borderBottom: "1px solid var(--pm-line-soft)",
      }}
    >
      <input
        type="checkbox"
        checked={doc.status === "done"}
        onChange={(e) => onChange({ status: e.target.checked ? "done" : "todo" })}
        style={{ accentColor: "#5fcf9a", width: 15, height: 15, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ textDecoration: doc.status === "done" ? "line-through" : undefined, opacity: doc.status === "done" ? 0.55 : 1 }}>
          {doc.name}
        </div>
        {doc.memo && <div className="pm-muted" style={{ fontSize: 10.5 }}>{doc.memo}</div>}
      </div>
      <select
        className="pm-select"
        style={{ padding: "3px 22px 3px 6px", fontSize: 11, width: 92 }}
        value={doc.status}
        onChange={(e) => onChange({ status: e.target.value as FundingDoc["status"] })}
      >
        <option value="todo">未着手</option>
        <option value="doing">作成中</option>
        <option value="done">完了</option>
      </select>
      <input
        type="date"
        className="pm-cell-input"
        style={{ width: 130, fontSize: 11 }}
        value={doc.due}
        onChange={(e) => onChange({ due: e.target.value })}
      />
      <span
        style={{ fontSize: 10.5, width: 56, textAlign: "right" }}
        className={doc.status === "done" ? "pm-muted" : due.tone === "over" ? "pm-red-text" : "pm-muted"}
      >
        {doc.status === "done" ? "完了" : due.text}
      </span>
      <ConfirmButton label="✕" onConfirm={onRemove} />
    </div>
  );
}
