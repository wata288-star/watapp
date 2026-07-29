"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppBar from "../../../components/AppBar";
import {
  IconAlert,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconPlay,
  IconRecord,
  IconSparkle,
} from "../../../components/icons";
import type { Machine, Tree } from "../../../lib/data";

type Answer = { nodeId: string; question: string; label: string };

export default function TreeRunner({
  machine,
  tree,
  videoTitle,
  topicTitle,
}: {
  machine: Machine;
  tree: Tree;
  videoTitle?: string;
  topicTitle?: string;
}) {
  const router = useRouter();
  const startedAt = useRef<number | null>(null);
  const [cursor, setCursor] = useState<string>(tree.rootId);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [trailOpen, setTrailOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const node = tree.nodes[cursor];
  const result = tree.results[cursor];
  const step = answers.length + 1;

  // 開始→解決までを自動計測し、対応記録の所要時間に自動で入れる
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!result || startedAt.current === null) return;
    setElapsed(Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)));
  }, [result]);

  function choose(label: string, next: string) {
    if (!node) return;
    setAnswers((prev) => [...prev, { nodeId: node.id, question: node.question, label }]);
    setCursor(next);
  }

  function rewindTo(index: number) {
    const target = answers[index];
    setAnswers((prev) => prev.slice(0, index));
    setCursor(target.nodeId);
    setTrailOpen(false);
  }

  function back() {
    if (answers.length === 0) {
      router.back();
      return;
    }
    rewindTo(answers.length - 1);
  }

  /* ---------------------------------------------------------------- 質問中 */

  if (node) {
    return (
      <>
        <AppBar title="トラブルシュート" subtitle={`${machine.name}・${tree.version}`} />

        <div className="tm-stepbar">
          <div className="tm-progress">
            {Array.from({ length: tree.depth }).map((_, i) => (
              <span key={i} className="tm-progress__seg" data-on={i <= answers.length} />
            ))}
          </div>
          <div className="tm-stepbar__meta">
            <b>
              STEP {step} / {tree.depth}
            </b>
            <span>{tree.title}</span>
          </div>
        </div>

        <div className="tm-scroll">
          <div className="tm-pad tm-anim" key={node.id}>
            <h1 className="tm-question">{node.question}</h1>
            {node.hint ? <p className="tm-question__hint">{node.hint}</p> : null}

            <div className="tm-stack tm-answers">
              {node.choices.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  className="tm-answer"
                  onClick={() => choose(c.label, c.next)}
                >
                  <span className="tm-answer__dot" />
                  <span className="tm-answer__label">{c.label}</span>
                  <IconChevronRight className="tm-row__chev" />
                </button>
              ))}
            </div>

            {answers.length > 0 ? (
              <div className="tm-trail">
                <button
                  type="button"
                  className="tm-trail__toggle"
                  onClick={() => setTrailOpen((v) => !v)}
                  aria-expanded={trailOpen}
                >
                  <IconCheck size={18} />
                  これまでの回答 {answers.length}件
                  <IconChevronDown
                    size={18}
                    className={trailOpen ? "tm-trail__caret tm-trail__caret--open" : "tm-trail__caret"}
                  />
                </button>

                {trailOpen ? (
                  <ol className="tm-trail__list">
                    {answers.map((a, i) => (
                      <li key={a.nodeId}>
                        <span className="tm-trail__q">{a.question}</span>
                        <button type="button" className="tm-trail__a" onClick={() => rewindTo(i)}>
                          <b>{a.label}</b>
                          <span>選び直す</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="tm-sticky-actions">
          <button type="button" className="tm-btn tm-btn--secondary" onClick={back}>
            戻る
          </button>
          <Link href="/tomarun" className="tm-btn tm-btn--ghost">
            中断して保存
          </Link>
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------------- 結果 */

  if (!result) return null;

  return (
    <>
      <AppBar title="推奨される処置" subtitle={`${machine.name}・所要 ${elapsed}分`} />

      <div className="tm-scroll">
        <div className="tm-pad tm-anim">
          <div className="tm-result">
            <span className="tm-badge tm-badge--blue">考えられる原因</span>
            <h1>{result.cause}</h1>
          </div>

          <div className="tm-card tm-action">
            <div className="tm-action__head">
              <IconAlert size={18} />
              推奨される処置
            </div>
            <p>{result.action}</p>
          </div>

          {result.videoId ? (
            <Link href={`/tomarun/videos/${machine.id}/${result.videoId}`} className="tm-videocard">
              <div className="tm-videocard__thumb">
                <span className="tm-videocard__play">
                  <IconPlay size={26} />
                </span>
                <span className="tm-badge tm-badge--gray tm-videocard__len">4:32</span>
              </div>
              <div className="tm-videocard__body">
                <b>{videoTitle ?? "この処置の動画マニュアル"}</b>
                <span>タップで再生・チャプターから手順へジャンプ</span>
              </div>
            </Link>
          ) : null}

          <div className="tm-stack tm-stack--sm tm-links">
            {result.relatedRecordId ? (
              <Link href={`/tomarun/records/${result.relatedRecordId}`} className="tm-linkrow">
                <IconRecord size={18} />
                過去の対応記録を見る（#{result.relatedRecordId}）
                <IconChevronRight className="tm-row__chev" />
              </Link>
            ) : null}
            {result.docTopicId ? (
              <Link href={`/tomarun/docs/${result.docTopicId}`} className="tm-linkrow">
                <IconAlert size={18} />
                {topicTitle ?? "関連する資料"}を開く
                <IconChevronRight className="tm-row__chev" />
              </Link>
            ) : null}
          </div>

          <div className="tm-trail tm-trail--static">
            <div className="tm-trail__toggle" aria-hidden>
              <IconCheck size={18} />
              確認した項目 {answers.length}件
            </div>
            <ol className="tm-trail__list">
              {answers.map((a) => (
                <li key={a.nodeId}>
                  <span className="tm-trail__q">{a.question}</span>
                  <div className="tm-trail__a tm-trail__a--static">
                    <b>{a.label}</b>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="tm-sticky-actions">
        <button type="button" className="tm-btn tm-btn--primary" onClick={() => setSheet(true)}>
          <IconCheck size={20} />
          解決した
        </button>
        <Link href={`/tomarun/records/new?tree=${tree.id}&machine=${machine.id}`} className="tm-btn tm-btn--secondary">
          解決しない → 記録起票
        </Link>
      </div>

      {sheet ? (
        <DraftSheet
          machine={machine}
          tree={tree}
          answers={answers}
          draft={result.draft}
          elapsed={elapsed}
          onClose={() => setSheet(false)}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------------ */

function DraftSheet({
  machine,
  tree,
  answers,
  draft,
  elapsed,
  onClose,
}: {
  machine: Machine;
  tree: Tree;
  answers: Answer[];
  draft: string;
  elapsed: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <div className="tm-sheet" role="dialog" aria-modal="true" aria-label="対応記録の下書き">
      <button type="button" className="tm-sheet__scrim" aria-label="閉じる" onClick={onClose} />
      <div className="tm-sheet__panel tm-anim">
        <div className="tm-sheet__grip" aria-hidden />
        <div className="tm-sheet__head">
          <span className="tm-badge tm-badge--green">
            <IconSparkle size={14} />
            下書きが自動で完成しました
          </span>
          <h2>内容を確認して保存するだけです</h2>
        </div>

        <div className="tm-sheet__scroll">
          <dl className="tm-kv">
            <div>
              <dt>対象設備</dt>
              <dd>
                {machine.name}（{machine.serial}）
              </dd>
            </div>
            <div>
              <dt>エラーコード</dt>
              <dd>{tree.errorCodes.join(" / ") || "―"}</dd>
            </div>
            <div>
              <dt>所要時間</dt>
              <dd>
                <IconClock size={15} /> {elapsed}分（開始→解決を自動計測）
              </dd>
            </div>
            <div>
              <dt>担当者</dt>
              <dd>徳田 菜摘（ログイン情報から自動）</dd>
            </div>
          </dl>

          <div className="tm-draft">
            <ul className="tm-draft__checks">
              {answers.map((a) => (
                <li key={a.nodeId}>
                  <IconCheck size={16} />
                  {a.label}
                </li>
              ))}
            </ul>
            <p>上記を確認した上で、{draft}</p>
          </div>

          <p className="tm-field__hint">
            ツリーで通った確認項目がチェックリストとして入り、その下に処置の文章が続きます。
            修正が必要な場合は保存後に編集できます。
          </p>
        </div>

        <div className="tm-sheet__actions">
          <button type="button" className="tm-btn tm-btn--secondary" onClick={onClose}>
            戻る
          </button>
          <button
            type="button"
            className="tm-btn tm-btn--primary"
            disabled={saving}
            onClick={() => {
              setSaving(true);
              router.push("/tomarun/records?saved=1");
            }}
          >
            {saving ? "保存中…" : "この内容で保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
