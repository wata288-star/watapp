"use client";

import { useActionState, useRef } from "react";
import { login } from "@/app/actions/karte";

const DEMO_ACCOUNTS = [
  {
    label: "大和精密工業 / 製造部長(管理者)",
    note: "証明書発行・売却相談を含む全機能",
    loginId: "yamato-admin",
  },
  {
    label: "大和精密工業 / 設備保全担当(現場)",
    note: "スマホ版での記録入力に最適",
    loginId: "yamato-field",
  },
  {
    label: "北陸フーズ / 品質管理課長(管理者)",
    note: "食品機械・HACCP衛生記録のデモ",
    loginId: "hokuriku-admin",
  },
];

export function LoginForm({ dest, next }: { dest: string; next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  const idRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="dest" value={dest} />
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="loginId" className="mk-label mb-1.5 block">
          ログインID
        </label>
        <input
          ref={idRef}
          id="loginId"
          name="loginId"
          autoComplete="username"
          required
          className="w-full border border-line2 bg-panel px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy"
        />
      </div>
      <div>
        <label htmlFor="password" className="mk-label mb-1.5 block">
          パスワード
        </label>
        <input
          ref={pwRef}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full border border-line2 bg-panel px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy"
        />
      </div>

      {state?.error && (
        <p className="border border-alert/30 bg-alertsoft px-3.5 py-2.5 text-sm text-alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy2 disabled:opacity-60"
      >
        {pending ? "認証中..." : "ログイン"}
      </button>

      <div className="pt-2">
        <p className="mk-label mb-2.5">デモアカウント(選択すると入力されます)</p>
        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.loginId}
              type="button"
              onClick={() => {
                if (idRef.current) idRef.current.value = acc.loginId;
                if (pwRef.current) pwRef.current.value = "demo";
              }}
              className="block w-full border border-line bg-panel2 px-3.5 py-2.5 text-left transition-colors hover:border-navy"
            >
              <span className="block text-[13px] font-medium text-ink">{acc.label}</span>
              <span className="mt-0.5 block text-xs text-ink3">
                {acc.note} — ID: <span className="font-mono">{acc.loginId}</span> / PW:{" "}
                <span className="font-mono">demo</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
