"use client";

// 展示会マネジメント：出展準備チェックリスト・獲得リード・費用対効果

import { useMemo, useState } from "react";
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
import { diffDays, download, localId, manYen, shortDate, toCsv, today, yen } from "../_lib/format";
import type { ExpoChecklistItem, ExpoEvent, ExpoLead, LeadHeat } from "@/lib/pm/types";

const HEATS: { id: LeadHeat; label: string; color: string; desc: string }[] = [
  { id: "hot", label: "ホット", color: "#e8735a", desc: "課題が明確・決裁に近い。48時間以内にフォロー。" },
  { id: "warm", label: "ウォーム", color: "#d9b26a", desc: "興味はあるが検討初期。資料送付とナーチャリング。" },
  { id: "cold", label: "コールド", color: "#6f8b9d", desc: "情報収集段階。メルマガ配信の対象に。" },
];

const EXPO_STATUS: { id: ExpoEvent["status"]; label: string; color: string }[] = [
  { id: "planning", label: "検討中", color: "#6f8b9d" },
  { id: "confirmed", label: "出展確定", color: "#4fc3d9" },
  { id: "running", label: "開催中", color: "#d9b26a" },
  { id: "done", label: "終了", color: "#5fcf9a" },
  { id: "cancelled", label: "中止", color: "#e8735a" },
];

const EMPTY_EXPO: Omit<ExpoEvent, "id"> = {
  name: "",
  venue: "",
  start: today(),
  end: today(),
  boothSize: "",
  cost: 0,
  targetLeads: 100,
  targetDeals: 5,
  status: "planning",
  notes: "",
  checklist: [],
};

const EMPTY_LEAD: Omit<ExpoLead, "id"> = {
  expoId: "",
  company: "",
  name: "",
  title: "",
  email: "",
  phone: "",
  heat: "warm",
  interest: "",
  memo: "",
  followedUp: false,
  convertedDealId: "",
  createdAt: today(),
};

