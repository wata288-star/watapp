"use client";

// OKR / KPI：目標（Objective）と成果指標（Key Result）の管理

import { useMemo, useState } from "react";
import {
  ConfirmButton,
  Field,
  Modal,
  Progress,
  Select,
  Stat,
  TextInput,
} from "../_components/ui";
import { usePm } from "../_lib/store";
import { localId, manYen, num } from "../_lib/format";
import { DEPTS, type Dept, type KeyResult, type Objective } from "@/lib/pm/types";

/** KR の達成率（開始値から目標値までの進み具合） */
function krProgress(kr: KeyResult): number {
  const span = kr.targetValue - kr.startValue;
  if (span === 0) return kr.currentValue >= kr.targetValue ? 100 : 0;
  return Math.max(0, Math.min(100, ((kr.currentValue - kr.startValue) / span) * 100));
}

function formatKr(kr: KeyResult, v: number): string {
  if (kr.unit === "円") return manYen(v);
  return `${num(v)}${kr.unit}`;
}

export default function OkrPage() {
  const { state, create, update, remove } = usePm();
  const [quarter, setQuarter] = useState("all");
  const [draft, setDraft] = useState<Omit<Objective, "id"> | null>(null);

  const quarters = useMemo(
    () => Array.from(new Set((state?.objectives ?? []).map((o) => o.quarter))).sort(),
    [state],
  );

  if (!state) return null;

  const objectives = state.objectives.filter((o) => quarter === "all" || o.quarter === quarter);

  const overall =
    objectives.length === 0
      ? 0
      : objectives.reduce((s, o) => {
          const krs = o.keyResults;
          const avg = krs.length ? krs.reduce((a, k) => a + krProgress(k), 0) / krs.length : 0;
          return s + avg;
        }, 0) / objectives.length;

  const allKrs = objectives.flatMap((o) => o.keyResults);
  const onTrack = allKrs.filter((k) => krProgress(k) >= 70).length;
  const atRisk = allKrs.filter((k) => krProgress(k) < 30).length;

  const updateKr = (obj: Objective, krId: string, patch: Partial<KeyResult>) => {
    void update("objectives", obj.id, {
      keyResults: obj.keyResults.map((k) => (k.id === krId ? { ...k, ...patch } : k)),
    });
  };

  const addKr = (obj: Objective) => {
    void update("objectives", obj.id, {
      keyResults: [
        ...obj.keyResults,
        {
          id: localId("kr"),
          title: "新しい成果指標",
          unit: "件",
          startValue: 0,
          targetValue: 10,
          currentValue: 0,
        },
      ],
    });
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat label="全体の達成率" tone="gold" value={Math.round(overall)} unit="%" sub={`目標 ${objectives.length}件`} />
        <Stat label="成果指標（KR）" value={allKrs.length} unit="件" />
        <Stat label="順調（70%以上）" tone="green" value={onTrack} unit="件" />
        <Stat label="要注意（30%未満）" tone={atRisk ? "red" : ""} value={atRisk} unit="件" sub="手を打つべき指標" />
      </div>

      <div className="pm-toolbar" style={{ marginTop: 16 }}>
        <Select value={quarter} onChange={(e) => setQuarter(e.target.value)} style={{ width: 150 }}>
          <option value="all">すべての四半期</option>
          {quarters.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </Select>
        <div className="pm-muted" style={{ fontSize: 11.5, flex: 1 }}>
          目標（Objective）は「どうなりたいか」、成果指標（KR）は「それをどう測るか」。
          数字の欄はその場で書き換えられます。
        </div>
        <button
          className="pm-btn primary"
          onClick={() =>
            setDraft({
              title: "",
              quarter: quarters[quarters.length - 1] ?? "2026 Q4",
              owner: "ワタル",
              dept: "sales",
              keyResults: [],
            })
          }
        >
          ＋ 目標を追加
        </button>
      </div>

      <div className="pm-grid cols-2">
        {objectives.map((o) => {
          const dept = DEPTS.find((d) => d.id === o.dept)!;
          const avg = o.keyResults.length
            ? o.keyResults.reduce((a, k) => a + krProgress(k), 0) / o.keyResults.length
            : 0;
          return (
            <div key={o.id} className="pm-card">
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span className="pm-badge" style={{ background: `${dept.color}22`, color: dept.color }}>
                      {dept.label}
                    </span>
                    <span className="pm-muted" style={{ fontSize: 10.5 }}>{o.quarter} ・ {o.owner}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.55 }}>{o.title}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    className="pm-mono"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: avg >= 70 ? "#5fcf9a" : avg >= 30 ? "#d9b26a" : "#e8735a",
                    }}
                  >
                    {Math.round(avg)}%
                  </div>
                </div>
              </div>

              <Progress value={avg} />

              <div style={{ marginTop: 14 }}>
                {o.keyResults.map((kr) => {
                  const p = krProgress(kr);
                  return (
                    <div key={kr.id} style={{ padding: "9px 0", borderTop: "1px solid var(--pm-line-soft)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <input
                          className="pm-cell-input"
                          style={{ flex: 1, fontSize: 12 }}
                          value={kr.title}
                          onChange={(e) => updateKr(o, kr.id, { title: e.target.value })}
                        />
                        <span
                          className="pm-mono"
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            width: 44,
                            textAlign: "right",
                            color: p >= 70 ? "#5fcf9a" : p >= 30 ? "#d9b26a" : "#e8735a",
                          }}
                        >
                          {Math.round(p)}%
                        </span>
                        <button
                          className="pm-btn sm ghost"
                          onClick={() =>
                            update("objectives", o.id, {
                              keyResults: o.keyResults.filter((k) => k.id !== kr.id),
                            })
                          }
                        >
                          ✕
                        </button>
                      </div>

                      <Progress value={p} color={p >= 70 ? "#5fcf9a" : p >= 30 ? "#d9b26a" : "#e8735a"} />

                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          marginTop: 6,
                          fontSize: 11,
                        }}
                      >
                        <span className="pm-muted">現在</span>
                        <input
                          type="number"
                          className="pm-cell-input pm-mono"
                          style={{ width: 96, textAlign: "right" }}
                          value={kr.currentValue}
                          onChange={(e) => updateKr(o, kr.id, { currentValue: Number(e.target.value) })}
                        />
                        <span className="pm-muted">/ 目標</span>
                        <input
                          type="number"
                          className="pm-cell-input pm-mono"
                          style={{ width: 96, textAlign: "right" }}
                          value={kr.targetValue}
                          onChange={(e) => updateKr(o, kr.id, { targetValue: Number(e.target.value) })}
                        />
                        <input
                          className="pm-cell-input"
                          style={{ width: 46 }}
                          value={kr.unit}
                          onChange={(e) => updateKr(o, kr.id, { unit: e.target.value })}
                        />
                        <div className="pm-spacer" />
                        <span className="pm-muted pm-nowrap">
                          {formatKr(kr, kr.currentValue)} → {formatKr(kr, kr.targetValue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="pm-btn sm" onClick={() => addKr(o)}>＋ 成果指標</button>
                <div className="pm-spacer" />
                <ConfirmButton label="目標を削除" onConfirm={() => remove("objectives", o.id)} />
              </div>
            </div>
          );
        })}
      </div>

      {objectives.length === 0 && <div className="pm-empty">この四半期の目標がまだありません。</div>}

      {draft && (
        <Modal
          title="目標（Objective）を追加"
          onClose={() => setDraft(null)}
          footer={
            <>
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => setDraft(null)}>キャンセル</button>
              <button
                className="pm-btn primary"
                onClick={async () => {
                  if (!draft.title.trim()) return;
                  await create("objectives", { ...draft });
                  setDraft(null);
                }}
              >
                保存
              </button>
            </>
          }
        >
          <Field
            label="目標（Objective）"
            hint="数字ではなく、達成したい状態を言葉で。例）パイロット導入を成立させ、再現可能な営業プロセスを確立する"
          >
            <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
          </Field>
          <div className="pm-grid cols-3">
            <Field label="四半期">
              <TextInput
                value={draft.quarter}
                onChange={(e) => setDraft({ ...draft, quarter: e.target.value })}
                placeholder="2026 Q4"
              />
            </Field>
            <Field label="部門">
              <Select value={draft.dept} onChange={(e) => setDraft({ ...draft, dept: e.target.value as Dept })}>
                {DEPTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="責任者">
              <TextInput value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
            </Field>
          </div>
          <div className="pm-muted" style={{ fontSize: 11.5, lineHeight: 1.8 }}>
            保存したあと、カード内の「＋ 成果指標」から測定する数字（KR）を追加してください。
            KR は 3〜5 個が目安です。多すぎると焦点がぼやけます。
          </div>
        </Modal>
      )}
    </>
  );
}
