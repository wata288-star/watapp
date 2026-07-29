"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AppBar from "../../components/AppBar";
import {
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconGauge,
  IconMic,
  IconQr,
  IconSparkle,
  IconUser,
} from "../../components/icons";
import { causeChips, kindChips, machines, phraseChips } from "../../lib/data";

/**
 * 対応記録の起票。
 * 仕様どおり 5ステップのウィザードをやめ、1画面に集約している。
 * 人が入力する項目を減らすため、日時・担当者・アワーメーターは自動入力し、
 * 基本操作はタップ（チップ・写真）のみで完結させる。文字入力は任意。
 */
export default function RecordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const fromTree = params.get("tree");
  const machineParam = params.get("machine");

  const [machineId, setMachineId] = useState(machineParam ?? "mr100");
  const [cause, setCause] = useState<string>(fromTree ? "破損" : "");
  const [phrases, setPhrases] = useState<string[]>([]);
  const [body, setBody] = useState(
    fromTree
      ? "エラーコード KWP809/810 の検出を確認した上で、DPF差圧センサーを交換。交換後、診断機でサービスルーチンを実行し、正常完了することを確認した。"
      : "",
  );
  const [photos, setPhotos] = useState<number>(fromTree ? 0 : 0);
  const [hourMeterFixed, setHourMeterFixed] = useState(false);
  const [detail, setDetail] = useState(false);
  const [kind, setKind] = useState("トラブル対応");
  const [aiDone, setAiDone] = useState(Boolean(fromTree));

  const machine = machines.find((m) => m.id === machineId) ?? machines[0];
  const ready = photos > 0 || body.trim().length > 0 || phrases.length > 0;

  function togglePhrase(p: string) {
    setPhrases((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function runAi() {
    const source = [body, ...phrases].filter(Boolean).join("。");
    setBody(
      source
        ? `${source.replace(/。+$/, "")}。以上の対応により復旧を確認した。`
        : "写真の内容から、対象部位に異常を確認。清掃・調整を実施し、試運転で正常動作を確認した。",
    );
    setCause((c) => c || "摩耗");
    setAiDone(true);
  }

  return (
    <>
      <AppBar
        title="記録する"
        subtitle={fromTree ? "トラブルシューティングから起票" : "30秒で終わります"}
        action={
          <button type="button" className="tm-appbar__action" onClick={() => router.push("/tomarun/records?saved=1")}>
            保存
          </button>
        }
      />

      <div className="tm-scroll">
        <div className="tm-pad">
          {fromTree ? (
            <div className="tm-notice tm-notice--info" style={{ marginBottom: 16 }}>
              <IconSparkle size={20} />
              <div>
                <b>下書きが入っています</b>
                ツリーで確認した項目と処置が本文に自動で入りました。内容を確認して保存してください。
              </div>
            </div>
          ) : null}

          {/* ---- 自動入力ずみの基本情報。タップで確定するだけにする ---- */}
          <div className="tm-card tm-auto">
            <div className="tm-auto__row">
              <span className="tm-auto__label">対象設備</span>
              <select
                className="tm-auto__select"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                aria-label="対象設備"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}（{m.serial}）
                  </option>
                ))}
              </select>
              <button type="button" className="tm-auto__qr" aria-label="QRコードで特定">
                <IconQr size={20} />
              </button>
            </div>

            <div className="tm-auto__row">
              <span className="tm-auto__label">発生日時</span>
              <span className="tm-auto__value">
                <IconClock size={16} />
                2026/07/29 15:26
              </span>
              <span className="tm-badge tm-badge--gray">自動</span>
            </div>

            <div className="tm-auto__row">
              <span className="tm-auto__label">担当者</span>
              <span className="tm-auto__value">
                <IconUser size={16} />
                徳田 菜摘
              </span>
              <span className="tm-badge tm-badge--gray">自動</span>
            </div>

            <div className="tm-auto__row">
              <span className="tm-auto__label">アワーメーター</span>
              <span className="tm-auto__value">
                <IconGauge size={16} />
                {machine.name === "MR100" ? "1,412" : "―"} h
                <em>推定</em>
              </span>
              <button
                type="button"
                className={hourMeterFixed ? "tm-auto__fix tm-auto__fix--on" : "tm-auto__fix"}
                onClick={() => setHourMeterFixed(true)}
                aria-label="推定のアワーメーター値をそのまま確定する"
              >
                {hourMeterFixed ? <IconCheck size={16} /> : null}
                {hourMeterFixed ? "確定済み" : "確定"}
              </button>
            </div>
          </div>

          {/* ---- 写真。現場では最初にこれを押す ---- */}
          <div className="tm-section-label">
            <span>1. 写真を撮る</span>
            <span>任意</span>
          </div>

          <div className="tm-photos">
            <button type="button" className="tm-photos__add" onClick={() => setPhotos((n) => n + 1)}>
              <IconCamera size={26} />
              カメラ／画像
            </button>
            {Array.from({ length: photos }).map((_, i) => (
              <div key={i} className="tm-photos__item">
                <IconCamera size={20} />
                <button type="button" onClick={() => setPhotos((n) => n - 1)} aria-label="写真を削除">
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* ---- 原因分類チップ ---- */}
          <div className="tm-section-label">
            <span>2. 原因分類をタップ</span>
            {aiDone ? (
              <span className="tm-badge tm-badge--blue">
                <IconSparkle size={13} />
                AIが推定
              </span>
            ) : null}
          </div>

          <div className="tm-chips">
            {causeChips.map((c) => (
              <button
                key={c}
                type="button"
                className="tm-chip"
                data-on={c === cause}
                onClick={() => setCause(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* ---- 定型文チップ ---- */}
          <div className="tm-section-label">
            <span>3. 起きたこと・やったことをタップ</span>
            <span>複数選択可</span>
          </div>

          <div className="tm-chips">
            {phraseChips.map((p) => (
              <button
                key={p}
                type="button"
                className="tm-chip"
                data-on={phrases.includes(p)}
                onClick={() => togglePhrase(p)}
              >
                {phrases.includes(p) ? <IconCheck size={16} /> : null}
                {p}
              </button>
            ))}
          </div>

          {/* ---- 本文（任意） ---- */}
          <div className="tm-section-label">
            <span>対応内容</span>
            <span>文字入力は任意</span>
          </div>

          <textarea
            className="tm-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="タップした内容からAIが下書きします。必要なときだけ直接入力してください。"
          />

          <div className="tm-aiabar">
            <button type="button" className="tm-btn tm-btn--ghost tm-btn--sm" onClick={runAi}>
              <IconSparkle size={18} />
              AIで下書き・整形する
            </button>
            <button type="button" className="tm-btn tm-btn--secondary tm-btn--sm tm-aiabar__mic">
              <IconMic size={18} />
              音声で入力
            </button>
          </div>
          <p className="tm-field__hint">
            音声入力は補助機能です。騒音や手袋を想定し、タップのみで完結できます。
          </p>

          {/* ---- 詳細（折りたたみ） ---- */}
          <button
            type="button"
            className="tm-disclosure"
            onClick={() => setDetail((v) => !v)}
            aria-expanded={detail}
          >
            詳しく書く（記録種別・エラーコード・復旧日時）
            <IconChevronDown
              size={18}
              className={detail ? "tm-trail__caret tm-trail__caret--open" : "tm-trail__caret"}
            />
          </button>

          {detail ? (
            <div className="tm-card tm-detailbox tm-anim">
              <label className="tm-field">
                <span className="tm-field__label">記録種別</span>
                <div className="tm-chips">
                  {kindChips.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className="tm-chip tm-chip--sm"
                      data-on={k === kind}
                      onClick={() => setKind(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </label>

              <label className="tm-field">
                <span className="tm-field__label">エラーコード</span>
                <input className="tm-input" defaultValue={fromTree ? "KWP809 / KWP810" : ""} placeholder="例: E-310" />
              </label>

              <label className="tm-field">
                <span className="tm-field__label">復旧日時</span>
                <input className="tm-input" defaultValue="2026/07/29 16:12" />
                <span className="tm-field__hint">
                  発生〜復旧の時間は効果報告レポートの集計に使われます。
                </span>
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="tm-sticky-actions">
        <button
          type="button"
          className="tm-btn tm-btn--secondary"
          onClick={() => router.push("/tomarun/records?saved=1")}
        >
          仮保存
        </button>
        <button
          type="button"
          className="tm-btn tm-btn--primary"
          disabled={!ready}
          onClick={() => router.push("/tomarun/records?saved=1")}
        >
          保存する
        </button>
      </div>
    </>
  );
}
