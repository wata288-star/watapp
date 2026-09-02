"use client";

// ROIシミュレーター
// tomarunroisimulator.xlsx のモデルを、商談中にその場で数字を動かせる形にしたもの。

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarList, Card, Field, Select, Stat, TextInput } from "../_components/ui";
import { usePm } from "../_lib/store";
import { download, manYen, num, today, yen } from "../_lib/format";
import { DEFAULT_ROI_INPUTS, calcRoi, roiSummaryText } from "@/lib/pm/roi";
import { PLANS, type Plan, type RoiInputs } from "@/lib/pm/types";

export default function RoiPage() {
  return (
    <Suspense fallback={<div className="pm-empty">読み込み中…</div>}>
      <RoiInner />
    </Suspense>
  );
}

function RoiInner() {
  const { state, create, update, remove, showToast } = usePm();
  const params = useSearchParams();
  const dealId = params.get("deal") ?? "";

  const [inputs, setInputs] = useState<RoiInputs>(DEFAULT_ROI_INPUTS);
  const [scenarioName, setScenarioName] = useState("");
  const [activeScenario, setActiveScenario] = useState("");
  const [linkedDeal, setLinkedDeal] = useState(dealId);

  // 商談から遷移してきたときは、その商談のシナリオがあれば読み込む。
  // URL の deal が変わったタイミングだけ、レンダー中に state を調整する。
  const [loadedDealId, setLoadedDealId] = useState("");
  if (state && dealId && loadedDealId !== dealId) {
    setLoadedDealId(dealId);
    const s = state.roiScenarios.find((x) => x.dealId === dealId);
    if (s) {
      setInputs(s.inputs);
      setActiveScenario(s.id);
      setScenarioName(s.name);
    } else {
      const deal = state.deals.find((d) => d.id === dealId);
      if (deal) {
        setInputs((prev) => ({ ...prev, plan: deal.plan }));
        setScenarioName(deal.company);
      }
    }
    setLinkedDeal(dealId);
  }

  const result = useMemo(() => calcRoi(inputs), [inputs]);

  if (!state) return null;

  const set = <K extends keyof RoiInputs>(k: K, v: RoiInputs[K]) =>
    setInputs((prev) => ({ ...prev, [k]: v }));

  const customerName =
    state.deals.find((d) => d.id === linkedDeal)?.company || scenarioName || "";

  const saveScenario = async () => {
    const name = scenarioName.trim() || `試算 ${today()}`;
    if (activeScenario) {
      await update("roiScenarios", activeScenario, { name, inputs, dealId: linkedDeal });
      showToast("シナリオを更新しました");
    } else {
      await create("roiScenarios", {
        name,
        inputs,
        dealId: linkedDeal,
        createdAt: today(),
        memo: "",
      });
    }
  };

  const loadScenario = (id: string) => {
    const s = state.roiScenarios.find((x) => x.id === id);
    if (!s) return;
    setInputs(s.inputs);
    setActiveScenario(s.id);
    setScenarioName(s.name);
    setLinkedDeal(s.dealId);
  };

  const summary = roiSummaryText(inputs, result, customerName);

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat
          label="年間効果（合計）"
          tone="gold"
          value={manYen(result.annual.total)}
          sub="人件費削減＋ダウンタイム回避＋部品受注＋OEM"
        />
        <Stat
          label="年間純増"
          tone={result.annual.net >= 0 ? "green" : "red"}
          value={manYen(result.annual.net)}
          sub={`年間コスト ${manYen(result.annual.cost)}`}
        />
        <Stat
          label="投資回収期間"
          tone="cyan"
          value={result.paybackMonths === null ? "36+" : result.paybackMonths}
          unit="ヶ月"
          sub={result.paybackMonths === null ? "36ヶ月では回収できません" : "累積収支がプラスに転じる月"}
        />
        <Stat
          label="1年目 ROI"
          value={Math.round(result.roiYear1)}
          unit="%"
          sub={`3年累計 ${Math.round(result.roiYear3)}%`}
        />
      </div>

      <div
        className="pm-grid"
        style={{ gridTemplateColumns: "minmax(0,340px) minmax(0,1fr)", marginTop: 16, alignItems: "start" }}
      >
        {/* ------------------------------------------------ 入力 */}
        <Card title="⌁ 前提条件を入力" desc="商談中に相手の数字を聞きながら、その場で動かしてください。">
          <Field label="プラン">
            <Select value={inputs.plan} onChange={(e) => set("plan", e.target.value as Plan)}>
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}（初期{manYen(p.initial)} / 月{manYen(p.monthly)}）
                </option>
              ))}
            </Select>
          </Field>

          <div className="pm-section-title" style={{ marginTop: 14 }}>① 人件費削減</div>
          <div className="pm-grid cols-2" style={{ gap: 8 }}>
            <Field label="月間トラブル対応件数">
              <TextInput type="number" value={inputs.monthlyCases} onChange={(e) => set("monthlyCases", Number(e.target.value))} />
            </Field>
            <Field label="エンジニア時間単価(円)">
              <TextInput type="number" step={100} value={inputs.hourlyCost} onChange={(e) => set("hourlyCost", Number(e.target.value))} />
            </Field>
            <Field label="従来の対応時間(分)">
              <TextInput type="number" value={inputs.beforeMinutes} onChange={(e) => set("beforeMinutes", Number(e.target.value))} />
            </Field>
            <Field label="導入後の対応時間(分)">
              <TextInput type="number" value={inputs.afterMinutes} onChange={(e) => set("afterMinutes", Number(e.target.value))} />
            </Field>
          </div>
          <Field
            label={`効果発現率 ${Math.round(inputs.timeSavedRatio * 100)}%`}
            hint="全件で効果が出るとは限らないため、控えめに見積もる係数。60%が標準。"
          >
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(inputs.timeSavedRatio * 100)}
              onChange={(e) => set("timeSavedRatio", Number(e.target.value) / 100)}
              style={{ width: "100%", accentColor: "#d9b26a" }}
            />
          </Field>

          <div className="pm-section-title">② ダウンタイム回避</div>
          <div className="pm-grid cols-2" style={{ gap: 8 }}>
            <Field label="年間の発生回数">
              <TextInput type="number" value={inputs.downtimeEventsPerYear} onChange={(e) => set("downtimeEventsPerYear", Number(e.target.value))} />
            </Field>
            <Field label="1回あたり損失(円)">
              <TextInput type="number" step={10000} value={inputs.downtimeCostPerEvent} onChange={(e) => set("downtimeCostPerEvent", Number(e.target.value))} />
            </Field>
          </div>

          <div className="pm-section-title">③ 部品受注の増加</div>
          <div className="pm-grid cols-2" style={{ gap: 8 }}>
            <Field label="年間の部品受注件数">
              <TextInput type="number" value={inputs.annualPartsOrders} onChange={(e) => set("annualPartsOrders", Number(e.target.value))} />
            </Field>
            <Field label="1件あたり粗利(円)">
              <TextInput type="number" step={1000} value={inputs.partsMarginPerOrder} onChange={(e) => set("partsMarginPerOrder", Number(e.target.value))} />
            </Field>
          </div>
          <Field
            label={`受注増加率 ${Math.round(inputs.partsUpliftRatio * 100)}%`}
            hint="手順書から部品コードを特定して発注へ直結させることで、誤発注が減り受注が増える分。"
          >
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(inputs.partsUpliftRatio * 100)}
              onChange={(e) => set("partsUpliftRatio", Number(e.target.value) / 100)}
              style={{ width: "100%", accentColor: "#d9b26a" }}
            />
          </Field>

          <div className="pm-section-title">④ OEM再販収益</div>
          {inputs.plan !== "premium" ? (
            <div className="pm-muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
              プレミアムOEMプランを選ぶと、自社ブランドで顧客に再販する収益を計算できます。
              <br />
              <button
                className="pm-btn sm"
                style={{ marginTop: 6 }}
                onClick={() => set("plan", "premium")}
              >
                プレミアムOEMで試算する
              </button>
            </div>
          ) : (
            <div className="pm-grid cols-2" style={{ gap: 8 }}>
              <Field label="提供先の顧客社数">
                <TextInput type="number" value={inputs.oemCustomers} onChange={(e) => set("oemCustomers", Number(e.target.value))} />
              </Field>
              <Field label="1社あたり月額(円)">
                <TextInput type="number" step={1000} value={inputs.oemMonthlyPerCustomer} onChange={(e) => set("oemMonthlyPerCustomer", Number(e.target.value))} />
              </Field>
            </div>
          )}

          <div className="pm-section-title">シナリオの保存</div>
          <Field label="シナリオ名">
            <TextInput
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="例）山陽精機工業（OEM込み）"
            />
          </Field>
          <Field label="紐づける商談">
            <Select value={linkedDeal} onChange={(e) => setLinkedDeal(e.target.value)}>
              <option value="">（紐づけない）</option>
              {state.deals.map((d) => (
                <option key={d.id} value={d.id}>{d.company}</option>
              ))}
            </Select>
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pm-btn primary" style={{ flex: 1, justifyContent: "center" }} onClick={saveScenario}>
              {activeScenario ? "上書き保存" : "保存"}
            </button>
            <button
              className="pm-btn"
              onClick={() => {
                setInputs(DEFAULT_ROI_INPUTS);
                setActiveScenario("");
                setScenarioName("");
                setLinkedDeal("");
              }}
            >
              リセット
            </button>
          </div>
        </Card>

        {/* ------------------------------------------------ 結果 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="◈ 効果の内訳（年間）">
            <BarList
              items={[
                { label: "① 人件費削減", value: result.annual.labor, color: "#4fc3d9" },
                { label: "② ダウンタイム回避", value: result.annual.downtime, color: "#d9b26a" },
                { label: "③ 部品受注の増加", value: result.annual.parts, color: "#8b9df0" },
                ...(inputs.plan === "premium"
                  ? [{ label: "④ OEM再販収益", value: result.annual.oem, color: "#5fcf9a" }]
                  : []),
              ]}
              formatValue={manYen}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid var(--pm-line)",
                fontWeight: 700,
              }}
            >
              <span>年間効果 合計</span>
              <span className="pm-gold-text pm-mono">{yen(result.annual.total)}</span>
            </div>
            <div className="pm-muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.8 }}>
              1件あたり <b className="pm-cyan-text">{result.minutesSavedPerCase}分</b> 短縮 ×
              月{inputs.monthlyCases}件 × 効果発現率{Math.round(inputs.timeSavedRatio * 100)}% →
              年間 <b className="pm-cyan-text">約{num(result.hoursFreedPerYear)}時間</b> のエンジニア工数が解放されます。
            </div>
          </Card>

          <Card title="▤ 36ヶ月の累積収支">
            <CashflowChart result={result} />
            <div className="pm-grid cols-3" style={{ marginTop: 14 }}>
              <div>
                <div className="pm-muted" style={{ fontSize: 11 }}>初期費用</div>
                <div className="pm-mono" style={{ fontSize: 15 }}>{yen(result.initialCost)}</div>
              </div>
              <div>
                <div className="pm-muted" style={{ fontSize: 11 }}>月額費用</div>
                <div className="pm-mono" style={{ fontSize: 15 }}>{yen(result.monthlyCost)}</div>
              </div>
              <div>
                <div className="pm-muted" style={{ fontSize: 11 }}>月次の純増</div>
                <div className="pm-mono pm-green-text" style={{ fontSize: 15 }}>
                  {yen(result.monthly.total - result.monthlyCost)}
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="◔ プラン比較"
            desc="同じ前提条件で3プランを比べます。OEM収益はプレミアムのみ加算されます。"
          >
            <div className="pm-table-wrap" style={{ border: "none" }}>
              <table className="pm-table" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>プラン</th>
                    <th className="num">初期</th>
                    <th className="num">月額</th>
                    <th className="num">年間効果</th>
                    <th className="num">年間純増</th>
                    <th className="num">回収</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((p) => {
                    const r = calcRoi({ ...inputs, plan: p.id });
                    const isCurrent = p.id === inputs.plan;
                    return (
                      <tr
                        key={p.id}
                        style={isCurrent ? { background: "rgba(217,178,106,0.08)" } : undefined}
                      >
                        <td className="pm-nowrap">
                          {isCurrent && <span className="pm-gold-text">▶ </span>}
                          {p.label}
                        </td>
                        <td className="num pm-nowrap">{manYen(p.initial)}</td>
                        <td className="num pm-nowrap">{manYen(p.monthly)}</td>
                        <td className="num pm-nowrap">{manYen(r.annual.total)}</td>
                        <td className="num pm-nowrap pm-green-text">{manYen(r.annual.net)}</td>
                        <td className="num pm-nowrap">
                          {r.paybackMonths === null ? "36+" : `${r.paybackMonths}ヶ月`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pm-muted" style={{ fontSize: 11.5, marginTop: 10 }}>
              {PLANS.find((p) => p.id === inputs.plan)!.note}
            </div>
          </Card>

          <Card
            title="▣ 提案書に貼れる要約"
            actions={
              <>
                <button
                  className="pm-btn sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(summary);
                    showToast("コピーしました");
                  }}
                >
                  コピー
                </button>
                <button
                  className="pm-btn sm"
                  onClick={() =>
                    download(`ROI試算_${customerName || "TOMARUN"}_${today()}.txt`, summary)
                  }
                >
                  テキスト出力
                </button>
              </>
            }
          >
            <pre
              className="pm-pre"
              style={{
                margin: 0,
                fontSize: 11.5,
                background: "var(--pm-bg-deep)",
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--pm-line)",
                fontFamily: "inherit",
              }}
            >
              {summary}
            </pre>
          </Card>
        </div>
      </div>

      <Card title="◫ 保存済みシナリオ" className="" >
        {state.roiScenarios.length === 0 && <div className="pm-empty">保存されたシナリオはありません。</div>}
        <div className="pm-grid cols-3">
          {state.roiScenarios.map((s) => {
            const r = calcRoi(s.inputs);
            const deal = state.deals.find((d) => d.id === s.dealId);
            return (
              <div
                key={s.id}
                className="pm-card"
                style={{
                  padding: 12,
                  cursor: "pointer",
                  borderColor: activeScenario === s.id ? "var(--pm-gold)" : undefined,
                }}
                onClick={() => loadScenario(s.id)}
              >
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{s.name}</div>
                <div className="pm-muted" style={{ fontSize: 10.5, marginBottom: 8 }}>
                  {PLANS.find((p) => p.id === s.inputs.plan)?.label}
                  {deal && ` ・ ${deal.company}`}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                  <span className="pm-muted">年間効果</span>
                  <span className="pm-gold-text pm-mono">{manYen(r.annual.total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                  <span className="pm-muted">回収期間</span>
                  <span className="pm-mono">
                    {r.paybackMonths === null ? "36ヶ月以上" : `${r.paybackMonths}ヶ月`}
                  </span>
                </div>
                {s.memo && (
                  <div className="pm-muted pm-clamp2" style={{ fontSize: 10.5, marginTop: 6 }}>
                    {s.memo}
                  </div>
                )}
                <button
                  className="pm-btn sm danger"
                  style={{ marginTop: 8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    void remove("roiScenarios", s.id);
                    if (activeScenario === s.id) setActiveScenario("");
                  }}
                >
                  削除
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/** 累積収支の折れ線（SVG） */
function CashflowChart({ result }: { result: ReturnType<typeof calcRoi> }) {
  const rows = result.rows;
  const W = 640;
  const H = 190;
  const PAD = { l: 8, r: 8, t: 12, b: 20 };

  const values = rows.map((r) => r.cumulative);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;

  const x = (i: number) => PAD.l + (i / (rows.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);

  const line = rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(r.cumulative).toFixed(1)}`).join(" ");
  const area = `${line} L${x(rows.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;
  const zeroY = y(0);
  const payback = result.paybackMonths;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9b26a" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#d9b26a" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* ゼロライン */}
      <line x1={PAD.l} y1={zeroY} x2={W - PAD.r} y2={zeroY} stroke="#6f8b9d" strokeDasharray="3 4" strokeWidth="1" />
      <text x={PAD.l + 2} y={zeroY - 5} fill="#6f8b9d" fontSize="9">
        損益分岐
      </text>

      <path d={area} fill="url(#roiFill)" />
      <path d={line} fill="none" stroke="#d9b26a" strokeWidth="2" strokeLinejoin="round" />

      {/* 回収時点 */}
      {payback !== null && (
        <>
          <line x1={x(payback)} y1={PAD.t} x2={x(payback)} y2={H - PAD.b} stroke="#5fcf9a" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx={x(payback)} cy={y(rows[payback].cumulative)} r="4" fill="#5fcf9a" />
          <text
            x={Math.min(x(payback) + 6, W - 90)}
            y={PAD.t + 12}
            fill="#5fcf9a"
            fontSize="10"
            fontWeight="700"
          >
            {payback}ヶ月で回収
          </text>
        </>
      )}

      {/* 目盛 */}
      {[0, 6, 12, 18, 24, 30, 36].map((m) => (
        <text key={m} x={x(m)} y={H - 5} fill="#6f8b9d" fontSize="9" textAnchor="middle">
          {m}ヶ月
        </text>
      ))}

      <text x={W - PAD.r} y={PAD.t + 10} fill="#f0d69c" fontSize="11" fontWeight="700" textAnchor="end">
        36ヶ月後 {manYen(rows[rows.length - 1].cumulative)}
      </text>
    </svg>
  );
}
