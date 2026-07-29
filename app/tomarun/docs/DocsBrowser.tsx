"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  IconAlert,
  IconChevronRight,
  IconOffline,
  IconSearch,
  IconStarFill,
} from "../components/icons";
import type { DocTopic } from "../lib/data";

const quickCodes = ["KWP809", "KWP810", "E-310", "KWP812"];

export default function DocsBrowser({ topics }: { topics: DocTopic[] }) {
  const [q, setQ] = useState("");

  const hits = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return null;
    return topics.filter((t) =>
      [t.title, t.summary, t.chapter, ...t.tags, ...t.errorCodes]
        .join(" ")
        .toLowerCase()
        .includes(key),
    );
  }, [q, topics]);

  const favorites = topics.filter((t) => t.favorite);
  const chapters = Array.from(new Set(topics.map((t) => t.chapter)));

  return (
    <div className="tm-pad">
      <div className="tm-search">
        <IconSearch />
        <input
          className="tm-search__input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="エラーコード・キーワードで検索"
          aria-label="資料を検索"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} aria-label="検索をクリア">
            ×
          </button>
        ) : null}
      </div>

      <div className="tm-chiprow" style={{ marginTop: 12 }}>
        {quickCodes.map((c) => (
          <button key={c} type="button" className="tm-chip tm-chip--sm" onClick={() => setQ(c)}>
            <IconAlert size={14} />
            {c}
          </button>
        ))}
      </div>

      {hits ? (
        <>
          <div className="tm-section-label">
            <span>検索結果</span>
            <span>{hits.length}件</span>
          </div>
          {hits.length === 0 ? (
            <div className="tm-empty">
              <IconSearch size={44} />
              <b>該当する項目がありません</b>
              <p>別のキーワードやエラーコードで試してください。</p>
            </div>
          ) : (
            <div className="tm-card">
              {hits.map((t) => (
                <TopicRow key={t.id} topic={t} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {favorites.length > 0 ? (
            <>
              <div className="tm-section-label">
                <span>お気に入り</span>
                <span>オフラインで読めます</span>
              </div>
              <div className="tm-card">
                {favorites.map((t) => (
                  <TopicRow key={t.id} topic={t} />
                ))}
              </div>
            </>
          ) : null}

          {chapters.map((ch) => (
            <div key={ch}>
              <div className="tm-section-label">
                <span>{ch}</span>
                <span>{topics.filter((t) => t.chapter === ch).length}件</span>
              </div>
              <div className="tm-card">
                {topics
                  .filter((t) => t.chapter === ch)
                  .map((t) => (
                    <TopicRow key={t.id} topic={t} />
                  ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function TopicRow({ topic }: { topic: DocTopic }) {
  return (
    <Link href={`/tomarun/docs/${topic.id}`} className="tm-row">
      <span className="tm-row__body">
        <b>
          {topic.favorite ? <IconStarFill size={15} className="tm-row__star" /> : null}
          {topic.title}
        </b>
        <span>{topic.summary}</span>
        {topic.errorCodes.length > 0 || topic.offline ? (
          <span className="tm-row__tags">
            {topic.errorCodes.map((c) => (
              <span key={c} className="tm-badge tm-badge--red">
                {c}
              </span>
            ))}
            {topic.offline ? (
              <span className="tm-badge tm-badge--green">
                <IconOffline size={12} />
                保存済み
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <IconChevronRight className="tm-row__chev" />
    </Link>
  );
}