export default function ExpoPage() {
  const { state, create, update, remove, showToast } = usePm();
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState<"checklist" | "leads">("checklist");
  const [editingExpo, setEditingExpo] = useState<ExpoEvent | null>(null);
  const [creatingExpo, setCreatingExpo] = useState(false);
  const [expoDraft, setExpoDraft] = useState<Omit<ExpoEvent, "id">>(EMPTY_EXPO);
  const [leadDraft, setLeadDraft] = useState<Omit<ExpoLead, "id"> | null>(null);
  const [newCheckLabel, setNewCheckLabel] = useState("");

  const expos = useMemo(
    () => [...(state?.expos ?? [])].sort((a, b) => a.start.localeCompare(b.start)),
    [state],
  );
  const selected = expos.find((e) => e.id === selectedId) ?? expos[0];

  if (!state) return null;

  const leads = state.expoLeads.filter((l) => l.expoId === selected?.id);
  const totalLeads = state.expoLeads.length;
  const totalCost = expos
    .filter((e) => e.status !== "cancelled")
    .reduce((s, e) => s + e.cost, 0);
  const converted = state.expoLeads.filter((l) => l.convertedDealId).length;

  const saveExpo = async () => {
    if (!expoDraft.name.trim()) return;
    if (editingExpo) await update("expos", editingExpo.id, { ...expoDraft });
    else await create("expos", { ...expoDraft });
    setEditingExpo(null);
    setCreatingExpo(false);
  };

  const toggleCheck = (item: ExpoChecklistItem) => {
    if (!selected) return;
    const checklist = selected.checklist.map((c) =>
      c.id === item.id ? { ...c, done: !c.done } : c,
    );
    void update("expos", selected.id, { checklist });
  };

  const updateCheck = (id: string, patch: Partial<ExpoChecklistItem>) => {
    if (!selected) return;
    const checklist = selected.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c));
    void update("expos", selected.id, { checklist });
  };

  const addCheck = () => {
    if (!selected || !newCheckLabel.trim()) return;
    const checklist = [
      ...selected.checklist,
      {
        id: localId("c"),
        label: newCheckLabel.trim(),
        done: false,
        due: selected.start,
        owner: "ワタル",
        category: "その他",
      },
    ];
    void update("expos", selected.id, { checklist });
    setNewCheckLabel("");
  };

  const removeCheck = (id: string) => {
    if (!selected) return;
    void update("expos", selected.id, {
      checklist: selected.checklist.filter((c) => c.id !== id),
    });
  };

  const convertLead = async (lead: ExpoLead) => {
    await create("deals", {
      company: lead.company,
      industry: "",
      contactName: lead.name,
      contactTitle: lead.title,
      contactEmail: lead.email,
      plan: "starter",
      amountInitial: 0,
      amountMonthly: 0,
      stage: "lead",
      probability: -1,
      owner: "ワタル",
      source: `展示会（${selected?.name ?? ""}）`,
      nextAction: "初回ヒアリングのアポ打診",
      nextActionDate: today(),
      expectedCloseDate: "",
      painPoints: lead.interest,
      notes: lead.memo,
      createdAt: today(),
    });
    await update("expoLeads", lead.id, { convertedDealId: "pending", followedUp: true });
    showToast("商談パイプラインに追加しました");
  };

  const exportLeads = () => {
    if (!selected) return;
    download(
      `${selected.name}-リード-${today()}.csv`,
      toCsv(
        leads.map((l) => ({
          ...l,
          heat: HEATS.find((h) => h.id === l.heat)?.label ?? "",
          followedUp: l.followedUp ? "済" : "未",
        })),
        [
          { key: "company", label: "会社名" },
          { key: "name", label: "氏名" },
          { key: "title", label: "役職" },
          { key: "email", label: "メール" },
          { key: "phone", label: "電話" },
          { key: "heat", label: "温度感" },
          { key: "interest", label: "関心事" },
          { key: "memo", label: "メモ" },
          { key: "followedUp", label: "フォロー" },
        ],
      ),
      "text/csv;charset=utf-8",
    );
  };

  const checklistDone = selected?.checklist.filter((c) => c.done).length ?? 0;
  const checklistTotal = selected?.checklist.length ?? 0;
  const categories = Array.from(new Set(selected?.checklist.map((c) => c.category) ?? []));

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat
          label="出展予定"
          value={expos.filter((e) => e.status === "confirmed" || e.status === "planning").length}
          unit="件"
          sub={expos[0] ? `次回 ${shortDate(expos[0].start)}` : "—"}
        />
        <Stat label="年間の出展予算" tone="gold" value={manYen(totalCost)} sub="中止分を除く合計" />
        <Stat label="獲得リード累計" tone="cyan" value={totalLeads} unit="件" />
        <Stat
          label="商談化"
          tone="green"
          value={converted}
          unit="件"
          sub={`商談化率 ${totalLeads ? Math.round((converted / totalLeads) * 100) : 0}%`}
        />
      </div>

      {/* 展示会カード一覧 */}
      <div className="pm-toolbar" style={{ marginTop: 16 }}>
        <div className="pm-section-title" style={{ margin: 0, flex: 1 }}>出展計画</div>
        <button
          className="pm-btn primary"
          onClick={() => { setExpoDraft({ ...EMPTY_EXPO }); setCreatingExpo(true); }}
        >
          ＋ 展示会を追加
        </button>
      </div>

      <div className="pm-grid cols-3">
        {expos.map((e) => {
          const st = EXPO_STATUS.find((s) => s.id === e.status)!;
          const days = diffDays(today(), e.start);
          const done = e.checklist.filter((c) => c.done).length;
          const isSelected = selected?.id === e.id;
          return (
            <div
              key={e.id}
              className="pm-card"
              style={{ cursor: "pointer", borderColor: isSelected ? "var(--pm-gold)" : undefined }}
              onClick={() => setSelectedId(e.id)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                  <div className="pm-muted" style={{ fontSize: 11 }}>
                    {e.venue} ・ {shortDate(e.start)}〜{shortDate(e.end)}
                  </div>
                </div>
                <span className="pm-badge" style={{ background: `${st.color}22`, color: st.color }}>
                  {st.label}
                </span>
              </div>

              <div style={{ margin: "12px 0 4px", display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span className="pm-dim">準備 {done}/{e.checklist.length}</span>
                <span className={days < 0 ? "pm-muted" : days < 30 ? "pm-gold-text" : "pm-muted"}>
                  {days < 0 ? "終了" : `あと${days}日`}
                </span>
              </div>
              <Progress value={(done / Math.max(1, e.checklist.length)) * 100} />

              <div className="pm-grid cols-3" style={{ marginTop: 12, gap: 6 }}>
                <div>
                  <div className="pm-muted" style={{ fontSize: 10 }}>費用</div>
                  <div className="pm-mono" style={{ fontSize: 12 }}>{manYen(e.cost)}</div>
                </div>
                <div>
                  <div className="pm-muted" style={{ fontSize: 10 }}>目標リード</div>
                  <div className="pm-mono" style={{ fontSize: 12 }}>{e.targetLeads}件</div>
                </div>
                <div>
                  <div className="pm-muted" style={{ fontSize: 10 }}>リード単価</div>
                  <div className="pm-mono" style={{ fontSize: 12 }}>
                    {e.targetLeads ? yen(e.cost / e.targetLeads) : "—"}
                  </div>
                </div>
              </div>

              <button
                className="pm-btn sm ghost"
                style={{ marginTop: 10 }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setEditingExpo(e);
                  setExpoDraft({ ...e });
                }}
              >
                編集
              </button>
            </div>
          );
        })}
      </div>

      {selected && (
        <>
          <div className="pm-section-title">{selected.name} の詳細</div>
          <Tabs
            tabs={[
              { id: "checklist", label: "準備チェックリスト", count: checklistTotal },
              { id: "leads", label: "獲得リード", count: leads.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "checklist" && (
            <>
              <Card
                title={`準備の進捗 ${checklistDone}/${checklistTotal}`}
                desc={selected.notes}
              >
                <Progress value={(checklistDone / Math.max(1, checklistTotal)) * 100} />

                {categories.map((cat) => (
                  <div key={cat} style={{ marginTop: 16 }}>
                    <div
                      className="pm-muted"
                      style={{ fontSize: 10.5, letterSpacing: "0.12em", marginBottom: 6 }}
                    >
                      {cat}
                    </div>
                    {selected.checklist
                      .filter((c) => c.category === cat)
                      .map((c) => {
                        const late = !c.done && diffDays(today(), c.due) < 0;
                        return (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 0",
                              borderBottom: "1px solid var(--pm-line-soft)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={c.done}
                              onChange={() => toggleCheck(c)}
                              style={{ accentColor: "#5fcf9a", width: 15, height: 15, flexShrink: 0 }}
                            />
                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                textDecoration: c.done ? "line-through" : undefined,
                                opacity: c.done ? 0.5 : 1,
                              }}
                            >
                              {c.label}
                            </span>
                            <input
                              type="date"
                              className="pm-cell-input pm-nowrap"
                              style={{ width: 130, fontSize: 11 }}
                              value={c.due}
                              onChange={(e) => updateCheck(c.id, { due: e.target.value })}
                            />
                            <input
                              className="pm-cell-input"
                              style={{ width: 76, fontSize: 11 }}
                              value={c.owner}
                              onChange={(e) => updateCheck(c.id, { owner: e.target.value })}
                            />
                            <span
                              className={late ? "pm-red-text" : "pm-muted"}
                              style={{ fontSize: 10.5, width: 56, textAlign: "right" }}
                            >
                              {c.done ? "完了" : late ? "遅延" : ""}
                            </span>
                            <button className="pm-btn sm ghost" onClick={() => removeCheck(c.id)}>✕</button>
                          </div>
                        );
                      })}
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <TextInput
                    placeholder="準備項目を追加（例：会期後のフォローメール文面を作成）"
                    value={newCheckLabel}
                    onChange={(e) => setNewCheckLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCheck()}
                  />
                  <button className="pm-btn primary" onClick={addCheck}>追加</button>
                </div>
              </Card>

              <Card title="◔ 展示会で成果を出すための基本" className="pm-no-print" >
                <div className="pm-grid cols-3">
                  <div>
                    <div className="pm-gold-text" style={{ fontWeight: 700, marginBottom: 5 }}>
                      ① メッセージは1つだけ
                    </div>
                    <div className="pm-dim" style={{ fontSize: 11.5, lineHeight: 1.8 }}>
                      通路から3秒で読める大きさで「原因調査を、最短5分へ。」だけを掲げる。
                      機能を並べると誰も足を止めません。
                    </div>
                  </div>
                  <div>
                    <div className="pm-gold-text" style={{ fontWeight: 700, marginBottom: 5 }}>
                      ② 質問から入る
                    </div>
                    <div className="pm-dim" style={{ fontSize: 11.5, lineHeight: 1.8 }}>
                      「機械が止まったとき、原因を突き止めるまでどのくらいかかりますか？」
                      説明ではなく質問で始めると足が止まります。
                    </div>
                  </div>
                  <div>
                    <div className="pm-gold-text" style={{ fontWeight: 700, marginBottom: 5 }}>
                      ③ 48時間以内にフォロー
                    </div>
                    <div className="pm-dim" style={{ fontSize: 11.5, lineHeight: 1.8 }}>
                      展示会のリードは鮮度がすべて。ホットは翌営業日、
                      ウォームは2日以内に必ず一次連絡を入れます。
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {tab === "leads" && (
            <>
              <div className="pm-toolbar">
                <div className="pm-grid cols-3" style={{ flex: 1, gap: 8 }}>
                  {HEATS.map((h) => (
                    <div key={h.id} className="pm-card" style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="pm-dot" style={{ background: h.color }} />
                        <span style={{ fontWeight: 700, color: h.color }}>{h.label}</span>
                        <span className="pm-spacer" />
                        <span className="pm-mono">{leads.filter((l) => l.heat === h.id).length}</span>
                      </div>
                      <div className="pm-muted" style={{ fontSize: 10.5 }}>{h.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pm-toolbar">
                <div className="pm-spacer" />
                <button className="pm-btn" onClick={exportLeads}>CSV出力</button>
                <button
                  className="pm-btn primary"
                  onClick={() => setLeadDraft({ ...EMPTY_LEAD, expoId: selected.id })}
                >
                  ＋ リードを追加
                </button>
              </div>

              <div className="pm-table-wrap">
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>会社名</th>
                      <th>氏名 / 役職</th>
                      <th>温度感</th>
                      <th>関心事</th>
                      <th>メモ</th>
                      <th>フォロー</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="pm-empty">
                          まだリードが登録されていません。会期中はここに直接入力していきます。
                        </td>
                      </tr>
                    )}
                    {leads.map((l) => {
                      const h = HEATS.find((x) => x.id === l.heat)!;
                      return (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 600 }}>{l.company}</td>
                          <td className="pm-nowrap">
                            {l.name}
                            <div className="pm-muted" style={{ fontSize: 10.5 }}>{l.title}</div>
                          </td>
                          <td>
                            <select
                              className="pm-select"
                              style={{ padding: "3px 22px 3px 6px", fontSize: 11.5, color: h.color }}
                              value={l.heat}
                              onChange={(e) => update("expoLeads", l.id, { heat: e.target.value })}
                            >
                              {HEATS.map((x) => (
                                <option key={x.id} value={x.id}>{x.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>{l.interest || "—"}</td>
                          <td style={{ maxWidth: 240 }}>
                            <span className="pm-clamp2 pm-muted">{l.memo || "—"}</span>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={l.followedUp}
                              onChange={(e) => update("expoLeads", l.id, { followedUp: e.target.checked })}
                              style={{ accentColor: "#5fcf9a" }}
                            />
                          </td>
                          <td className="pm-nowrap">
                            {l.convertedDealId ? (
                              <span className="pm-green-text" style={{ fontSize: 11 }}>商談化済</span>
                            ) : (
                              <button className="pm-btn sm" onClick={() => convertLead(l)}>
                                商談化
                              </button>
                            )}
                            <ConfirmButton onConfirm={() => remove("expoLeads", l.id)} label="✕" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* 展示会の編集モーダル */}
      {(editingExpo || creatingExpo) && (
        <Modal
          title={editingExpo ? "展示会を編集" : "展示会を追加"}
          onClose={() => { setEditingExpo(null); setCreatingExpo(false); }}
          footer={
            <>
              {editingExpo && (
                <ConfirmButton
                  className="pm-btn danger"
                  onConfirm={async () => {
                    await remove("expos", editingExpo.id);
                    setEditingExpo(null);
                  }}
                />
              )}
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => { setEditingExpo(null); setCreatingExpo(false); }}>
                キャンセル
              </button>
              <button className="pm-btn primary" onClick={saveExpo}>保存</button>
            </>
          }
        >
          <Field label="展示会名">
            <TextInput
              value={expoDraft.name}
              onChange={(e) => setExpoDraft({ ...expoDraft, name: e.target.value })}
              autoFocus
            />
          </Field>
          <div className="pm-grid cols-2">
            <Field label="会場">
              <TextInput value={expoDraft.venue} onChange={(e) => setExpoDraft({ ...expoDraft, venue: e.target.value })} />
            </Field>
            <Field label="小間サイズ">
              <TextInput value={expoDraft.boothSize} onChange={(e) => setExpoDraft({ ...expoDraft, boothSize: e.target.value })} />
            </Field>
          </div>
          <div className="pm-grid cols-3">
            <Field label="開始日">
              <TextInput type="date" value={expoDraft.start} onChange={(e) => setExpoDraft({ ...expoDraft, start: e.target.value })} />
            </Field>
            <Field label="終了日">
              <TextInput type="date" value={expoDraft.end} onChange={(e) => setExpoDraft({ ...expoDraft, end: e.target.value })} />
            </Field>
            <Field label="ステータス">
              <Select
                value={expoDraft.status}
                onChange={(e) => setExpoDraft({ ...expoDraft, status: e.target.value as ExpoEvent["status"] })}
              >
                {EXPO_STATUS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="pm-grid cols-3">
            <Field label="出展費用(円)">
              <TextInput type="number" step={10000} value={expoDraft.cost} onChange={(e) => setExpoDraft({ ...expoDraft, cost: Number(e.target.value) })} />
            </Field>
            <Field label="目標リード数">
              <TextInput type="number" value={expoDraft.targetLeads} onChange={(e) => setExpoDraft({ ...expoDraft, targetLeads: Number(e.target.value) })} />
            </Field>
            <Field label="目標商談数">
              <TextInput type="number" value={expoDraft.targetDeals} onChange={(e) => setExpoDraft({ ...expoDraft, targetDeals: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="メモ・出展の狙い">
            <TextArea value={expoDraft.notes} onChange={(e) => setExpoDraft({ ...expoDraft, notes: e.target.value })} />
          </Field>
        </Modal>
      )}

      {/* リード追加モーダル */}
      {leadDraft && (
        <Modal
          title="リードを追加"
          onClose={() => setLeadDraft(null)}
          footer={
            <>
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => setLeadDraft(null)}>キャンセル</button>
              <button
                className="pm-btn primary"
                onClick={async () => {
                  if (!leadDraft.company.trim()) return;
                  await create("expoLeads", { ...leadDraft });
                  setLeadDraft(null);
                }}
              >
                保存
              </button>
            </>
          }
        >
          <div className="pm-grid cols-2">
            <Field label="会社名">
              <TextInput value={leadDraft.company} onChange={(e) => setLeadDraft({ ...leadDraft, company: e.target.value })} autoFocus />
            </Field>
            <Field label="氏名">
              <TextInput value={leadDraft.name} onChange={(e) => setLeadDraft({ ...leadDraft, name: e.target.value })} />
            </Field>
          </div>
          <div className="pm-grid cols-3">
            <Field label="役職">
              <TextInput value={leadDraft.title} onChange={(e) => setLeadDraft({ ...leadDraft, title: e.target.value })} />
            </Field>
            <Field label="メール">
              <TextInput value={leadDraft.email} onChange={(e) => setLeadDraft({ ...leadDraft, email: e.target.value })} />
            </Field>
            <Field label="電話">
              <TextInput value={leadDraft.phone} onChange={(e) => setLeadDraft({ ...leadDraft, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="温度感" hint={HEATS.find((h) => h.id === leadDraft.heat)?.desc}>
            <Select
              value={leadDraft.heat}
              onChange={(e) => setLeadDraft({ ...leadDraft, heat: e.target.value as LeadHeat })}
            >
              {HEATS.map((h) => (
                <option key={h.id} value={h.id}>{h.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="関心事" hint="どの話に一番反応したかを一言で。">
            <TextInput value={leadDraft.interest} onChange={(e) => setLeadDraft({ ...leadDraft, interest: e.target.value })} />
          </Field>
          <Field label="メモ">
            <TextArea value={leadDraft.memo} onChange={(e) => setLeadDraft({ ...leadDraft, memo: e.target.value })} />
          </Field>
        </Modal>
      )}
    </>
  );
}
