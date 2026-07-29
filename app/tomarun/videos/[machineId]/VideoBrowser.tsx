"use client";

import Link from "next/link";
import { useState } from "react";
import { IconChevronRight, IconOffline, IconPlay } from "../../components/icons";
import type { Video } from "../../lib/data";

export default function VideoBrowser({
  machineId,
  parts,
  videos,
}: {
  machineId: string;
  parts: string[];
  videos: Video[];
}) {
  const [part, setPart] = useState<string>("すべて");
  const list = part === "すべて" ? videos : videos.filter((v) => v.part === part);

  return (
    <div className="tm-pad">
      <div className="tm-chiprow">
        {["すべて", ...parts].map((p) => (
          <button
            key={p}
            type="button"
            className="tm-chip tm-chip--sm"
            data-on={p === part}
            onClick={() => setPart(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="tm-section-label">
        <span>{part === "すべて" ? "すべての動画" : part}</span>
        <span>{list.length}件</span>
      </div>

      <div className="tm-stack">
        {list.map((v) => (
          <Link key={v.id} href={`/tomarun/videos/${machineId}/${v.id}`} className="tm-vrow">
            <span className="tm-vrow__thumb">
              <IconPlay size={20} />
              <i>{v.duration}</i>
            </span>
            <span className="tm-vrow__body">
              <b>{v.title}</b>
              <span>
                {v.part}・チャプター {v.chapters.length}件
              </span>
              {v.saved ? (
                <span className="tm-badge tm-badge--green">
                  <IconOffline size={13} />
                  オフライン保存済み
                </span>
              ) : null}
            </span>
            <IconChevronRight className="tm-row__chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
