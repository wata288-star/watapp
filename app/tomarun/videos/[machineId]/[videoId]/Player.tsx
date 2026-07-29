"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconOffline,
  IconPlay,
  IconRecord,
  IconShare,
} from "../../../components/icons";
import type { Video } from "../../../lib/data";

export default function Player({ video, machineName }: { video: Video; machineName: string }) {
  const [active, setActive] = useState(0);
  const [saved, setSaved] = useState(video.saved);

  return (
    <>
      <div className="tm-player">
        <div className="tm-player__stage">
          <button type="button" className="tm-player__play" aria-label="再生">
            <IconPlay size={28} />
          </button>
          <span className="tm-player__quality">
            画質 自動（回線状況に応じて切替）
          </span>
        </div>
        <div className="tm-player__bar">
          <span className="tm-player__elapsed">{video.chapters[active].at}</span>
          <span className="tm-player__track">
            <i style={{ width: `${(active / video.chapters.length) * 100 + 6}%` }} />
          </span>
          <span className="tm-player__total">{video.duration}</span>
        </div>
      </div>

      <div className="tm-scroll">
        <div className="tm-pad">
          <h1 className="tm-vtitle">{video.title}</h1>
          <p className="tm-vmeta">
            {machineName}・{video.part}・{video.updatedAt} 更新
          </p>
          <p className="tm-vsummary">{video.summary}</p>

          <div className="tm-vactions">
            <button
              type="button"
              className={saved ? "tm-vaction tm-vaction--on" : "tm-vaction"}
              onClick={() => setSaved((v) => !v)}
            >
              {saved ? <IconCheck size={20} /> : <IconDownload size={20} />}
              {saved ? "オフライン保存済み" : "オフラインに保存"}
            </button>
            <button type="button" className="tm-vaction">
              <IconShare size={20} />
              共有
            </button>
          </div>

          <div className="tm-section-label">
            <span>チャプター</span>
            <span>{video.chapters.length}件</span>
          </div>

          <div className="tm-card">
            {video.chapters.map((c, i) => (
              <button
                key={c.at}
                type="button"
                className="tm-chapter"
                data-on={i === active}
                onClick={() => setActive(i)}
              >
                <span className="tm-chapter__at">{c.at}</span>
                <span className="tm-chapter__title">{c.title}</span>
                {i === active ? <IconPlay size={16} /> : null}
              </button>
            ))}
          </div>

          <Link href="/tomarun/records/new" className="tm-row tm-card" style={{ marginTop: 16 }}>
            <span className="tm-row__icon">
              <IconRecord size={20} />
            </span>
            <span className="tm-row__body">
              <b>この作業を記録に残す</b>
              <span>動画の内容が対応内容の下書きに入ります</span>
            </span>
            <IconChevronRight className="tm-row__chev" />
          </Link>

          <p className="tm-field__hint" style={{ marginTop: 14 }}>
            <IconOffline size={14} /> 電波が不安定な場所では、保存済みの動画のみ再生できます。
          </p>
        </div>
      </div>
    </>
  );
}
