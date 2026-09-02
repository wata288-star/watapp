"use client";

// 商談パイプライン（CRM）

import Link from "next/link";
import { useMemo, useState } from "react";
import { Kanban } from "../_components/Kanban";
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
import { DEALS_HELPERS } from "../_lib/derive";
import { download, dueLabel, manYen, shortDate, toCsv, today } from "../_lib/format";
import { DEAL_STAGES, PLANS, type Deal, type DealStage, type Plan } from "@/lib/pm/types";

const EMPTY: Omit<Deal, "id"> = {
  company: "",
  industry: "",
  contactName: "",
  contactTitle: "",
  contactEmail: "",
  plan: "standard",
  amountInitial: 0,
  amountMonthly: 0,
  stage: "lead",
  probability: -1,
  owner: "ワタル",
  source: "",
  nextAction: "",
  nextActionDate: today(),
  expectedCloseDate: "",
  painPoints: "",
  notes: "",
  createdAt: today(),
};

export default function DealsPage() {
  const { state, create, update, remove } = usePm();
  const [view, setView] = useState<"board" | "table">("board");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Deal | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Deal, "id">>(EMPTY);

  const deals = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    if (!q) return state.deals;
    return state.deals.filter((d) =>
      [d.company, d.industry, d.contactName, d.notes, d.painPoints]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [state, query]);

  if (!state) return null;

  const open = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const weighted = open.reduce((s, d) => s + DEALS_HELPERS.weightedValue(d), 0);
  const total = open.reduce((s, d) => s + DEALS_HELPERS.firstYearValue(d), 0);
  const winRate = won.length + lost.length > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;

  const save = async () => {
    if (!draft.company.trim()) return;
    if (editing) await update("deals", editing.id, { ...draft });
    else await create("deals", { ...draft });
    setEditing(null);
    setCreating(false);
  };

  const exportCsv = () => {
    const rows = deals.map((d) => ({
      company: d.company,
      industry: d.industry,
      contact: `${d.contactName} ${d.contactTitle}`,
      plan: PLANS.find((p) => p.id === d.plan)?.label ?? "",
      stage: DEAL_STAGES.find((s) => s.id === d.stage)?.label ?? "",
      probability: DEALS_HELPERS.probability(d),
      firstYear: DEALS_HELPERS.firstYearValue(d),
      weighted: Math.round(DEALS_HELPERS.weightedValue(d)),
      nextAction: d.nextAction,
      nextActionDate: d.nextActionDate,
      expectedCloseDate: d.expectedCloseDate,
      owner: d.owner,
    }));
    download(
      `tomarun-商談一覧-${today()}.csv`,
      toCsv(rows, [
        { key: "company", label: "企業名" },
        { key: "industry", label: "業種" },
        { key: "contact", label: "担当者" },
        { key: "plan", label: "プラン" },
        { key: "stage", label: "ステージ" },
        { key: "probability", label: "確度(%)" },
        { key: "firstYear", label: "初年度売上(円)" },
        { key: "weighted", label: "加重売上(円)" },
        { key: "nextAction", label: "次アクション" },
        { key: "nextActionDate", label: "次アクション期日" },
        { key: "expectedCloseDate", label: "受注予定日" },
        { key: "owner", label: "担当" },
      ]),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat label="加重パイプライン" tone="gold" value={manYen(weighted)} sub="初年度売上 × 確度" />
        <Stat label="パイプライン総額" value={manYen(total)} sub={`進行中 ${open.length}件`} />
        <Stat label="受注" tone="green" value={won.length} unit="社" sub={`ARR ${manYen(won.reduce((s, d) => s + DEALS_HELPERS.monthly(d) * 12, 0))}`} />
        <Stat label="受注率" value={Math.round(winRate)} unit="%" sub={`受注${won.length} / 失注${lost.length}`} />
      </div>

      <div className="pm-toolbar" style={{ marginTop: 16 }}>
        <Tabs
          tabs={[
            { id: "board", label: "カンバン" },
            { id: "table", label: "一覧表" },
          ]}
          active={view}
          onChange={setView}
        />
        <div className="pm-spacer" />
        <span className="pm-search-wrap">
          <TextInput
            className="pm-search"
            placeholder="企業名・業種・メモで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </span>
        <button className="pm-btn" onClick={exportCsv}>CSV出力</button>
        <button
          className="pm-btn primary"
          onClick={() => { setDraft({ ...EMPTY }); setCreating(true); }}
        >
          ＋ 商談を追加
        </button>
      </div>

      {view === "board" ? (
        <Kanban
          columns={DEAL_STAGES.map((s) => {
            const sum = deals
              .filter((d) => d.stage === s.id)
              .reduce((acc, d) => acc + DEALS_HELPERS.firstYearValue(d), 0);
            return {
              id: s.id,
              label: s.label,
              color: s.color,
              note: sum > 0 ? `${manYen(sum)}（確度 ${s.probability}%）` : undefined,
            };
          })}
          items={deals}
          columnOf={(d) => d.stage}
          onMove={(d, col) => update("deals", d.id, { stage: col as DealStage, probability: -1 })}
          onAdd={(col) => { setDraft({ ...EMPTY, stage: col as DealStage }); setCreating(true); }}
          renderCard={(d) => {
            const plan = PLANS.find((p) => p.id === d.plan)!;
            const due = dueLabel(d.nextActionDate);
            return (
              <div onClick={() => { setEditing(d); setDraft({ ...d }); }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 3 }}>{d.company}</div>
                <div className="pm-muted" style={{ fontSize: 10.5, marginBottom: 7 }}>
                  {d.industry}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span className="pm-badge" style={{ background: "#d9b26a22", color: "#f0d69c" }}>
                    {plan.label.replace("プラン", "")}
                  </span>
                  <span className="pm-gold-text pm-mono" style={{ fontSize: 11.5, fontWeight: 700 }}>
                    {manYen(DEALS_HELPERS.firstYearValue(d))}
                  </span>
                </div>
                {d.nextAction && (
                  <div className="pm-clamp2 pm-dim" style={{ fontSize: 11, marginBottom: 5 }}>
                    → {d.nextAction}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
                  <span className="pm-muted">{d.contactName}</span>
                  {!["won", "lost"].includes(d.stage) && d.nextActionDate && (
                    <span className={due.tone === "over" ? "pm-red-text" : due.tone === "soon" ? "pm-gold-text" : "pm-muted"}>
                      {due.text}
                    </span>
                  )}
                </div>
              </div>
            );
          }}
        />
      ) : (
        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>企業名</th>
                <th>担当者</th>
                <th>プラン</th>
                <th>ステージ</th>
                <th className="num">確度</th>
                <th className="num">初年度売上</th>
                <th className="num">加重</th>
                <th>次アクション</th>
                <th>期日</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => {
                const stage = DEAL_STAGES.find((s) => s.id === d.stage)!;
                const due = dueLabel(d.nextActionDate);
                return (
                  <tr key={d.id}>
                    <td>
                      <button
                        className="pm-btn ghost sm"
                        style={{ border: "none", padding: 0, fontWeight: 700 }}
                        onClick={() => { setEditing(d); setDraft({ ...d }); }}
                      >
                        {d.company}
                      </button>
                      <div className="pm-muted" style={{ fontSize: 10.5 }}>{d.industry}</div>
                    </td>
                    <td className="pm-nowrap">
                      {d.contactName}
                      <div className="pm-muted" style={{ fontSize: 10.5 }}>{d.contactTitle}</div>
                    </td>
                    <td className="pm-nowrap">{PLANS.find((p) => p.id === d.plan)?.label.replace("プラン", "")}</td>
                    <td>
                      <span className="pm-badge" style={{ background: `${stage.color}22`, color: stage.color }}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="num">{DEALS_HELPERS.probability(d)}%</td>
                    <td className="num pm-nowrap">{manYen(DEALS_HELPERS.firstYearValue(d))}</td>
                    <td className="num pm-nowrap pm-gold-text">{manYen(DEALS_HELPERS.weightedValue(d))}</td>
                    <td style={{ maxWidth: 220 }}>
                      <span className="pm-clamp2">{d.nextAction || "—"}</span>
                    </td>
                    <td className={`pm-nowrap ${due.tone === "over" ? "pm-red-text" : ""}`}>
                      {shortDate(d.nextActionDate)}
                    </td>
                    <td>
                      <Link className="pm-btn sm ghost pm-nowrap" href={`/pm/roi?deal=${d.id}`}>
                        ROI試算
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="pm-grid cols-2" style={{ marginTop: 16 }}>
        <Card title="◔ ステージ別の内訳" desc="確度はステージの標準値。個別に上書きもできます。">
          <div className="pm-table-wrap" style={{ border: "none" }}>
            <table className="pm-table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>ステージ</th>
                  <th className="num">件数</th>
                  <th className="num">総額</th>
                  <th className="num">加重</th>
                </tr>
              </thead>
              <tbody>
                {DEAL_STAGES.map((s) => {
                  const items = deals.filter((d) => d.stage === s.id);
                  if (items.length === 0) return null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="pm-dot" style={{ background: s.color, display: "inline-block", marginRight: 6 }} />
                        {s.label}
                      </td>
                      <td className="num">{items.length}</td>
                      <td className="num pm-nowrap">
                        {manYen(items.reduce((acc, d) => acc + DEALS_HELPERS.firstYearValue(d), 0))}
                      </td>
                      <td className="num pm-nowrap pm-gold-text">
                        {manYen(items.reduce((acc, d) => acc + DEALS_HELPERS.weightedValue(d), 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="⚑ 失注から学ぶ" desc="同じ理由で落とさないために、失注理由を必ず残す。">
          {lost.length === 0 && <div className="pm-empty">失注案件はありません。</div>}
          {lost.map((d) => (
            <div key={d.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--pm-line-soft)" }}>
              <div style={{ fontWeight: 600 }}>{d.company}</div>
              <div className="pm-muted pm-pre" style={{ fontSize: 11.5 }}>{d.notes || "理由の記載なし"}</div>
            </div>
          ))}
        </Card>
      </div>

      {(editing || creating) && (
        <DealModal
          draft={draft}
          setDraft={setDraft}
          editingId={editing?.id}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={save}
          onDelete={editing ? async () => { await remove("deals", editing.id); setEditing(null); } : undefined}
        />
      )}
    </>
  );
}

function DealModal({
  draft,
  setDraft,
  editingId,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Omit<Deal, "id">;
  setDraft: (d: Omit<Deal, "id">) => void;
  editingId?: string;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const set = <K extends keyof Omit<Deal, "id">>(k: K, v: Omit<Deal, "id">[K]) =>
    setDraft({ ...draft, [k]: v });
  const plan = PLANS.find((p) => p.id === draft.plan)!;

  return (
    <Modal
      wide
      title={editingId ? `商談：${draft.company}` : "商談を追加"}
      onClose={onClose}
      footer={
        <>
          {onDelete && <ConfirmButton className="pm-btn danger" onConfirm={onDelete} />}
          <div className="pm-spacer" />
          {editingId && (
            <Link className="pm-btn" href={`/pm/roi?deal=${editingId}`}>ROI試算を作る</Link>
          )}
          <button className="pm-btn" onClick={onClose}>キャンセル</button>
          <button className="pm-btn primary" onClick={onSave}>保存</button>
        </>
      }
    >
      <div className="pm-grid cols-2">
        <Field label="企業名">
          <TextInput value={draft.company} onChange={(e) => set("company", e.target.value)} autoFocus />
        </Field>
        <Field label="業種">
          <TextInput
            value={draft.industry}
            onChange={(e) => set("industry", e.target.value)}
            placeholder="例）産業機械（射出成形機）"
          />
        </Field>
      </div>

      <div className="pm-grid cols-3">
        <Field label="担当者名">
          <TextInput value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </Field>
        <Field label="役職">
          <TextInput
            value={draft.contactTitle}
            onChange={(e) => set("contactTitle", e.target.value)}
            placeholder="例）サービス本部長"
          />
        </Field>
        <Field label="メール">
          <TextInput value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </Field>
      </div>

      <div className="pm-grid cols-2">
        <Field label="プラン" hint={plan.note}>
          <Select value={draft.plan} onChange={(e) => set("plan", e.target.value as Plan)}>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}（初期{manYen(p.initial)} / 月額{manYen(p.monthly)}）
              </option>
            ))}
          </Select>
        </Field>
        <Field label="ステージ">
          <Select value={draft.stage} onChange={(e) => set("stage", e.target.value as DealStage)}>
            {DEAL_STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}（標準確度 {s.probability}%）</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="pm-grid cols-3">
        <Field label="初期費用の上書き" hint="0 のときはプラン定価">
          <TextInput
            type="number"
            value={draft.amountInitial}
            onChange={(e) => set("amountInitial", Number(e.target.value))}
          />
        </Field>
        <Field label="月額の上書き" hint="0 のときはプラン定価">
          <TextInput
            type="number"
            value={draft.amountMonthly}
            onChange={(e) => set("amountMonthly", Number(e.target.value))}
          />
        </Field>
        <Field label="確度の上書き" hint="-1 のときはステージ標準値">
          <TextInput
            type="number"
            value={draft.probability}
            onChange={(e) => set("probability", Number(e.target.value))}
          />
        </Field>
      </div>

      <div
        className="pm-card"
        style={{ padding: 12, marginBottom: 12, background: "rgba(217,178,106,0.06)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span className="pm-dim">初年度売上（初期＋月額×12）</span>
          <span className="pm-gold-text pm-mono" style={{ fontWeight: 700 }}>
            {manYen(DEALS_HELPERS.firstYearValue({ ...draft, id: "tmp" } as Deal))}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
          <span className="pm-dim">加重売上（× 確度）</span>
          <span className="pm-mono">
            {manYen(DEALS_HELPERS.weightedValue({ ...draft, id: "tmp" } as Deal))}
          </span>
        </div>
      </div>

      <div className="pm-grid cols-2">
        <Field label="次のアクション">
          <TextInput
            value={draft.nextAction}
            onChange={(e) => set("nextAction", e.target.value)}
            placeholder="例）ROI試算を持って再訪、経営層同席を依頼"
          />
        </Field>
        <Field label="次アクションの期日">
          <TextInput type="date" value={draft.nextActionDate} onChange={(e) => set("nextActionDate", e.target.value)} />
        </Field>
      </div>

      <div className="pm-grid cols-3">
        <Field label="受注予定日">
          <TextInput type="date" value={draft.expectedCloseDate} onChange={(e) => set("expectedCloseDate", e.target.value)} />
        </Field>
        <Field label="担当">
          <TextInput value={draft.owner} onChange={(e) => set("owner", e.target.value)} />
        </Field>
        <Field label="流入経路">
          <TextInput
            value={draft.source}
            onChange={(e) => set("source", e.target.value)}
            placeholder="展示会 / 紹介 / Webサイト など"
          />
        </Field>
      </div>

      <Field
        label="顧客の課題（ペインポイント）"
        hint="ここが具体的なほど提案が刺さります。ベテランの退職時期は必ず聞く。"
      >
        <TextArea value={draft.painPoints} onChange={(e) => set("painPoints", e.target.value)} />
      </Field>

      <Field label="メモ・商談履歴">
        <TextArea value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </Modal>
  );
}
