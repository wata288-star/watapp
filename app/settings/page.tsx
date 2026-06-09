"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export default function SettingsPage() {
  const [rate, setRate] = useState(150);
  const [msg, setMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const s = await fetch("/api/settings").then((r) => r.json());
    setRate(Number(s.usdjpy) || 150);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const saveRate = async (v: number) => {
    setRate(v);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdjpy: v }),
    });
  };

  const exportData = async () => {
    const res = await fetch("/api/backup");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flyheit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("バックアップをダウンロードしました");
  };

  const importData = async (file: File) => {
    if (
      !confirm(
        "現在の全データを、選んだファイルの内容で置き換えます。よろしいですか？",
      )
    )
      return;
    setImporting(true);
    setMsg(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const d = await res.json();
      setMsg(res.ok ? "復元しました" : d.error || "復元に失敗しました");
    } catch {
      setMsg("ファイルを読み込めませんでした");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <header>
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-[13px] text-[var(--muted)] mt-0.5">
          為替レート・データのバックアップ
        </p>
      </header>

      {msg && (
        <div className="card px-4 py-2.5 text-[13px] text-[var(--muted)]">
          {msg}
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-bold text-[15px] mb-1">為替レート</h2>
        <p className="text-[12px] text-[var(--muted)] mb-3">
          米国株の円換算に使用します（株式ページの「現在値を更新」でも自動取得）
        </p>
        <label className="label">USD / JPY</label>
        <input
          className="input !w-40"
          type="number"
          value={rate}
          onChange={(e) => saveRate(Number(e.target.value) || 0)}
        />
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-[15px] mb-1">バックアップ</h2>
        <p className="text-[12px] text-[var(--muted)] mb-3">
          全データ（資産・株式・案件・収支・目標・タスク・推移）をJSONで保存／復元できます。
          定期的にエクスポートして手元に控えておくと安心です。
        </p>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={exportData}>
            ↓ エクスポート（ダウンロード）
          </button>
          <button
            className="btn btn-ghost"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? "復元中..." : "↑ インポート（復元）"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
            }}
          />
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-3">
          ※ インポートは現在のデータを上書きします。先にエクスポートしておくことを推奨。
        </p>
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-[15px] mb-1">FLYHEIT 人生管理システム</h2>
        <p className="text-[12px] text-[var(--muted)]">
          株式会社FLYHEIT のパーソナル経営ダッシュボード。データは SQLite に保存され、
          資産推移は毎月自動で記録されます。
        </p>
      </div>
    </div>
  );
}
