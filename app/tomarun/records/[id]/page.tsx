import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "../../components/AppBar";
import {
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconGauge,
  IconPdf,
  IconShare,
  IconSparkle,
  IconUser,
  IconWrench,
} from "../../components/icons";
import { findRecord, records } from "../../lib/data";

export function generateStaticParams() {
  return records.map((r) => ({ id: r.id }));
}

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = findRecord(id);
  if (!record) notFound();

  return (
    <>
      <AppBar title={`#${record.id}`} subtitle={record.kind} backHref="/tomarun/records" />

      <div className="tm-scroll">
        <div className="tm-pad">
          <div className="tm-recdetail__head">
            <span
              className={`tm-badge ${
                record.status === "draft" ? "tm-badge--amber" : "tm-badge--green"
              }`}
            >
              {record.status === "draft" ? "未完了" : record.status === "shared" ? "メーカー共有済み" : "完了"}
            </span>
            <h1>{record.title || "（本文未入力）"}</h1>
          </div>

          {record.fromTree ? (
            <div className="tm-notice tm-notice--info">
              <IconWrench size={20} />
              <div>
                <b>トラブルシューティングから起票</b>
                {record.fromTree}
              </div>
            </div>
          ) : null}

          <dl className="tm-kv" style={{ marginTop: 16 }}>
            <div>
              <dt>対象設備</dt>
              <dd>{record.machineName}</dd>
            </div>
            <div>
              <dt>発生日時</dt>
              <dd>
                <IconClock size={15} />
                {record.occurredAt}
              </dd>
            </div>
            {record.restoredAt ? (
              <div>
                <dt>復旧日時</dt>
                <dd>
                  <IconCheck size={15} />
                  {record.restoredAt}
                </dd>
              </div>
            ) : null}
            {record.downtimeMin ? (
              <div>
                <dt>停止時間</dt>
                <dd>{record.downtimeMin}分</dd>
              </div>
            ) : null}
            <div>
              <dt>担当者</dt>
              <dd>
                <IconUser size={15} />
                {record.assignee}
              </dd>
            </div>
            <div>
              <dt>アワーメーター</dt>
              <dd>
                <IconGauge size={15} />
                {record.hourMeter.toLocaleString()} h
              </dd>
            </div>
            <div>
              <dt>分類</dt>
              <dd>
                {record.genre}・{record.cause}
              </dd>
            </div>
          </dl>

          <div className="tm-section-label">
            <span>対応内容</span>
            {record.checklist ? (
              <span className="tm-badge tm-badge--blue">
                <IconSparkle size={13} />
                自動生成
              </span>
            ) : null}
          </div>

          <div className="tm-card tm-pad">
            {record.checklist ? (
              <ul className="tm-draft__checks">
                {record.checklist.map((c) => (
                  <li key={c}>
                    <IconCheck size={16} />
                    {c}
                  </li>
                ))}
              </ul>
            ) : null}
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.9 }}>
              {record.body || "本文は未入力です。写真のみ仮保存されています。"}
            </p>
          </div>

          {record.photos > 0 ? (
            <>
              <div className="tm-section-label">
                <span>写真</span>
                <span>{record.photos}件</span>
              </div>
              <div className="tm-photos">
                {Array.from({ length: record.photos }).map((_, i) => (
                  <div key={i} className="tm-photos__item tm-photos__item--view">
                    <IconCamera size={20} />
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className="tm-section-label">
            <span>出力・共有</span>
          </div>

          <div className="tm-card">
            <button type="button" className="tm-row">
              <span className="tm-row__icon">
                <IconPdf size={20} />
              </span>
              <span className="tm-row__body">
                <b>PDF報告書を作成</b>
                <span>アプリ内で完結。写真つきで出力されます</span>
              </span>
              <IconChevronRight className="tm-row__chev" />
            </button>
            <button type="button" className="tm-row">
              <span className="tm-row__icon">
                <IconShare size={20} />
              </span>
              <span className="tm-row__body">
                <b>メーカーに共有</b>
                <span>原因追究の依頼として送信します</span>
              </span>
              <IconChevronRight className="tm-row__chev" />
            </button>
          </div>

          {record.status === "draft" ? (
            <Link href="/tomarun/records/new" className="tm-btn tm-btn--primary" style={{ marginTop: 16 }}>
              続きを書く
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}
