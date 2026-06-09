"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace(params.get("next") || "/");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "ログインできませんでした");
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit} className="card p-8 w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8cff] to-[#8b5bff] flex items-center justify-center font-black text-white">
            F
          </div>
          <div className="font-bold text-lg">FLYHEIT</div>
        </div>
        <label className="label">パスコード</label>
        <input
          className="input text-center tracking-[4px]"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="••••••"
          autoFocus
        />
        {error && <p className="neg text-[13px] mt-2">{error}</p>}
        <button
          type="submit"
          disabled={loading || !passcode}
          className="btn btn-primary w-full mt-5 disabled:opacity-50"
        >
          {loading ? "確認中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
