"use client";

// マーケ施策・コンテンツカレンダー

import { useMemo, useState } from "react";
import {
  BarList,
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
import { diffDays, manYen, parseDate, shortDate, today } from "../_lib/format";
import { CHANNELS, type Campaign, type Channel, type ContentItem } from "@/lib/pm/types";

const CAMPAIGN_STATUS: { id: Campaign["status"]; label: string; color: string }[] = [
  { id: "planning", label: "企画中", color: "#6f8b9d" },
  { id: "running", label: "実行中", color: "#4fc3d9" },
  { id: "paused", label: "一時停止", color: "#e8a15a" },
  { id: "done", label: "終了", color: "#5fcf9a" },
];

const CONTENT_STATUS: { id: ContentItem["status"]; label: string; color: string }[] = [
  { id: "idea", label: "ネタ出し", color: "#6f8b9d" },
  { id: "writing", label: "執筆中", color: "#4fc3d9" },
  { id: "review", label: "レビュー", color: "#8b9df0" },
  { id: "scheduled", label: "公開予約", color: "#d9b26a" },
  { id: "published", label: "公開済", color: "#5fcf9a" },
];

const EMPTY_CAMPAIGN: Omit<Campaign, "id"> = {
  name: "",
  channel: "web",
  goal: "",
  kpiName: "",
  kpiTarget: 0,
  kpiActual: 0,
  budget: 0,
  spent: 0,
  start: today(),
  end: today(),
  status: "planning",
  owner: "ワタル",
  learning: "",
};

const EMPTY_CONTENT: Omit<ContentItem, "id"> = {
  title: "",
  channel: "seo",
  format: "記事",
  publishDate: today(),
  status: "idea",
  owner: "ワタル",
  keyword: "",
  url: "",
};

export default function MarketingPage() {
  const { state, create, update, remove } = usePm();
  const [tab, setTab] = useState<"campaigns" | "calendar">("campaigns");
  const [campaignDraft, setCampaignDraft] = useState<Omit<Campaign, "id"> | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [contentDraft, setContentDraft] = useState<Omit<ContentItem, "id"> | null>(null);

  if (!state) return null;

  const budget = state.campaigns.reduce((s, c) => s + c.budget, 0);
  const spent = state.campaigns.reduce((s, c) => s + c.spent, 0);
  const running = state.campaigns.filter((c) => c.status === "running");

  const channelSpend = CHANNELS.map((ch) => ({
    label: ch.label,
    value: state.campaigns.filter((c) => c.channel === ch.id).reduce((s, c) => s + c.budget, 0),
  })).filter((x) => x.value > 0);

  const saveCampaign = async () => {
    if (!campaignDraft || !campaignDraft.name.trim()) return;
    if (editingCampaign) await update("campaigns", editingCampaign.id, { ...campaignDraft });
    else await create("campaigns", { ...campaignDraft });
    setCampaignDraft(null);
    setEditingCampaign(null);
  };

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat label="年間マーケ予算" tone="gold" value={manYen(budget)} sub={`消化 ${manYen(spent)}（${budget ? Math.round((spent / budget) * 100) : 0}%）`} />
        <Stat label="実行中の施策" tone="cyan" value={running.length} unit="件" sub={`全 ${state.campaigns.length}件`} />
        <Stat
          label="コンテンツ"
          value={state.contents.length}
          unit="本"
          sub={`公開済 ${state.contents.filter((c) => c.status === "published").length}本`}
        />
        <Stat
          label="今月公開予定"
          value={
            state.contents.filter(
              (c) => c.publishDate.slice(0, 7) === today().slice(0, 7) && c.status !== "published",
            ).length
          }
          unit="本"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Tabs
          tabs={[
            { id: "campaigns" as const, label: "施策一覧", count: state.campaigns.length },
            { id: "calendar" as const, label: "コンテンツカレンダー", count: state.contents.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "campaigns" && (
        <>
          <div className="pm-toolbar">
            <div className="pm-spacer" />
            <button
              className="pm-btn primary"
              onClick={() => { setCampaignDraft({ ...EMPTY_CAMPAIGN }); setEditingCampaign(null); }}
            >
              ＋ 施策を追加
            </button>
          </div>

          <div className="pm-grid cols-2">
            {state.campaigns.map((c) => {
              const st = CAMPAIGN_STATUS.find((s) => s.id === c.status)!;
              const ch = CHANNELS.find((x) => x.id === c.channel)!;
              const kpiPct = c.kpiTarget ? (c.kpiActual / c.kpiTarget) * 100 : 0;
              return (
                <div
                  key={c.id}
                  className="pm-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => { setEditingCampaign(c); setCampaignDraft({ ...c }); }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</div>
                      <div className="pm-muted" style={{ fontSize: 10.5 }}>
                        {ch.label} ・ {shortDate(c.start)}〜{shortDate(c.end)}
                      </div>
                    </div>
                    <span className="pm-badge" style={{ background: `${st.color}22`, color: st.color }}>
                      {st.label}
                    </span>
                  </div>

                  {c.goal && (
                    <div className="pm-dim" style={{ fontSize: 11.5, marginBottom: 10 }}>{c.goal}</div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                    <span className="pm-muted">{c.kpiName || "KPI"}</span>
                    <span className="pm-mono">
                      {c.kpiActual} / {c.kpiTarget}
                      <span className={kpiPct >= 100 ? "pm-green-text" : "pm-muted"}>
                        {" "}({Math.round(kpiPct)}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={kpiPct} />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, margin: "10px 0 4px" }}>
                    <span className="pm-muted">予算消化</span>
                    <span className="pm-mono">{manYen(c.spent)} / {manYen(c.budget)}</span>
                  </div>
                  <Progress value={c.budget ? (c.spent / c.budget) * 100 : 0} color="#e8a15a" />

                  {c.learning && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 9,
                        borderRadius: 8,
                        background: "rgba(79,195,217,0.08)",
                        fontSize: 11,
                        lineHeight: 1.75,
                      }}
                    >
                      <span className="pm-cyan-text">学び：</span>
                      {c.learning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Card title="◑ チャネル別の予算配分" className="">
            <BarList items={channelSpend} formatValue={manYen} />
          </Card>
        </>
      )}

      {tab === "calendar" && (
        <ContentCalendar
          contents={state.contents}
          onAdd={() => setContentDraft({ ...EMPTY_CONTENT })}
          onUpdate={(id, patch) => update("contents", id, patch)}
          onRemove={(id) => remove("contents", id)}
        />
      )}

      {/* 施策モーダル */}
      {campaignDraft && (
        <Modal
          wide
          title={editingCampaign ? "施策を編集" : "施策を追加"}
          onClose={() => { setCampaignDraft(null); setEditingCampaign(null); }}
          footer={
            <>
              {editingCampaign && (
                <ConfirmButton
                  className="pm-btn danger"
                  onConfirm={async () => {
                    await remove("campaigns", editingCampaign.id);
                    setCampaignDraft(null);
                    setEditingCampaign(null);
                  }}
                />
              )}
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => { setCampaignDraft(null); setEditingCampaign(null); }}>
                キャンセル
              </button>
              <button className="pm-btn primary" onClick={saveCampaign}>保存</button>
            </>
          }
        >
          <Field label="施策名">
            <TextInput
              value={campaignDraft.name}
              onChange={(e) => setCampaignDraft({ ...campaignDraft, name: e.target.value })}
              autoFocus
            />
          </Field>
          <div className="pm-grid cols-3">
            <Field label="チャネル">
              <Select
                value={campaignDraft.channel}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, channel: e.target.value as Channel })}
              >
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="ステータス">
              <Select
                value={campaignDraft.status}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, status: e.target.value as Campaign["status"] })}
              >
                {CAMPAIGN_STATUS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="担当">
              <TextInput
                value={campaignDraft.owner}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, owner: e.target.value })}
              />
            </Field>
          </div>
          <Field label="目的" hint="この施策で何を達成したいのかを一文で。">
            <TextInput
              value={campaignDraft.goal}
              onChange={(e) => setCampaignDraft({ ...campaignDraft, goal: e.target.value })}
            />
          </Field>
          <div className="pm-grid cols-3">
            <Field label="KPI名">
              <TextInput
                value={campaignDraft.kpiName}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, kpiName: e.target.value })}
                placeholder="例）獲得リード数"
              />
            </Field>
            <Field label="目標値">
              <TextInput
                type="number"
                value={campaignDraft.kpiTarget}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, kpiTarget: Number(e.target.value) })}
              />
            </Field>
            <Field label="実績値">
              <TextInput
                type="number"
                value={campaignDraft.kpiActual}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, kpiActual: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="pm-grid cols-4">
            <Field label="予算(円)">
              <TextInput
                type="number"
                step={10000}
                value={campaignDraft.budget}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, budget: Number(e.target.value) })}
              />
            </Field>
            <Field label="消化額(円)">
              <TextInput
                type="number"
                step={10000}
                value={campaignDraft.spent}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, spent: Number(e.target.value) })}
              />
            </Field>
            <Field label="開始日">
              <TextInput
                type="date"
                value={campaignDraft.start}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, start: e.target.value })}
              />
            </Field>
            <Field label="終了日">
              <TextInput
                type="date"
                value={campaignDraft.end}
                onChange={(e) => setCampaignDraft({ ...campaignDraft, end: e.target.value })}
              />
            </Field>
          </div>
          <Field label="学び・振り返り" hint="うまくいった／いかなかった理由を残すと、次の施策の精度が上がります。">
            <TextArea
              value={campaignDraft.learning}
              onChange={(e) => setCampaignDraft({ ...campaignDraft, learning: e.target.value })}
            />
          </Field>
        </Modal>
      )}

      {/* コンテンツモーダル */}
      {contentDraft && (
        <Modal
          title="コンテンツを追加"
          onClose={() => setContentDraft(null)}
          footer={
            <>
              <div className="pm-spacer" />
              <button className="pm-btn" onClick={() => setContentDraft(null)}>キャンセル</button>
              <button
                className="pm-btn primary"
                onClick={async () => {
                  if (!contentDraft.title.trim()) return;
                  await create("contents", { ...contentDraft });
                  setContentDraft(null);
                }}
              >
                保存
              </button>
            </>
          }
        >
          <Field label="タイトル">
            <TextInput
              value={contentDraft.title}
              onChange={(e) => setContentDraft({ ...contentDraft, title: e.target.value })}
              autoFocus
            />
          </Field>
          <div className="pm-grid cols-3">
            <Field label="チャネル">
              <Select
                value={contentDraft.channel}
                onChange={(e) => setContentDraft({ ...contentDraft, channel: e.target.value as Channel })}
              >
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="形式">
              <TextInput
                value={contentDraft.format}
                onChange={(e) => setContentDraft({ ...contentDraft, format: e.target.value })}
                placeholder="記事 / 動画 / ホワイトペーパー"
              />
            </Field>
            <Field label="公開予定日">
              <TextInput
                type="date"
                value={contentDraft.publishDate}
                onChange={(e) => setContentDraft({ ...contentDraft, publishDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="pm-grid cols-2">
            <Field label="狙うキーワード">
              <TextInput
                value={contentDraft.keyword}
                onChange={(e) => setContentDraft({ ...contentDraft, keyword: e.target.value })}
                placeholder="例）技能継承 製造業"
              />
            </Field>
            <Field label="担当">
              <TextInput
                value={contentDraft.owner}
                onChange={(e) => setContentDraft({ ...contentDraft, owner: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}

/** 月ごとにまとめたコンテンツカレンダー */
function ContentCalendar({
  contents,
  onAdd,
  onUpdate,
  onRemove,
}: {
  contents: ContentItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<ContentItem>) => void;
  onRemove: (id: string) => void;
}) {
  const months = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const c of [...contents].sort((a, b) => a.publishDate.localeCompare(b.publishDate))) {
      const key = c.publishDate.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return Array.from(map.entries());
  }, [contents]);

  return (
    <>
      <div className="pm-toolbar">
        <div className="pm-muted" style={{ fontSize: 11.5, flex: 1 }}>
          記事・ホワイトペーパー・プレスリリースの公開予定。月4本を目安に、
          「技能継承」「予知保全」など検索されるキーワードを軸に組み立てます。
        </div>
        <button className="pm-btn primary" onClick={onAdd}>＋ コンテンツを追加</button>
      </div>

      {months.length === 0 && <div className="pm-empty">コンテンツがまだありません。</div>}

      {months.map(([month, items]) => {
        const d = parseDate(`${month}-01`);
        const isCurrent = month === today().slice(0, 7);
        return (
          <div key={month} style={{ marginBottom: 20 }}>
            <div className="pm-section-title" style={{ marginTop: 0 }}>
              {d.getFullYear()}年{d.getMonth() + 1}月
              {isCurrent && <span className="pm-gold-text" style={{ fontSize: 10.5 }}>今月</span>}
              <span className="pm-muted" style={{ fontSize: 10.5 }}>{items.length}本</span>
            </div>
            <div className="pm-grid cols-3">
              {items.map((c) => {
                const st = CONTENT_STATUS.find((s) => s.id === c.status)!;
                const ch = CHANNELS.find((x) => x.id === c.channel)!;
                const late = c.status !== "published" && diffDays(today(), c.publishDate) < 0;
                return (
                  <div key={c.id} className="pm-card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 7 }}>
                      <span className="pm-badge" style={{ background: `${st.color}22`, color: st.color }}>
                        {st.label}
                      </span>
                      <span className="pm-muted" style={{ fontSize: 10.5 }}>{c.format}</span>
                      <div className="pm-spacer" />
                      <span className={late ? "pm-red-text" : "pm-muted"} style={{ fontSize: 10.5 }}>
                        {shortDate(c.publishDate)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 8 }}>{c.title}</div>
                    {c.keyword && (
                      <div className="pm-muted" style={{ fontSize: 10.5, marginBottom: 8 }}>
                        🔍 {c.keyword}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <select
                        className="pm-select"
                        style={{ padding: "3px 22px 3px 6px", fontSize: 11, flex: 1 }}
                        value={c.status}
                        onChange={(e) => onUpdate(c.id, { status: e.target.value as ContentItem["status"] })}
                      >
                        {CONTENT_STATUS.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      <span className="pm-muted" style={{ fontSize: 10.5 }}>{ch.label}</span>
                      <ConfirmButton label="✕" onConfirm={() => onRemove(c.id)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
